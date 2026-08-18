/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import test from 'node:test';
import { teamReportingSnapshotCoverage, teamReportingSnapshots } from '@server/db/schema';
import { DrizzleTeamReportingSnapshotRepository } from './report-snapshot.repository';
import { snapshotChecksum, type TeamReportingSnapshotPublication } from './report-snapshot';

function publication(): TeamReportingSnapshotPublication {
  const rawJiraInput = [{ key: 'ABC-1' }];
  const calculatedOutput = [{ member: 'Ada' }];
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
  failCoverageInsert = false;

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
        return {
          onConflictDoNothing: () => ({ returning: async () => {
            if (table === teamReportingSnapshots) {
              if (this.snapshot) return [];
              this.snapshot = { ...values, id: 'snapshot-1', requiredSegmentCount: values.requiredSegmentCount, capturedAt: new Date() };
              return [this.snapshot];
            }
            return writeCoverage();
          } }),
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
    const before = { snapshot: this.snapshot, coverage: [...this.coverage] };
    try { return await callback(this); } catch (error) {
      this.snapshot = before.snapshot;
      this.coverage = before.coverage;
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
  await assert.rejects(() => repo.publish({ ...publication(), snapshot: { ...publication().snapshot, calculatedOutput: null } }), /SNAPSHOT_INTEGRITY_INVALID/);
  assert.equal((await repo.findByLogicalIdentity({ boardId: 42, periodKind: 'scrum', sprintId: '123' }))?.id, first.id);
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
  changed.snapshot = { ...changed.snapshot, calculatedOutput: [{ member: 'Grace' }] };
  changed.snapshot.calculatedOutputChecksum = snapshotChecksum(changed.snapshot.calculatedOutput);
  changed.coverage = [{ segmentKey: 'members', rawInputCount: 1, calculatedOutputCount: 1, checksum: snapshotChecksum('members') }];
  fake.failCoverageInsert = true;

  await assert.rejects(() => repo.publish(changed), /COVERAGE_INSERT_FAILED/);
  assert.deepEqual(fake.snapshot.calculatedOutput, [{ member: 'Ada' }]);
  assert.deepEqual(fake.coverage.map(item => item.segmentKey), ['issues']);
});
