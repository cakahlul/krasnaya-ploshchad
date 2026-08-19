/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import test from 'node:test';
import { teamReportingCaptureRuns } from '@server/db/schema';
import { DrizzleCaptureRunRepository } from './report-capture-run.repository';

class FakeDatabase {
  run: any = null;
  failures: any[] = [];

  insert(table: unknown) {
    return {
      values: (values: any) => ({
        returning: async () => {
          if (table === teamReportingCaptureRuns) {
            this.run = { ...values, id: 'run-1', startedAt: new Date('2026-08-19T00:00:00Z'), completedAt: null };
            return [this.run];
          }
          const rows = Array.isArray(values) ? values : [values];
          this.failures.push(...rows.map(value => ({ ...value, id: `failure-${this.failures.length + 1}` })));
          return this.failures;
        },
      }),
    };
  }

  update(table: unknown) {
    return {
      set: (values: any) => ({
        where: () => ({
          returning: async () => {
            if (table !== teamReportingCaptureRuns || !this.run) return [];
            this.run = { ...this.run, ...values };
            return [this.run];
          },
        }),
      }),
    };
  }
}

function repository(fake: FakeDatabase): DrizzleCaptureRunRepository {
  return new DrizzleCaptureRunRepository(fake as never);
}

test('creates running capture evidence before board processing', async () => {
  const fake = new FakeDatabase();
  const run = await repository(fake).create({
    actor: 'System',
    window: { startDate: '2026-08-01', endDate: '2026-08-31' },
  });

  assert.equal(run.status, 'running');
  assert.equal(run.attempted, 0);
  assert.equal(run.succeeded, 0);
  assert.equal(run.failed, 0);
  assert.equal(run.unchanged, 0);
  assert.equal(run.completedAt, null);
});

test('records bounded board-period failures and terminal counters', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  const run = await repo.create({ actor: 'developer@example.com', window: { startDate: '2026-01-01', endDate: '2026-01-31' } });

  await repo.recordFailure(run.id, { boardId: 42, period: '123', reason: 'Jira said: token=secret' });
  const completed = await repo.complete(run.id, {
    status: 'partial', attempted: 3, succeeded: 1, failed: 1, unchanged: 1,
  });

  assert.equal(fake.failures.length, 1);
  assert.deepEqual(fake.failures[0], {
    id: 'failure-1', runId: 'run-1', boardId: 42, period: '123', reason: 'CAPTURE_PERIOD_FAILED',
  });
  assert.equal(completed.status, 'partial');
  assert.equal(completed.completedAt instanceof Date, true);
  assert.equal(completed.attempted, 3);
  assert.equal(completed.succeeded, 1);
  assert.equal(completed.failed, 1);
  assert.equal(completed.unchanged, 1);
});

test('allows a zero-eligible completed run after discovery', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  const run = await repo.create({ actor: 'System', window: { startDate: '2026-08-01', endDate: '2026-08-31' } });

  const completed = await repo.complete(run.id, {
    status: 'complete', attempted: 0, succeeded: 0, failed: 0, unchanged: 0,
  });

  assert.equal(completed.status, 'complete');
  assert.equal(completed.completedAt instanceof Date, true);
});

test('persists a failed terminal run', async () => {
  const fake = new FakeDatabase();
  const repo = repository(fake);
  const run = await repo.create({ actor: 'System', window: { startDate: '2026-08-01', endDate: '2026-08-31' } });

  const completed = await repo.complete(run.id, {
    status: 'failed', attempted: 1, succeeded: 0, failed: 1, unchanged: 0,
  });

  assert.equal(completed.status, 'failed');
  assert.equal(completed.completedAt instanceof Date, true);
});
