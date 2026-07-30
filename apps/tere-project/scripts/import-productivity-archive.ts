import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import postgres from 'postgres';
import { assertSupabaseTarget } from './productivity-archive-import-target';

config({ path: '.env', quiet: true });

async function main(): Promise<void> {
  const downloads = join(homedir(), 'Downloads');
  const output = join(downloads, 'productivity-archive-import-phase1');
  const execute = process.argv.includes('--execute');
  const projectRef = process.argv.find(value => value.startsWith('--confirm-project-ref='))?.split('=', 2)[1];

  execFileSync('python3', [
    'scripts/generate-productivity-archive-import.py',
    '--green', join(downloads, 'Engineering Team Performance 2025.xlsx'),
    '--blue', join(downloads, 'Engineering_Team_Performance_2026_v2.xlsx'),
    '--members', join(downloads, 'members_rows.csv'),
    '--boards', join(downloads, 'boards_rows.csv'),
    '--output', output,
  ], { stdio: 'inherit' });

  if (!execute) {
    console.log(`Generated and validated: ${join(output, 'supabase_import_all.sql')}`);
    console.log('DB untouched. Add --execute --confirm-project-ref=PROJECT_REF to import.');
    return;
  }

  if (!projectRef) throw new Error('--confirm-project-ref is required with --execute');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is missing from apps/tere-project/.env');
  assertSupabaseTarget(databaseUrl, projectRef);

  const sql = postgres(databaseUrl, { prepare: false, max: 1, connect_timeout: 15 });
  try {
    const [schema] = await sql<[{ archive_table: string | null; coverage_table: string | null }]>`
    SELECT to_regclass('public.productivity_archive_developer_sprint')::text AS archive_table,
           to_regclass('public.productivity_archive_coverage')::text AS coverage_table
  `;
    if (!schema.archive_table || !schema.coverage_table) throw new Error('migration 0009 is not installed');

    const importSql = readFileSync(join(output, 'supabase_import_all.sql'), 'utf8');
    await sql.unsafe(importSql);

    const [result] = await sql<[{ months: number; rows: number }]>`
    SELECT COUNT(*)::integer AS months, COALESCE(SUM(row_count), 0)::integer AS rows
    FROM productivity_archive_coverage
    WHERE archived_month BETWEEN DATE '2025-01-01' AND DATE '2026-06-01'
  `;
    if (result.months !== 18 || result.rows !== 2125) {
      throw new Error(`verification failed: expected 18 months/2125 rows, got ${result.months}/${result.rows}`);
    }
    console.log('Import verified: 18 months, 2125 rows.');
  } finally {
    await sql.end();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
