/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import test from 'node:test';
import { teamReportingCaptureSnapshotAudits } from '@server/db/schema';
import { insertCaptureSnapshotAudit } from './report-capture-audit.repository';

class FakeTransaction {
  snapshot = 'previous';
  audits: any[] = [];

  insert(table: unknown) {
    return {
      values: (values: any) => ({
        returning: async () => {
          if (table !== teamReportingCaptureSnapshotAudits) throw new Error('UNEXPECTED_TABLE');
          const row = { ...values, id: `audit-${this.audits.length + 1}`, createdAt: new Date('2026-08-19T00:00:00Z') };
          this.audits.push(row);
          return [row];
        },
      }),
    };
  }

  async transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    const before = { snapshot: this.snapshot, audits: [...this.audits] };
    try { return await callback(this); } catch (error) {
      this.snapshot = before.snapshot;
      this.audits = before.audits;
      throw error;
    }
  }
}

function audit() {
  return {
    runId: 'run-1',
    snapshotId: 'snapshot-1',
    previousRawInputChecksum: 'a'.repeat(64),
    nextRawInputChecksum: 'b'.repeat(64),
    previousCalculatedOutputChecksum: 'c'.repeat(64),
    nextCalculatedOutputChecksum: 'd'.repeat(64),
    addedJiraKeys: ['ABC-2'],
    removedJiraKeys: ['ABC-1'],
    changedJiraKeys: [{ key: 'ABC-3', fields: [{ path: '$.summary', previous: 'Old', next: 'New' }] }],
    calculatedPaths: ['$.details[0].wp'],
    summary: { added: 1, removed: 1, changed: 1 },
  };
}

test('records structured snapshot audit evidence inside the caller transaction', async () => {
  const fake = new FakeTransaction();

  await fake.transaction(async tx => {
    tx.snapshot = 'next';
    await insertCaptureSnapshotAudit(tx as never, audit());
  });

  assert.equal(fake.snapshot, 'next');
  assert.deepEqual(fake.audits[0].addedJiraKeys, ['ABC-2']);
  assert.deepEqual(fake.audits[0].changedJiraKeys, [{ key: 'ABC-3', fields: [{ path: '$.summary', previous: 'Old', next: 'New' }] }]);
  assert.equal(fake.audits[0].previousRawInputChecksum, 'a'.repeat(64));
  assert.equal(fake.audits[0].nextCalculatedOutputChecksum, 'd'.repeat(64));
});

test('rolls back audit evidence when snapshot publication fails', async () => {
  const fake = new FakeTransaction();

  await assert.rejects(() => fake.transaction(async tx => {
    tx.snapshot = 'next';
    await insertCaptureSnapshotAudit(tx as never, audit());
    throw new Error('SNAPSHOT_PUBLICATION_FAILED');
  }), /SNAPSHOT_PUBLICATION_FAILED/);

  assert.equal(fake.snapshot, 'previous');
  assert.deepEqual(fake.audits, []);
});

test('redacts sensitive changed values before persistence', async () => {
  const fake = new FakeTransaction();
  const input = audit();
  input.changedJiraKeys = [{ key: 'ABC-3', fields: [{ path: '$.authorization', previous: 'old-secret', next: 'new-secret' }] }];
  input.summary = { apiKey: 'secret' };

  await insertCaptureSnapshotAudit(fake as never, input);

  assert.deepEqual(fake.audits[0].changedJiraKeys[0].fields[0], {
    path: '$.authorization', previous: '[REDACTED]', next: '[REDACTED]',
  });
  assert.deepEqual(fake.audits[0].summary, { apiKey: '[REDACTED]' });
});
