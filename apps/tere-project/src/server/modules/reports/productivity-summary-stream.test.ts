import assert from 'node:assert/strict';
import test from 'node:test';
import { handleProductivitySummaryGet, NDJSON_MEDIA_TYPE } from './productivity-summary-http';
import type { MonthSource, RangeAggregationPorts } from './productivity-summary-range.service';

function portsFor(sources: Record<string, MonthSource>): RangeAggregationPorts {
  return {
    loadMonth: async (month) => ({
      source: sources[month],
      archiveBacked: sources[month] === 'archive',
      availability: { productivity: true },
      appliedRules: [],
      failures: [],
      members: [
        { id: 'a', name: 'A', group: 'User', board: 'SLS', spTotal: 8, wpTotal: 5, spTarget: 16, workingDays: 2 },
      ],
    }),
    loadBugCount: async () => 2,
  };
}

const deps = (sources: Record<string, MonthSource>) => ({
  generateLegacy: async () => ({ summary: { marker: 'legacy' }, details: [] }) as never,
  rangePorts: portsFor(sources),
});

function request(query: string, accept?: string) {
  return new Request(`http://localhost/api/report/productivity-summary?${query}`, {
    headers: accept ? { accept } : undefined,
  });
}

async function readEvents(response: Response) {
  const body = await response.text();
  return body.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
}

const LEAD = { isLead: true, fullName: 'Lead' };
const RANGE = 'startMonth=2025-01&endMonth=2025-02&groups=User&metricBasis=SP';

test('without the NDJSON accept header the response is unchanged JSON', async () => {
  const response = await handleProductivitySummaryGet(
    request(RANGE),
    LEAD,
    deps({ '2025-01': 'archive', '2025-02': 'archive' }),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /application\/json/);
  const body = await response.json();
  assert.equal(body.range.monthCount, 2);
});

test('the legacy month/year path ignores the NDJSON header entirely', async () => {
  const response = await handleProductivitySummaryGet(
    request('month=2&year=2026', NDJSON_MEDIA_TYPE),
    LEAD,
    deps({}),
  );
  assert.match(response.headers.get('content-type') ?? '', /application\/json/);
  assert.deepEqual(await response.json(), { summary: { marker: 'legacy' }, details: [] });
});

test('a lead streams one point per month and a final complete payload', async () => {
  const response = await handleProductivitySummaryGet(
    request(RANGE, NDJSON_MEDIA_TYPE),
    LEAD,
    deps({ '2025-01': 'archive', '2025-02': 'archive' }),
  );
  assert.equal(response.headers.get('content-type'), `${NDJSON_MEDIA_TYPE}; charset=utf-8`);

  const events = await readEvents(response);
  const points = events.filter(event => event.type === 'point');
  assert.equal(points.length, 2);
  assert.deepEqual(points.map(event => event.point.month).sort(), ['2025-01', '2025-02']);

  const last = events.at(-1);
  assert.equal(last.type, 'complete');
  assert.deepEqual(last.data.chart, events
    .filter(event => event.type === 'point')
    .map(event => event.point)
    .sort((a, b) => a.month.localeCompare(b.month)));
});

test('a non-lead gets progress without values and no chart in the payload', async () => {
  const response = await handleProductivitySummaryGet(
    request(RANGE, NDJSON_MEDIA_TYPE),
    { isLead: false, fullName: 'A' },
    deps({ '2025-01': 'archive', '2025-02': 'archive' }),
  );

  const events = await readEvents(response);
  assert.equal(events.filter(event => event.type === 'point').length, 0, 'no chart data may reach a non-lead');
  assert.equal(events.filter(event => event.type === 'month').length, 2);
  const complete = events.at(-1);
  assert.equal(complete.type, 'complete');
  assert.equal('chart' in complete.data, false);
});

test('a WP request over archived months errors instead of streaming SP points', async () => {
  const response = await handleProductivitySummaryGet(
    request('startMonth=2025-01&endMonth=2025-02&groups=User&metricBasis=WP', NDJSON_MEDIA_TYPE),
    LEAD,
    deps({ '2025-01': 'archive', '2025-02': 'archive' }),
  );

  const events = await readEvents(response);
  assert.equal(events.filter(event => event.type === 'point').length, 0);
  assert.deepEqual(events.at(-1), {
    type: 'error',
    status: 400,
    message: 'metricBasis WP is unavailable for archive or mixed ranges',
  });
});

test('a source failure stays a coverage failure rather than killing the stream', async () => {
  const response = await handleProductivitySummaryGet(
    request(RANGE, NDJSON_MEDIA_TYPE),
    LEAD,
    {
      generateLegacy: async () => ({}) as never,
      rangePorts: {
        loadMonth: async () => { throw new Error('jira exploded'); },
        loadBugCount: async () => { throw new Error('jira exploded'); },
      },
    },
  );

  const events = await readEvents(response);
  const last = events.at(-1);
  assert.equal(last.type, 'complete', 'per-month failures are coverage failures, not stream errors');
  assert.equal(last.data.coverage.complete, false);
});
