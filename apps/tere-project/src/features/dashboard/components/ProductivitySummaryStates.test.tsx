import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductivitySummaryCanonicalResult, ProductivitySummaryRetry } from './ProductivitySummaryStates';
import { buildProductivitySummaryParams } from '../utils/productivity-summary-range';

test('renders a canonical response with unavailable values without crashing', () => {
  const html = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      range: { startMonth: '2025-12', endMonth: '2026-01', monthCount: 2 },
      metricBasis: 'SP',
      summary: { activeMembers: 3, productivityMetric: null, bugsRaised: null },
    }} />,
  );
  assert.match(html, /2025-12/);
  assert.match(html, /Active members/);
  assert.equal(html.match(/N\/A/g)?.length, 2);
});

test('retry forwards the exact failed range and Groups', () => {
  const request = buildProductivitySummaryParams('2025-12', '2026-01', ['Loan', 'Ungrouped'], 'SP');
  let retried: unknown;
  const element = ProductivitySummaryRetry({ request, onRetry: value => { retried = value; } });
  element.props.onClick();
  assert.equal(retried, request);
  assert.deepEqual(retried, {
    startMonth: '2025-12',
    endMonth: '2026-01',
    groups: 'Loan,Ungrouped',
    metricBasis: 'SP',
  });
});
