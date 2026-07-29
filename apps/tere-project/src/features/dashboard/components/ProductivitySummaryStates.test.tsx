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

test('renders server basis, coverage, and Group-member hierarchy without raw Team names', () => {
  const html = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      range: { startMonth: '2025-12', endMonth: '2026-01', monthCount: 2 },
      selectedGroups: ['Loan'],
      metricBasis: 'SP',
      coverage: {
        complete: false,
        months: [
          { month: '2025-12', source: 'archive', productivityAvailable: true, bugsAvailable: true },
          { month: '2026-01', source: 'partial', productivityAvailable: false, bugsAvailable: true },
        ],
      },
      summary: { activeMembers: 1, productivityMetric: 8, bugsRaised: 2 },
      details: [{
        name: 'Ari',
        group: 'Loan',
        boards: ['Tunaiku Raw Team'],
        monthly: [
          { month: '2025-12', source: 'archive', spTotal: 8, wpTotal: null, workingDays: null },
          { month: '2026-01', source: 'unavailable', spTotal: null, wpTotal: null, workingDays: null },
        ],
      }],
    }} />,
  );

  assert.match(html, /SP basis/);
  assert.match(html, /Coverage/);
  assert.match(html, /Loan/);
  assert.match(html, /Ari/);
  assert.match(html, /N\/A/);
  assert.doesNotMatch(html, /Tunaiku Raw Team/);
});

test('renders zero metric and working days as zero, not unavailable', () => {
  const html = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      range: { startMonth: '2026-01', endMonth: '2026-01', monthCount: 1 },
      selectedGroups: ['User'],
      metricBasis: 'SP',
      summary: { activeMembers: 1, productivityMetric: 0, bugsRaised: 0 },
      details: [{
        name: 'Budi',
        group: 'User',
        monthly: [{ month: '2026-01', source: 'live', spTotal: 0, wpTotal: 0, workingDays: 0 }],
      }],
    }} />,
  );

  assert.match(html, /data-qa="productivity-member-metric">0<\/span>/);
  assert.match(html, /data-qa="productivity-member-working-days">0<\/span>/);
  assert.doesNotMatch(html, /N\/A/);
});
