import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateProductivityMonth, resolveProductivityMonth, type ProductivityPeriod } from './productivity-month-aggregation';

const period = (end: string, members: ProductivityPeriod['members']): ProductivityPeriod => ({ periodEndDate: end, members });

test('owns complete periods by inclusive period-end month and aggregates without date slicing', () => {
  const result = aggregateProductivityMonth('2026-06', [
    period('2026-06-05', [{ id: 'a', name: 'Ada', group: 'Loan', board: 'A', spTotal: 3, wpTotal: 2, workingDays: 5 }]),
    period('2026-06-30', [{ id: 'a', name: 'Ada', group: 'Loan', board: 'B', spTotal: 4, wpTotal: 1, workingDays: 7 }]),
    period('2026-07-01', [{ id: 'a', name: 'Ada', group: 'Loan', board: 'A', spTotal: 99, wpTotal: 99, workingDays: 1 }]),
  ]);
  assert.equal(result.periods, 2);
  assert.deepEqual(result.members[0], { id: 'a', name: 'Ada', group: 'Loan', board: 'A', boards: ['A', 'B'], spTotal: 7, wpTotal: 3, workingDays: 7 });
});

test('resolves a month independently and never blends snapshot with Jira', async () => {
  const calls: string[] = [];
  const result = await resolveProductivityMonth('2026-06', {
    snapshot: async () => ({ periods: [period('2026-06-30', [{ id: 'a', name: 'Ada', group: 'Loan', board: 'A', spTotal: 8, wpTotal: 0, workingDays: 1 }])], coverage: { expected: 1, covered: 1, cutoff: false } }),
    jira: async () => { calls.push('jira'); return [{ id: 'a', name: 'Ada', group: 'Loan', board: 'A', spTotal: 1, wpTotal: 1, workingDays: 1 }]; },
  });
  assert.equal(result.source, 'snapshot');
  assert.equal(result.members[0].spTotal, 8);
  assert.deepEqual(calls, []);
});

test('archive wins and incomplete snapshot evidence falls through to Jira', async () => {
  let jiraCalls = 0;
  const archive = await resolveProductivityMonth('2026-06', {
    archive: async () => ({ periods: [period('2026-06-30', [])], coverage: { expected: 1, covered: 1, cutoff: false } }),
    snapshot: async () => ({ periods: [], coverage: { expected: 1, covered: 0, cutoff: false } }),
    jira: async () => { jiraCalls++; return []; },
  });
  assert.equal(archive.source, 'archive');
  assert.equal(jiraCalls, 0);

  const fallback = await resolveProductivityMonth('2026-06', {
    snapshot: async () => ({ periods: [period('2026-06-30', [])], coverage: { expected: 2, covered: 1, cutoff: false } }),
    jira: async () => { jiraCalls++; return []; },
  });
  assert.equal(fallback.source, 'jira');
  assert.equal(jiraCalls, 1);
});

test('falls back to Jira with a machine-readable month rejection when stored periods are unusable', async () => {
  let jiraCalls = 0;
  const result = await resolveProductivityMonth('2026-06', {
    snapshot: async () => ({
      periods: [period('not-a-date', [])],
      coverage: { expected: 1, covered: 1, cutoff: false },
    }),
    jira: async () => { jiraCalls++; return []; },
  });
  assert.equal(result.source, 'jira');
  assert.equal(jiraCalls, 1);
  assert.equal(result.attempts?.[0].detail, 'NO_COMPLETE_PERIODS_FOR_MONTH');
  assert.equal(result.attempts?.[1].source, 'jira');
});
