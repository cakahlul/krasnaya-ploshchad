import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('reconciles snapshot history before additive capture-evidence DDL', async () => {
  const [journalFile, migration] = await Promise.all([
    readFile('drizzle/meta/_journal.json', 'utf8'),
    readFile('drizzle/0016_capture_run_evidence.sql', 'utf8'),
  ]);
  const journal = JSON.parse(journalFile) as { entries: Array<{ idx: number; tag: string }> };

  assert.deepEqual(journal.entries.slice(-3).map(({ idx, tag }) => ({ idx, tag })), [
    { idx: 14, tag: '0014_bug_close_override' },
    { idx: 15, tag: '0015_team_reporting_snapshot' },
    { idx: 16, tag: '0016_capture_run_evidence' },
  ]);
  assert.match(migration, /CREATE TABLE "team_reporting_capture_run"/);
  assert.match(migration, /CREATE TABLE "team_reporting_capture_failure"/);
  assert.match(migration, /FOREIGN KEY \("run_id"\) REFERENCES "team_reporting_capture_run"/);
  assert.match(migration, /CHECK \("reason" ~ '\^CAPTURE_\[A-Z_\]\{1,96\}\$'\)/);
  assert.doesNotMatch(migration, /^(?:ALTER TABLE|DROP TABLE|UPDATE )/m);
});
