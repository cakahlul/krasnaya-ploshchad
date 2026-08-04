#!/usr/bin/env node
// Turns the "Incident Close" sheet (CSV export: Tiket,Close Date in M/D/YYYY) into one idempotent
// INSERT for bug_close_override, printed to stdout.
//
//   node scripts/bug-close-override-seed.mjs "~/Downloads/Incident Close - Sheet1.csv" > seed.sql
//   psql "$DATABASE_URL" -f seed.sql        # or paste into the Supabase SQL editor
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/bug-close-override-seed.mjs <csv-path>');
  process.exit(1);
}

const KEY = /^[A-Z][A-Z0-9]*-\d+$/;

const rows = readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean)
  .slice(1) // header
  .map((line, index) => {
    const [key, date] = line.split(',').map(cell => cell.trim());
    if (!KEY.test(key ?? '')) throw new Error(`line ${index + 2}: bad ticket key ${JSON.stringify(key)}`);
    const [month, day, year] = (date ?? '').split('/');
    if (!month || !day || !year) throw new Error(`line ${index + 2}: bad date ${JSON.stringify(date)} for ${key} (want M/D/YYYY)`);
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    if (Number.isNaN(Date.parse(`${iso}T00:00:00Z`))) throw new Error(`line ${index + 2}: impossible date ${date} for ${key}`);
    return { key, iso };
  });

// Last occurrence wins, so a re-exported sheet with a corrected row doesn't emit two conflicting
// values for the same key in one statement (Postgres rejects that outright).
const byKey = new Map(rows.map(row => [row.key, row.iso]));
if (byKey.size !== rows.length) console.error(`note: ${rows.length - byKey.size} duplicate key(s) collapsed, last row wins`);

const values = [...byKey].map(([key, iso]) => `  ('${key}', '${iso}')`).join(',\n');
console.log(`INSERT INTO bug_close_override (key, closed_date) VALUES
${values}
ON CONFLICT (key) DO UPDATE SET closed_date = EXCLUDED.closed_date;`);
console.error(`${byKey.size} override(s) emitted`);
