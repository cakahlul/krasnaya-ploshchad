import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProductivitySummaryExportPayload } from './useExportProductivitySummary';
import { handleProductivitySummaryExportPost } from '@server/modules/reports/productivity-summary-export-http';
import { buildProductivitySummaryRangeSheet } from '@server/modules/reports/productivity-summary.service';
import type { ProductivitySummaryRangeResponse } from '@server/modules/reports/productivity-summary.service';
import type { RangeAggregationPorts } from '@server/modules/reports/productivity-summary-range.service';

// SLS-17309: Google Sheets export parity regression.
// Proves the FE export payload equals the canonical request currently displayed,
// and the resulting Sheet values equal the canonical API response, for a fully
// live range and an archived/mixed range. Reuses the same server-side handler
// and sheet builder exercised (with different fixtures) by
// productivity-summary-export-http.test.ts / productivity-summary-export.test.ts.
const unusedPorts: RangeAggregationPorts = {
  loadMonth: async () => { throw new Error('unused'); },
  loadBugCount: async () => { throw new Error('unused'); },
};

test('fully live range: export payload and Sheet values match canonical API response', async () => {
  const request = { startMonth: '2026-06', endMonth: '2026-06', groups: 'Loan,User', metricBasis: 'WP' as const };
  const accessToken = 'token-live';

  // FE payload parity: what the hook sends must equal the canonical request on screen.
  assert.deepEqual(
    buildProductivitySummaryExportPayload(6, 2026, accessToken, undefined, request),
    { ...request, accessToken },
  );

  const rangeData: ProductivitySummaryRangeResponse = {
    range: { startMonth: '2026-06', endMonth: '2026-06', monthCount: 1 },
    selectedGroups: ['Loan', 'User'],
    metricBasis: 'WP',
    coverage: {
      complete: true,
      months: [{
        month: '2026-06', source: 'live', productivityAvailable: true, bugsAvailable: true,
        appliedRules: [{ group: 'Loan', ruleVersion: 'v3' }, { group: 'User', ruleVersion: 'v3' }],
        failures: [],
      }],
    },
    summary: { activeMembers: 2, productivityMetric: 40, bugsTotal: 5, bugsRaised: 3 },
    details: [
      { name: 'Alpha', group: 'Loan', boards: ['Loan Web'], monthly: [{ month: '2026-06', source: 'live', spTotal: 10, wpTotal: 20, workingDays: 20 }] },
      { name: 'Beta', group: 'User', boards: ['User Web', 'User Mobile'], monthly: [{ month: '2026-06', source: 'live', spTotal: 15, wpTotal: 20, workingDays: 20 }] },
    ],
    chart: [{ month: '2026-06', activeMembers: 2, productivityMetric: 40, productivityPercent: 62.5, bugsTotal: 5, bugsRaised: 3, source: 'live', metricBasis: 'WP' }],
  };

  let canonicalInput: unknown;
  let exportedData: ProductivitySummaryRangeResponse | undefined;
  const response = await handleProductivitySummaryExportPost(new Request('http://local/export', {
    method: 'POST',
    body: JSON.stringify({ ...request, accessToken }),
  }), {
    rangePorts: unusedPorts,
    generateRange: async input => { canonicalInput = input; return rangeData; },
    exportRange: async data => { exportedData = data; return { spreadsheetUrl: 'https://sheet-live' }; },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(canonicalInput, { months: ['2026-06'], selectedGroups: ['Loan', 'User'], metricBasis: 'WP' });
  assert.strictEqual(exportedData, rangeData);

  const sheet = buildProductivitySummaryRangeSheet(exportedData!);
  assert.deepEqual(sheet.values, [
    ['Productivity Summary', '2026-06 to 2026-06'],
    ['Selected Groups', 'Loan, User'],
    ['Coverage Complete', 'Yes'],
    [],
    ['Month', 'Source', 'Metric Basis', 'Active Members', 'Productivity %', 'SP Total', 'Total Bugs', 'Bugs Raised', 'Bugs Done'],
    ['2026-06', 'live', 'WP', 2, 62.5, 40, 5, 3, ''],
    [],
    ['Details'],
    ['Group', 'Boards', 'Name', 'Month', 'Source', 'Rule', 'Metric Basis', 'SP Total', 'WP Total', 'Working Days'],
    ['Loan', 'Loan Web', 'Alpha', '2026-06', 'live', 'v3', 'WP', 10, 20, 20],
    ['User', 'User Mobile, User Web', 'Beta', '2026-06', 'live', 'v3', 'WP', 15, 20, 20],
    [],
    ['Coverage Failures'],
    ['Month', 'Scope', 'Group', 'Board', 'Reason'],
    ['None'],
  ]);
});

test('archived/mixed range: SP-only metric basis, partial month never complete or zero', async () => {
  const request = { startMonth: '2025-12', endMonth: '2026-01', groups: 'User', metricBasis: 'SP' as const };
  const accessToken = 'token-archive';

  assert.deepEqual(
    buildProductivitySummaryExportPayload(1, 2026, accessToken, undefined, request),
    { ...request, accessToken },
  );

  const rangeData: ProductivitySummaryRangeResponse = {
    range: { startMonth: '2025-12', endMonth: '2026-01', monthCount: 2 },
    selectedGroups: ['User'],
    metricBasis: 'SP',
    coverage: {
      complete: false,
      months: [
        { month: '2025-12', source: 'archive', productivityAvailable: true, bugsAvailable: true, appliedRules: [{ group: 'User', ruleVersion: 'v3' }], failures: [] },
        { month: '2026-01', source: 'partial', productivityAvailable: true, bugsAvailable: false, appliedRules: [{ group: 'User', ruleVersion: 'v3' }], failures: [{ scope: 'bugs', group: 'User', board: 'USR Bugs', reason: 'Jira timeout' }] },
      ],
    },
    summary: { activeMembers: 1, productivityMetric: 18, bugsTotal: null, bugsRaised: null },
    details: [{
      name: 'Legacy Member', group: 'User', boards: ['Ambis Web', 'Ambis Mobile'],
      monthly: [
        { month: '2025-12', source: 'archive', spTotal: 18, wpTotal: null, workingDays: 19 },
        { month: '2026-01', source: 'partial', spTotal: null, wpTotal: null, workingDays: 21 },
      ],
    }],
    chart: [
      { month: '2025-12', activeMembers: 1, productivityMetric: 18, productivityPercent: 11.842105, bugsTotal: 3, bugsRaised: 1, source: 'archive', metricBasis: 'SP' },
      { month: '2026-01', activeMembers: 1, productivityMetric: null, bugsTotal: null, bugsRaised: null, source: 'partial', metricBasis: 'SP' },
    ],
  };

  let canonicalInput: unknown;
  let exportedData: ProductivitySummaryRangeResponse | undefined;
  const response = await handleProductivitySummaryExportPost(new Request('http://local/export', {
    method: 'POST',
    body: JSON.stringify({ ...request, accessToken }),
  }), {
    rangePorts: unusedPorts,
    generateRange: async input => { canonicalInput = input; return rangeData; },
    exportRange: async data => { exportedData = data; return { spreadsheetUrl: 'https://sheet-archive' }; },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(canonicalInput, { months: ['2025-12', '2026-01'], selectedGroups: ['User'], metricBasis: 'SP' });
  assert.strictEqual(exportedData, rangeData);
  // Archived/mixed ranges are SP-only: the canonical response never carries WP for this fixture.
  assert.equal(exportedData!.metricBasis, 'SP');

  const sheet = buildProductivitySummaryRangeSheet(exportedData!);
  const partialChartRow = sheet.values[6];
  const partialDetailRow = sheet.values[11];
  assert.notEqual(partialChartRow[5], 0); // SP Total column: never rendered as zero
  assert.notEqual(partialDetailRow[7], 0); // SP Total column: never rendered as zero
  assert.equal(partialChartRow[5], '');
  assert.equal(partialDetailRow[7], '');
  assert.deepEqual(sheet.values, [
    ['Productivity Summary', '2025-12 to 2026-01'],
    ['Selected Groups', 'User'],
    ['Coverage Complete', 'No'],
    [],
    ['Month', 'Source', 'Metric Basis', 'Active Members', 'Productivity %', 'SP Total', 'Total Bugs', 'Bugs Raised', 'Bugs Done'],
    ['2025-12', 'archive', 'SP', 1, 11.842105, 18, 3, 1, ''],
    ['2026-01', 'partial', 'SP', 1, '', '', '', '', ''],
    [],
    ['Details'],
    ['Group', 'Boards', 'Name', 'Month', 'Source', 'Rule', 'Metric Basis', 'SP Total', 'WP Total', 'Working Days'],
    ['User', 'Ambis Mobile, Ambis Web', 'Legacy Member', '2025-12', 'archive', 'v3', 'SP', 18, '', 19],
    ['User', 'Ambis Mobile, Ambis Web', 'Legacy Member', '2026-01', 'partial', 'v3', 'SP', '', '', 21],
    [],
    ['Coverage Failures'],
    ['Month', 'Scope', 'Group', 'Board', 'Reason'],
    ['2026-01', 'bugs', 'User', 'USR Bugs', 'Jira timeout'],
  ]);

  // Enforcement proof: requesting WP explicitly for this same archived/mixed fixture is rejected.
  const wpRejected = await handleProductivitySummaryExportPost(new Request('http://local/export', {
    method: 'POST',
    body: JSON.stringify({ ...request, metricBasis: 'WP', accessToken }),
  }), {
    rangePorts: unusedPorts,
    generateRange: async () => rangeData,
    exportRange: async () => { throw new Error('must not export'); },
  });
  assert.equal(wpRejected.status, 400);
  assert.deepEqual(await wpRejected.json(), { message: 'metricBasis WP is unavailable for archive or mixed ranges' });
});

test('builds canonical export payload with GET filter parity', () => {
  assert.deepEqual(buildProductivitySummaryExportPayload(4, 2026, 'token', ['old-team'], {
    startMonth: '2025-12',
    endMonth: '2026-02',
    groups: 'Loan,User',
    metricBasis: 'SP',
  }), {
    startMonth: '2025-12',
    endMonth: '2026-02',
    groups: 'Loan,User',
    metricBasis: 'SP',
    accessToken: 'token',
  });
});

test('preserves legacy month/year/teams payload adapter', () => {
  assert.deepEqual(buildProductivitySummaryExportPayload(4, 2026, 'token', ['SLS', 'DS']), {
    month: '4',
    year: '2026',
    accessToken: 'token',
    teams: 'SLS,DS',
  });
});
