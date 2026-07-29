import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProductivitySummaryParams,
  inclusiveMonthCount,
  validateProductivitySummaryRange,
} from './productivity-summary-range';

test('accepts an inclusive same-month range', () => {
  assert.equal(inclusiveMonthCount('2026-02', '2026-02'), 1);
  assert.equal(validateProductivitySummaryRange('2026-02', '2026-02'), null);
});

test('counts a leap-year boundary by calendar month', () => {
  assert.equal(inclusiveMonthCount('2024-02', '2024-03'), 2);
});

test('rejects reversed and 25-month ranges while accepting 24 months', () => {
  assert.match(validateProductivitySummaryRange('2026-03', '2026-02')!, /must not be after/);
  assert.equal(validateProductivitySummaryRange('2024-02', '2026-01'), null);
  assert.match(validateProductivitySummaryRange('2024-01', '2026-01')!, /24 months/);
});

test('builds only canonical Group-scoped query fields', () => {
  assert.deepEqual(buildProductivitySummaryParams('2026-01', '2026-02', ['Loan', 'User'], 'SP'), {
    startMonth: '2026-01',
    endMonth: '2026-02',
    groups: 'Loan,User',
    metricBasis: 'SP',
  });
  assert.deepEqual(buildProductivitySummaryParams('2026-01', '2026-01', [], 'WP'), {
    startMonth: '2026-01',
    endMonth: '2026-01',
    metricBasis: 'WP',
  });
});
