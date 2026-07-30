import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductivitySummaryRangePorts } from './productivity-summary-range.ports';

const board = (overrides: Record<string, unknown>) => ({
  id: '1', boardId: 1, name: 'Loan', shortName: 'LN', reportingGroup: 'Loan', ...overrides,
}) as never;
const bug = (created: string) => ({ fields: { created } }) as never;

test('loads live productivity by Group boards and counts every bug created in month', async () => {
  const ports = createProductivitySummaryRangePorts({
    findBoards: async () => [
      board({ boardId: 1, shortName: 'LN', reportingGroup: 'Loan' }),
      board({ boardId: 2, shortName: 'LN2', reportingGroup: 'Loan' }),
      board({ boardId: 3, shortName: 'BROKEN', reportingGroup: 'Loan' }),
      board({ boardId: 4, shortName: 'LNBUG', reportingGroup: 'Loan', isBugMonitoring: true }),
    ],
    findMembers: async () => [{ fullName: 'Dev', email: 'dev@example.com' }] as never,
    loadBoard: async (_month, _year, team) => {
      if (team === 'BROKEN') throw new Error('Jira unavailable');
      return [{ name: 'Dev', team, spTotal: team === 'LN' ? 8 : 2, wpTotal: team === 'LN' ? 5 : 1, workingDays: 1 }] as never;
    },
    routeMonth: async () => ({ source: 'live', metricBasis: null, rows: null, failure: null }),
    fetchBugs: async () => [bug('2026-01-01'), bug('2026-01-31'), bug('2026-02-01')],
    resolveRule: async () => ({ ruleVersion: 'v3' }),
  });

  const month = await ports.loadMonth('2026-01', ['Loan']);
  assert.equal(month.source, 'partial');
  assert.deepEqual(month.members[0], { id: 'dev@example.com', name: 'Dev', group: 'Loan', board: 'LN', boards: ['LN', 'LN2'], spTotal: 10, wpTotal: 6, workingDays: 1 });
  assert.deepEqual(month.failures, [{ scope: 'productivity', group: 'Loan', board: 'BROKEN', reason: 'Jira unavailable' }]);
  assert.equal(await ports.loadBugCount('2026-01', 'Loan'), 2);
});

test('loads archive rows with historical Group and board snapshots', async () => {
  const ports = createProductivitySummaryRangePorts({
    findBoards: async () => [],
    findMembers: async () => [{ email: 'dev@example.com', joinDate: '2025-01-01', resignDate: '2026-06-30' }] as never,
    loadBoard: async () => { throw new Error('must not load live'); },
    routeMonth: async () => ({
      source: 'archive', metricBasis: 'SP', failure: null,
      rows: [
        { developerIdentityNormalized: 'dev@example.com', developerNameSnapshot: 'Dev', reportingGroupSnapshot: 'User', boardNameSnapshot: 'Historical Board', boardIdSnapshot: 9, spTotal: 3, sourceStatus: 'N' },
        { developerIdentityNormalized: 'dev@example.com', developerNameSnapshot: 'Dev', reportingGroupSnapshot: 'User', boardNameSnapshot: 'Second Historical Board', boardIdSnapshot: 10, spTotal: 5, sourceStatus: 'Y' },
      ] as never,
    }),
    fetchBugs: async () => [],
    resolveRule: async () => ({ ruleVersion: 'legacy' }),
  });

  const month = await ports.loadMonth('2025-01', ['User']);
  assert.equal(month.source, 'archive');
  assert.deepEqual(month.members[0], { id: 'dev@example.com', name: 'Dev', group: 'User', board: 'Historical Board', boards: ['Historical Board', 'Second Historical Board'], spTotal: 8, wpTotal: null, workingDays: null });
  assert.deepEqual(month.appliedRules, []);
  assert.deepEqual(month.failures, []);
});

test('excludes a live identity attributed to multiple Groups', async () => {
  const ports = createProductivitySummaryRangePorts({
    findBoards: async () => [
      board({ shortName: 'LN', reportingGroup: 'Loan' }),
      board({ shortName: 'USR', reportingGroup: 'User' }),
    ],
    findMembers: async () => [{ fullName: 'Dev', email: 'dev@example.com' }] as never,
    loadBoard: async (_month, _year, team) => [{ name: 'Dev', team, spTotal: 1, wpTotal: 1, workingDays: 1 }] as never,
    routeMonth: async () => ({ source: 'live', metricBasis: null, rows: null, failure: null }),
    fetchBugs: async () => [],
    resolveRule: async () => ({ ruleVersion: 'v3' }),
  });
  const month = await ports.loadMonth('2026-06', ['Loan', 'User']);
  assert.deepEqual(month.members, []);
  assert.equal(month.failures?.some(failure => failure.reason === 'MULTIPLE_REPORTING_GROUPS'), true);
});

test('excludes an archive identity attributed to multiple Groups', async () => {
  const ports = createProductivitySummaryRangePorts({
    findBoards: async () => [], findMembers: async () => [{ email: 'dev@example.com', joinDate: '2025-01-01', resignDate: null }] as never,
    loadBoard: async () => { throw new Error('must not load live'); },
    routeMonth: async () => ({ source: 'archive', metricBasis: 'SP', failure: null, rows: [
      { developerIdentityNormalized: 'dev@example.com', developerNameSnapshot: 'Dev', reportingGroupSnapshot: 'Loan', boardNameSnapshot: 'LN', spTotal: 1, sourceStatus: 'Y' },
      { developerIdentityNormalized: 'dev@example.com', developerNameSnapshot: 'Dev', reportingGroupSnapshot: 'User', boardNameSnapshot: 'USR', spTotal: 1, sourceStatus: 'Y' },
    ] as never }),
    fetchBugs: async () => [], resolveRule: async () => ({ ruleVersion: 'legacy' }),
  });
  const month = await ports.loadMonth('2025-01', ['Loan', 'User']);
  assert.deepEqual(month.members, []);
  assert.equal(month.failures?.some(failure => failure.reason === 'MULTIPLE_REPORTING_GROUPS'), true);
});
