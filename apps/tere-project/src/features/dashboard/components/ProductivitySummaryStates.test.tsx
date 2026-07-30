import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductivitySummaryCanonicalResult, ProductivitySummaryRetry } from './ProductivitySummaryStates';
import { buildProductivitySummaryParams } from '../utils/productivity-summary-range';

const source = readFileSync(new URL('./ProductivitySummaryStates.tsx', import.meta.url), 'utf8');

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

test('shows lead comparison chart for a multi-month response and preserves null gaps', () => {
  const html = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      range: { startMonth: '2025-12', endMonth: '2026-01', monthCount: 2 },
      metricBasis: 'SP',
      summary: { activeMembers: 3, productivityMetric: null, bugsTotal: 5, bugsRaised: 5 },
      chart: [
        { month: '2025-12', activeMembers: 3, productivityMetric: 21, bugsTotal: 4, bugsRaised: 2 },
        { month: '2026-01', activeMembers: null, productivityMetric: null, bugsTotal: 3, bugsRaised: 3 },
      ],
    }} />,
  );

  assert.match(html, /data-qa="productivity-summary-comparison-chart"/);
  assert.match(html, /Monthly comparison/);
  assert.match(html, /Missing source values remain gaps/);
  assert.match(html, /<figure/);
  assert.match(html, /aria-describedby="productivity-summary-comparison-description"/);
  assert.match(html, /Monthly comparison values; N\/A means source data is unavailable/);
  assert.match(html, /<th scope="row">2026-01<\/th><td>N\/A<\/td><td>N\/A<\/td><td>3<\/td><td>3<\/td>/);
});

test('hides comparison chart when capability data is absent, empty, or range has one month', () => {
  const base = {
    metricBasis: 'WP' as const,
    summary: { activeMembers: 1, productivityMetric: 8, bugsRaised: 0 },
  };
  const nonLead = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      ...base,
      range: { startMonth: '2026-01', endMonth: '2026-02', monthCount: 2 },
    }} />,
  );
  const singleMonth = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      ...base,
      range: { startMonth: '2026-01', endMonth: '2026-01', monthCount: 1 },
      chart: [{ month: '2026-01', activeMembers: 1, productivityMetric: 8, bugsRaised: 0 }],
    }} />,
  );
  const empty = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      ...base,
      range: { startMonth: '2026-01', endMonth: '2026-02', monthCount: 2 },
      chart: [],
    }} />,
  );

  assert.doesNotMatch(nonLead, /productivity-summary-comparison-chart/);
  assert.doesNotMatch(empty, /productivity-summary-comparison-chart/);
  assert.doesNotMatch(singleMonth, /productivity-summary-comparison-chart/);
});

test('keeps chart nulls as gaps and uses responsive accessible themed primitives', () => {
  assert.equal((source.match(/connectNulls=\{false\}/g) ?? []).length, 5);
  assert.match(source, /<ResponsiveContainer/);
  assert.match(source, /accessibilityLayer/);
  assert.match(source, /<figure[\s\S]*aria-labelledby=/);
  assert.doesNotMatch(source, /role="img"/);
  for (const token of [
    'var(--color-accent)',
    'var(--color-accent-light)',
    'var(--tere-title)',
    'var(--tere-status-danger)',
    'var(--tere-status-warning)',
    'var(--tere-status-success)',
  ]) {
    assert.match(source, new RegExp(token.replace(/[()\-]/g, '\\$&')));
  }
});

test('never hardcodes a color literal — every color is a theme token (light/void/crimson)', () => {
  // Only literal color values allowed are the theme-agnostic SVG chrome recharts needs;
  // every semantic color (accent, status, text, border) must go through a --tere-*/--color-* token.
  assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}/);
  assert.match(source, /color=\{data\.coverage\.complete \? 'var\(--color-accent\)' : 'var\(--tere-status-warning\)'\}/);
});

test('narrow-viewport horizontal scroll: chart wrapper scrolls, nothing cropped', () => {
  assert.match(source, /overflowX: 'auto'/);
  assert.match(source, /minWidth: 0/);
  assert.match(source, /minWidth: 560/);
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
