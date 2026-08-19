import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('reconciles snapshot history before additive capture-evidence DDL', async () => {
  const [journalFile, runMigration, auditMigration, failureReasonMigration] = await Promise.all([
    readFile('drizzle/meta/_journal.json', 'utf8'),
    readFile('drizzle/0016_capture_run_evidence.sql', 'utf8'),
    readFile('drizzle/0017_capture_snapshot_audit.sql', 'utf8'),
    readFile('drizzle/0018_capture_run_failure_reason.sql', 'utf8'),
  ]);
  const journal = JSON.parse(journalFile) as { entries: Array<{ idx: number; tag: string }> };

  assert.deepEqual(journal.entries.slice(-5).map(({ idx, tag }) => ({ idx, tag })), [
    { idx: 14, tag: '0014_bug_close_override' },
    { idx: 15, tag: '0015_team_reporting_snapshot' },
    { idx: 16, tag: '0016_capture_run_evidence' },
    { idx: 17, tag: '0017_capture_snapshot_audit' },
    { idx: 18, tag: '0018_capture_run_failure_reason' },
  ]);
  assert.match(runMigration, /CREATE TABLE "team_reporting_capture_run"/);
  assert.match(runMigration, /CREATE TABLE "team_reporting_capture_failure"/);
  assert.match(runMigration, /FOREIGN KEY \("run_id"\) REFERENCES "team_reporting_capture_run"/);
  assert.match(runMigration, /CHECK \("reason" ~ '\^CAPTURE_\[A-Z_\]\{1,96\}\$'\)/);
  assert.match(auditMigration, /CREATE TABLE "team_reporting_capture_snapshot_audit"/);
  assert.match(auditMigration, /REFERENCES "team_reporting_snapshot"\("id"\)/);
  assert.match(auditMigration, /UNIQUE \("run_id", "snapshot_id"\)/);
  assert.doesNotMatch(`${runMigration}\n${auditMigration}`, /^(?:ALTER TABLE|DROP TABLE|UPDATE )/m);
  assert.match(failureReasonMigration, /ADD COLUMN "failure_reason" text/);
  assert.match(failureReasonMigration, /failure_reason.*CAPTURE_\[A-Z_\]/s);
});
