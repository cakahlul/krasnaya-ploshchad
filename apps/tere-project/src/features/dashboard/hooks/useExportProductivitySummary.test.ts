import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProductivitySummaryExportPayload } from './useExportProductivitySummary';

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
