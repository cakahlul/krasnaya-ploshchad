/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import test from 'node:test';
import { teamReportingCaptureSnapshotAudits, teamReportingSnapshotCoverage, teamReportingSnapshots } from '@server/db/schema';
import { DrizzleTeamReportingSnapshotRepository } from './report-snapshot.repository';
import { snapshotChecksum, type TeamReportingSnapshotPublication } from './report-snapshot';

function publication(): TeamReportingSnapshotPublication {
  const rawJiraInput = { main: [{ key: 'ABC-1', summary: 'Old', token: 'old-token' }], planned: {} };
  const calculatedOutput = { totals: { points: 1 } };
  return {
    snapshot: {
      boardId: 42, boardName: 'Alpha', periodKind: 'scrum', sprintId: '123', sprintName: 'Sprint 123',
      periodStartDate: '2026-01-01', periodEndDate: '2026-01-14', reportingMonth: '2026-01-01',
      rawJiraInput, calculatedOutput, rawInputCount: 1, calculatedOutputCount: 1,
      rawInputChecksum: snapshotChecksum(rawJiraInput), calculatedOutputChecksum: snapshotChecksum(calculatedOutput),
      integrityEvidence: { source: 'jira' },
    },
    coverage: [{ segmentKey: 'issues', rawInputCount: 1, calculatedOutputCount: 1, checksum: snapshotChecksum('issues') }],
  };
}

class FakeDatabase {
  snapshot: any = null;
  coverage: any[] = [];
  audits: any[] = [];
  failCoverageInsert = false;
  failAuditInsert = false;

  select() {
    return this.selectRows();
  }

  selectRows() {
    const rows = (table: unknown) => table === teamReportingSnapshots ? (this.snapshot ? [this.snapshot] : []) : this.coverage;
    return { from: (table: unknown) => ({ where: () => {
      const result = rows(table);
      return { limit: async () => result.slice(0, 1), then: (resolve: (value: any[]) => unknown) => Promise.resolve(result).then(resolve) };
    } }) };
  }

  insert(table: unknown) {
    const operation = {
      values: (values: any) => {
        const writeCoverage = () => {
          if (this.failCoverageInsert) throw new Error('COVERAGE_INSERT_FAILED');
          this.coverage = values.map((value: any) => ({ ...value, id: `coverage-${this.coverage.length + 1}` }));
          return this.coverage;
        };
        const writeAudit = () => {
          if (this.failAuditInsert) throw new Error('AUDIT_INSERT_FAILED');
          const audit = { ...values, id: `audit-${this.audits.length + 1}`, createdAt: new Date() };
          this.audits.push(audit);
          return [audit];
        };
        return {
          onConflictDoNothing: () => ({ returning: async () => {
            if (table === teamReportingSnapshots) {
              if (this.snapshot) return [];
              this.snapshot = { ...values, id: 'snapshot-1', requiredSegmentCount: values.requiredSegmentCount, capturedAt: new Date() };
              return [this.snapshot];
            }
            return writeCoverage();
          } }),
          returning: async () => {
            if (table === teamReportingCaptureSnapshotAudits) return writeAudit();
            return writeCoverage();
          },
          then: (resolve: (value: any[]) => unknown, reject: (reason: unknown) => unknown) => {
            try { return Promise.resolve(writeCoverage()).then(resolve, reject); } catch (error) { return Promise.reject(error).then(resolve, reject); }
          },
        };
      },
    };
    return operation;
  }

  update(table: unknown) {
    return {
      set: (values: any) => ({
        where: () => ({
          returning: async () => {
            if (table !== teamReportingSnapshots || !this.snapshot) return [];
            this.snapshot = { ...this.snapshot, ...values };
            return [this.snapshot];
          },
        }),
      }),
    };
  }

  delete(table: unknown) {
    return {
      where: async () => {
        if (table === teamReportingSnapshotCoverage) this.coverage = [];
      },
    };
  }

  async transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    const before = { snapshot: this.snapshot, coverage: [...this.coverage], audits: [...this.audits] };
    try { return await callback(this); } catch (error) {
      this.snapshot = before.snapshot;
      this.coverage = before.coverage;
      this.audits = before.audits;
      throw error;
    }
  }
}

function repository(fake: FakeDatabase): DrizzleTeamReportingSnapshotRepository {
  return new DrizzleTeamReportingSnapshotRepository(fake as never);
}

test('hides corrupt or incomplete stored coverage on read', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  await repo.publish(publication());
  fake.coverage[0].checksum = 'corrupt';
  assert.equal(await repo.findByLogicalIdentity({ boardId: 42, periodKind: 'scrum', sprintId: '123' }), null);

  fake.coverage[0].checksum = snapshotChecksum('issues');
  fake.coverage.length = 0;
  assert.equal(await repo.findByLogicalIdentity({ boardId: 42, periodKind: 'scrum', sprintId: '123' }), null);

  fake.coverage.push({ segmentKey: 'issues', rawInputCount: 1, calculatedOutputCount: 1, checksum: snapshotChecksum('issues') });
  fake.snapshot.requiredSegmentCount = 2;
  assert.equal(await repo.findByLogicalIdentity({ boardId: 42, periodKind: 'scrum', sprintId: '123' }), null);
});

test('duplicate logical capture returns the existing complete record', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  const first = await repo.publish(publication());
  const second = await repo.publish(publication());
  assert.equal(second.id, first.id);
  assert.equal(fake.snapshot.id, first.id);
});

test('coverage insert failure rolls back the parent snapshot', async () => {
  const fake = new FakeDatabase();
  fake.failCoverageInsert = true;
  await assert.rejects(() => repository(fake).publish(publication()), /COVERAGE_INSERT_FAILED/);
  assert.equal(fake.snapshot, null);
  assert.deepEqual(fake.coverage, []);
});

test('invalid candidate cannot replace an existing complete snapshot', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  const first = await repo.publish(publication());
  await assert.rejects(() => repo.publishWithOutcome({ ...publication(), snapshot: { ...publication().snapshot, calculatedOutput: null } }, { runId: 'run-1' }), /SNAPSHOT_INTEGRITY_INVALID/);
  assert.equal((await repo.findByLogicalIdentity({ boardId: 42, periodKind: 'scrum', sprintId: '123' }))?.id, first.id);
  assert.deepEqual(fake.audits, []);
});

test('validated changed candidate atomically replaces complete snapshot', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  const first = await repo.publish(publication());
  const changed = publication();
  changed.snapshot = { ...changed.snapshot, calculatedOutput: [{ member: 'Grace' }] };
  changed.snapshot.calculatedOutputChecksum = snapshotChecksum(changed.snapshot.calculatedOutput);
  changed.coverage = [{ segmentKey: 'members', rawInputCount: 1, calculatedOutputCount: 1, checksum: snapshotChecksum('members') }];

  const replacement = await repo.publish(changed);
  assert.equal(replacement.id, first.id);
  assert.deepEqual(fake.snapshot.calculatedOutput, [{ member: 'Grace' }]);
  assert.deepEqual(fake.coverage.map(item => item.segmentKey), ['members']);
});

test('replacement write failure preserves the prior complete snapshot', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  await repo.publish(publication());
  const changed = publication();
  changed.snapshot = { ...changed.snapshot, calculatedOutput: { totals: { points: 2 } } };
  changed.snapshot.calculatedOutputChecksum = snapshotChecksum(changed.snapshot.calculatedOutput);
  changed.coverage = [{ segmentKey: 'members', rawInputCount: 1, calculatedOutputCount: 1, checksum: snapshotChecksum('members') }];
  fake.failCoverageInsert = true;

  await assert.rejects(() => repo.publishWithOutcome(changed, { runId: 'run-1' }), /COVERAGE_INSERT_FAILED/);
  assert.deepEqual(fake.snapshot.calculatedOutput, { totals: { points: 1 } });
  assert.deepEqual(fake.coverage.map(item => item.segmentKey), ['issues']);
  assert.deepEqual(fake.audits, []);
});

test('returns unchanged without mutating coverage or recording audit evidence', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  await repo.publish(publication());
  const before = { snapshot: fake.snapshot, coverage: fake.coverage };

  const outcome = await repo.publishWithOutcome(publication(), { runId: 'run-1' });

  assert.equal(outcome.kind, 'unchanged');
  assert.deepEqual(outcome.snapshot, before.snapshot);
  assert.equal(fake.coverage, before.coverage);
  assert.deepEqual(fake.audits, []);
});

test('replaces changed state and records one redacted structured audit in the same transaction', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  await repo.publish(publication());
  const changed = publication();
  changed.snapshot = {
    ...changed.snapshot,
    rawJiraInput: { main: [{ key: 'ABC-1', summary: 'New', token: 'new-token' }, { key: 'ABC-2', summary: 'Added' }], planned: {} },
    rawInputCount: 2,
    calculatedOutput: { totals: { points: 2 } },
  };
  changed.snapshot.rawInputChecksum = snapshotChecksum(changed.snapshot.rawJiraInput);
  changed.snapshot.calculatedOutputChecksum = snapshotChecksum(changed.snapshot.calculatedOutput);
  changed.coverage = [{ segmentKey: 'issues', rawInputCount: 2, calculatedOutputCount: 1, checksum: snapshotChecksum('issues-next') }];

  const outcome = await repo.publishWithOutcome(changed, { runId: 'run-1' });

  assert.equal(outcome.kind, 'replaced');
  assert.deepEqual(fake.coverage.map(item => item.segmentKey), ['issues']);
  assert.equal(fake.audits.length, 1);
  assert.deepEqual(fake.audits[0], {
    id: 'audit-1', createdAt: fake.audits[0].createdAt, runId: 'run-1', snapshotId: 'snapshot-1',
    previousRawInputChecksum: publication().snapshot.rawInputChecksum,
    nextRawInputChecksum: changed.snapshot.rawInputChecksum,
    previousCalculatedOutputChecksum: publication().snapshot.calculatedOutputChecksum,
    nextCalculatedOutputChecksum: changed.snapshot.calculatedOutputChecksum,
    addedJiraKeys: ['ABC-2'], removedJiraKeys: [],
    changedJiraKeys: [{ key: 'ABC-1', fields: [
      { path: '$.summary', previous: 'Old', next: 'New' },
      { path: '$.token', previous: '[REDACTED]', next: '[REDACTED]' },
    ] }],
    calculatedPaths: ['$.totals.points'],
    summary: {
      addedJiraKeyCount: 1, removedJiraKeyCount: 0, changedJiraKeyCount: 1,
      calculatedPathCount: 1, rawInputChanged: true, calculatedOutputChanged: true,
    },
  });
});

test('records removed Jira keys deterministically', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  const initial = publication();
  initial.snapshot = {
    ...initial.snapshot,
    rawJiraInput: { main: [{ key: 'ABC-1', summary: 'Old', token: 'old-token' }, { key: 'ABC-3', summary: 'Removed' }], planned: {} },
    rawInputCount: 2,
  };
  initial.snapshot.rawInputChecksum = snapshotChecksum(initial.snapshot.rawJiraInput);
  initial.coverage = [{ segmentKey: 'issues', rawInputCount: 2, calculatedOutputCount: 1, checksum: snapshotChecksum('issues-with-removed') }];
  await repo.publish(initial);

  await repo.publishWithOutcome(publication(), { runId: 'run-1' });

  assert.deepEqual(fake.audits[0].addedJiraKeys, []);
  assert.deepEqual(fake.audits[0].removedJiraKeys, ['ABC-3']);
});

test('audit failure preserves the prior complete snapshot and coverage', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  await repo.publish(publication());
  const changed = publication();
  changed.snapshot = { ...changed.snapshot, calculatedOutput: { totals: { points: 2 } } };
  changed.snapshot.calculatedOutputChecksum = snapshotChecksum(changed.snapshot.calculatedOutput);
  fake.failAuditInsert = true;

  await assert.rejects(() => repo.publishWithOutcome(changed, { runId: 'run-1' }), /AUDIT_INSERT_FAILED/);
  assert.deepEqual(fake.snapshot.calculatedOutput, { totals: { points: 1 } });
  assert.deepEqual(fake.coverage.map(item => item.segmentKey), ['issues']);
  assert.deepEqual(fake.audits, []);
});
