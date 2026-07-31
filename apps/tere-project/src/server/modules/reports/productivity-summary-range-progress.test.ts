import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateProductivitySummaryRange,
  type MonthSource,
  type RangeAggregationPorts,
  type RangeProgressEvent,
} from './productivity-summary-range.service';

function member(id: string, spTotal: number, wpTotal: number) {
  return {
    id,
    name: id,
    group: 'User' as const,
    board: 'SLS',
    boards: ['SLS'],
    spTotal,
    wpTotal,
    spTarget: 160,
    workingDays: 20,
  };
}

function portsFor(sources: Record<string, MonthSource>): RangeAggregationPorts {
  return {
    loadMonth: async (month) => ({
      source: sources[month],
      archiveBacked: sources[month] === 'archive',
      availability: { productivity: true },
      members: [member('a', 120, 30), member('b', 80, 20)],
      appliedRules: [],
      failures: [],
    }),
    loadBugCount: async () => 4,
    loadBugRaisedCount: async () => 3,
    loadBugDoneCount: async () => 1,
  };
}

async function run(months: string[], sources: Record<string, MonthSource>, metricBasis: 'SP' | 'WP') {
  const events: RangeProgressEvent[] = [];
  const result = await generateProductivitySummaryRange(
    { months, selectedGroups: ['User'], metricBasis },
    portsFor(sources),
    (event) => events.push(event),
  );
  return { events, result };
}

test('a mixed range never publishes a WP point, even though WP was requested', async () => {
  const { events, result } = await run(
    ['2025-01', '2026-07'],
    { '2025-01': 'archive', '2026-07': 'live' },
    'WP',
  );

  assert.equal(result.metricBasis, 'SP', 'one archived month forces the whole range to SP');
  const points = events.filter(event => event.type === 'point');
  assert.ok(points.length > 0, 'points must be published');
  for (const point of points) {
    assert.equal(point.point.metricBasis, 'SP');
  }
});

test('streamed points match the final chart exactly', async () => {
  const months = ['2025-01', '2025-02', '2026-07'];
  const { events, result } = await run(
    months,
    { '2025-01': 'archive', '2025-02': 'archive', '2026-07': 'live' },
    'SP',
  );

  const streamed = events
    .filter(event => event.type === 'point')
    .map(event => event.point)
    .sort((a, b) => a.month.localeCompare(b.month));

  assert.equal(streamed.length, months.length, 'every month is published exactly once');
  assert.deepEqual(streamed, [...result.chart].sort((a, b) => a.month.localeCompare(b.month)));
});

test('an all-live range announces months first, then flushes points at the requested basis', async () => {
  const { events, result } = await run(
    ['2026-06', '2026-07'],
    { '2026-06': 'live', '2026-07': 'live' },
    'WP',
  );

  assert.equal(result.metricBasis, 'WP');
  // Basis cannot be known until the last month resolves, so months are announced value-free first.
  assert.equal(events.filter(event => event.type === 'month').length, 2);
  const points = events.filter(event => event.type === 'point');
  assert.equal(points.length, 2);
  for (const point of points) assert.equal(point.point.metricBasis, 'WP');
  assert.deepEqual(
    points.map(event => event.point.productivityMetric),
    [50, 50],
    'WP basis sums wpTotal, not spTotal',
  );
});

test('progress reports every month once against the range total', async () => {
  const months = ['2025-01', '2025-02', '2025-03'];
  const { events } = await run(
    months,
    { '2025-01': 'archive', '2025-02': 'archive', '2025-03': 'archive' },
    'SP',
  );

  for (const event of events) assert.equal(event.total, months.length);
  const announced = events.flatMap(event =>
    event.type === 'point' ? [event.point.month] : [event.month],
  );
  assert.deepEqual([...announced].sort(), months);
});

test('omitting the callback leaves the payload untouched', async () => {
  const sources = { '2025-01': 'archive' as MonthSource };
  const withCallback = await run(['2025-01'], sources, 'SP');
  const without = await generateProductivitySummaryRange(
    { months: ['2025-01'], selectedGroups: ['User'], metricBasis: 'SP' },
    portsFor(sources),
  );
  assert.deepEqual(without, withCallback.result);
});
