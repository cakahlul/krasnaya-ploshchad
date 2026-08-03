import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleProductivitySummaryExportPost } from './productivity-summary-export-http';
import type { RangeAggregationInput, RangeAggregationPorts } from './productivity-summary-range.service';
import type { ProductivitySummaryRangeResponse } from './productivity-summary.service';

const rangeData: ProductivitySummaryRangeResponse = {
  range: { startMonth: '2026-04', endMonth: '2026-04', monthCount: 1 },
  selectedGroups: ['User'],
  metricBasis: 'SP',
  coverage: { complete: true, months: [] },
  summary: { activeMembers: 0, productivityMetric: 0, bugsRaised: 0 },
  details: [],
  chart: [],
};
const unusedPorts: RangeAggregationPorts = {
  loadMonth: async () => { throw new Error('unused'); },
};

async function verify() {
  const productionRoute = readFileSync(new URL('../../../app/api/report/productivity-summary/export/route.ts', import.meta.url), 'utf8');
  assert.match(productionRoute, /productivitySummaryRangePorts/);
  assert.match(productionRoute, /rangePorts:\s*productivitySummaryRangePorts/);

  let canonicalInput: RangeAggregationInput | undefined;
  let exportedData: ProductivitySummaryRangeResponse | undefined;
  const canonical = await handleProductivitySummaryExportPost(new Request('http://local/export', {
    method: 'POST',
    body: JSON.stringify({ startMonth: '2026-04', endMonth: '2026-04', groups: 'User', metricBasis: 'SP', accessToken: 'token' }),
  }), {
    rangePorts: unusedPorts,
    generateRange: async input => { canonicalInput = input; return rangeData; },
    exportRange: async data => { exportedData = data; return { spreadsheetUrl: 'https://sheet' }; },
  });
  assert.equal(canonical.status, 200);
  assert.deepEqual(canonicalInput, { months: ['2026-04'], selectedGroups: ['User'], metricBasis: 'SP' });
  assert.strictEqual(exportedData, rangeData);

  canonicalInput = undefined;
  const defaults = await handleProductivitySummaryExportPost(new Request('http://local/export', {
    method: 'POST',
    body: JSON.stringify({ startMonth: '2026-04', endMonth: '2026-04', accessToken: 'token' }),
  }), {
    rangePorts: unusedPorts,
    generateRange: async input => { canonicalInput = input; return { ...rangeData, metricBasis: 'WP' }; },
    exportRange: async () => ({ spreadsheetUrl: 'https://sheet' }),
  });
  assert.equal(defaults.status, 200);
  assert.deepEqual(canonicalInput, {
    months: ['2026-04'],
    selectedGroups: ['Loan', 'Transaction', 'User', 'Ungrouped'],
    metricBasis: 'WP',
  });

  for (const [body, message] of [
    [{ startMonth: '2026-04', endMonth: '2026-04', groups: 'Other', accessToken: 'token' }, 'groups must contain only Loan, Transaction, User, or Ungrouped'],
    [{ startMonth: '2026-04', endMonth: '2026-04', metricBasis: 'Hours', accessToken: 'token' }, 'metricBasis must be SP or WP'],
    [{ startMonth: '2026-04', endMonth: '2026-04', teams: 'SLS', accessToken: 'token' }, 'teams cannot be used with canonical range parameters'],
  ] as const) {
    const response = await handleProductivitySummaryExportPost(new Request('http://local/export', { method: 'POST', body: JSON.stringify(body) }), { rangePorts: unusedPorts });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { message });
  }

  const archiveWp = await handleProductivitySummaryExportPost(new Request('http://local/export', {
    method: 'POST',
    body: JSON.stringify({ startMonth: '2025-12', endMonth: '2026-01', metricBasis: 'WP', accessToken: 'token' }),
  }), {
    rangePorts: unusedPorts,
    generateRange: async () => rangeData,
    exportRange: async () => { throw new Error('must not export'); },
  });
  assert.equal(archiveWp.status, 400);
  assert.deepEqual(await archiveWp.json(), { message: 'metricBasis WP is unavailable for archive or mixed ranges' });

  let legacyArgs: unknown[] = [];
  const legacy = await handleProductivitySummaryExportPost(new Request('http://local/export', {
    method: 'POST',
    body: JSON.stringify({ month: '4', year: '2026', teams: 'SLS, DS', accessToken: 'token' }),
  }), {
    exportLegacy: async (...args) => { legacyArgs = args; return { spreadsheetUrl: 'https://legacy-sheet' }; },
  });
  assert.equal(legacy.status, 200);
  assert.deepEqual(legacyArgs, [4, 2026, 'token', ['SLS', 'DS']]);

  const mixed = await handleProductivitySummaryExportPost(new Request('http://local/export', {
    method: 'POST',
    body: JSON.stringify({ month: 4, year: 2026, startMonth: '2026-04', endMonth: '2026-04', accessToken: 'token' }),
  }));
  assert.equal(mixed.status, 400);
}

verify()
  .then(() => console.log('productivity-summary export HTTP contract self-check: PASS'))
  .catch(error => { console.error(error); process.exitCode = 1; });
