import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductivitySummaryRangePorts, SP_PER_WORKING_DAY } from './productivity-summary-range.ports';
import { generateProductivitySummaryRange, type RangeAggregationPorts } from './productivity-summary-range.service';

function archiveRow(overrides: Record<string, unknown>) {
  return {
    archivedMonth: '2025-06-01',
    importBatchId: 'batch-1',
    sprintId: 'S1',
    sprintStartDate: '2025-06-01',
    sprintEndDate: '2025-06-30',
    boardIdSnapshot: 1,
    boardNameSnapshot: 'Ambis',
    reportingGroupSnapshot: 'User' as const,
    developerIdentityNormalized: 'budi@amarbank.co.id',
    developerNameSnapshot: 'Budi',
    sourceStatus: 'Y',
    spTotal: 96,
    spTarget: 160,
    workingDays: null,
    ...overrides,
  };
}

function portsWithRows(rows: ReturnType<typeof archiveRow>[]) {
  return createProductivitySummaryRangePorts({
    findBoards: async () => [],
    findMembers: async () => [
      { email: 'budi@amarbank.co.id', fullName: 'Budi', joinDate: '2020-01-01', resignDate: null } as never,
    ],
    loadBoard: async () => [],
    routeMonth: async () => ({ source: 'archive', metricBasis: 'SP', rows, failure: null }) as never,
    fetchBugs: async () => [],
    resolveRule: async () => ({ ruleVersion: 'v3' as never }),
  });
}

test('recovers working days from the SP target when the source had no day-of-work column', async () => {
  const ports = portsWithRows([archiveRow({ workingDays: null, spTarget: 160 })]);
  const month = await ports.loadMonth('2025-06', ['User']);
  assert.equal(month.members?.[0].workingDays, 160 / SP_PER_WORKING_DAY);
});

test('prefers a real day-of-work value over the derived one', async () => {
  const ports = portsWithRows([archiveRow({ workingDays: 18, spTarget: 160 })]);
  const month = await ports.loadMonth('2025-06', ['User']);
  assert.equal(month.members?.[0].workingDays, 18, 'a recorded value must win over arithmetic');
});

test('reports nothing when neither a day-of-work nor an SP target exists', async () => {
  const ports = portsWithRows([archiveRow({ workingDays: null, spTarget: null })]);
  const month = await ports.loadMonth('2025-06', ['User']);
  assert.equal(month.members?.[0].workingDays, null, 'an absent figure must not become zero');
});

function summaryPorts(months: Record<string, { spTotal: number; spTarget: number }>): RangeAggregationPorts {
  return {
    loadMonth: async (month) => ({
      source: 'archive',
      archiveBacked: true,
      availability: { productivity: true },
      appliedRules: [],
      failures: [],
      members: [{
        id: 'a',
        name: 'A',
        group: 'User',
        board: 'SLS',
        boards: ['SLS'],
        spTotal: months[month].spTotal,
        wpTotal: 10,
        spTarget: months[month].spTarget,
        workingDays: months[month].spTarget / SP_PER_WORKING_DAY,
      }],
    }),
    loadBugCount: async () => 0,
  };
}

test('the headline percentage is delivered SP over target SP across the range', async () => {
  const result = await generateProductivitySummaryRange(
    { months: ['2025-01', '2025-02'], selectedGroups: ['User'], metricBasis: 'SP' },
    summaryPorts({
      '2025-01': { spTotal: 80, spTarget: 160 },
      '2025-02': { spTotal: 120, spTarget: 160 },
    }),
  );

  // 200 delivered against 320 of capacity. Averaging the two monthly percentages would also give
  // 62.5 here, but weighting by capacity is what stays correct once months differ in size.
  assert.equal(result.summary.productivityPercent, 62.5);
});

test('a zero-productivity month does not blow up the headline percentage', async () => {
  const result = await generateProductivitySummaryRange(
    { months: ['2025-01', '2025-02'], selectedGroups: ['User'], metricBasis: 'SP' },
    summaryPorts({
      '2025-01': { spTotal: 0, spTarget: 160 },
      '2025-02': { spTotal: 160, spTarget: 160 },
    }),
  );

  assert.equal(result.summary.productivityPercent, 50);
});

test('a WP basis leaves the headline percentage SP-based rather than mixing units', async () => {
  const result = await generateProductivitySummaryRange(
    { months: ['2026-06'], selectedGroups: ['User'], metricBasis: 'WP' },
    {
      loadMonth: async () => ({
        source: 'live',
        availability: { productivity: true },
        appliedRules: [],
        failures: [],
        members: [{ id: 'a', name: 'A', group: 'User', board: 'SLS', boards: ['SLS'], spTotal: 80, wpTotal: 10, spTarget: 160, workingDays: 20 }],
      }),
      loadBugCount: async () => 0,
    },
  );

  assert.equal(result.metricBasis, 'WP');
  assert.equal(result.summary.productivityMetric, 10, 'the delivered figure follows the WP basis');
  assert.equal(result.summary.productivityPercent, 50, 'the percentage stays SP over SP target');
});
