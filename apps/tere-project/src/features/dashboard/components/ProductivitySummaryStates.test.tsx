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
  // Productivity, SP delivered, SP per member and Bugs raised all rest on values the payload
  // reports as null. Each must say so rather than being filled in with a zero.
  assert.equal(html.match(/N\/A/g)?.length, 4);
});

test('shows lead comparison chart for a multi-month response and preserves null gaps', () => {
  const html = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      range: { startMonth: '2025-12', endMonth: '2026-01', monthCount: 2 },
      metricBasis: 'SP',
      summary: { activeMembers: 3, productivityMetric: null, bugsRaised: 5 },
      chart: [
        { month: '2025-12', activeMembers: 3, productivityMetric: 21, bugsRaised: 2 },
        { month: '2026-01', activeMembers: null, productivityMetric: null, bugsRaised: 3 },
      ],
    }} />,
  );

  assert.match(html, /data-qa="productivity-summary-comparison-chart"/);
  assert.match(html, /Monthly comparison/);
  assert.match(html, /Missing source values remain gaps/);
  assert.match(html, /<figure/);
  assert.match(html, /aria-describedby="productivity-summary-comparison-description"/);
  assert.match(html, /Monthly comparison values; N\/A means source data is unavailable/);
  assert.match(html, /<th scope="row">2026-01<\/th><td>N\/A<\/td><td>N\/A<\/td><td>3<\/td><td>N\/A<\/td>/);
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
  assert.equal((source.match(/connectNulls=\{false\}/g) ?? []).length, 4);
  assert.equal((source.match(/<YAxis/g) ?? []).length, 1);
  assert.doesNotMatch(source, /orientation="right"|yAxisId=/);
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
  // Scoped to the member breakdown: the Productivity card legitimately reads N/A here because this
  // payload carries no percentage, and the card no longer substitutes a raw SP total for one.
  const breakdown = html.slice(html.indexOf('productivity-summary-member-breakdown'));
  assert.doesNotMatch(breakdown, /N\/A/);
});

test('rounds the productivity percentage instead of printing a float tail', () => {
  const html = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      range: { startMonth: '2026-01', endMonth: '2026-02', monthCount: 2 },
      metricBasis: 'SP',
      summary: {
        activeMembers: 3,
        productivityMetric: 262.5,
        productivityPercent: 87.43333333333333,
        bugsRaised: 4,
        bugsDone: 3,
      },
    }} />,
  );

  assert.match(html, />87\.4%</, 'the percentage is rounded and carries its unit');
  assert.doesNotMatch(html, /87\.43333/);
  assert.doesNotMatch(html, /262\.5%/, 'a raw metric must never be printed as a percentage');
});

test('never labels a raw metric as a percentage when no percentage was supplied', () => {
  const html = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      range: { startMonth: '2026-01', endMonth: '2026-01', monthCount: 1 },
      metricBasis: 'SP',
      summary: { activeMembers: 2, productivityMetric: 120, bugsRaised: 0 },
    }} />,
  );

  const productivityCard = html.slice(html.indexOf('Productivity<'), html.indexOf('SP delivered'));
  assert.match(productivityCard, /N\/A/);
  assert.doesNotMatch(productivityCard, /120/);
});

test('member breakdown is collapsed behind a summary that counts what is inside', () => {
  const html = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      range: { startMonth: '2026-01', endMonth: '2026-01', monthCount: 1 },
      selectedGroups: ['User'],
      metricBasis: 'SP',
      summary: { activeMembers: 1, productivityMetric: 8, bugsRaised: 0 },
      details: [{
        name: 'Budi',
        group: 'User',
        monthly: [{ month: '2026-01', source: 'live', spTotal: 8, wpTotal: 5, workingDays: 1 }],
      }],
    }} />,
  );

  assert.match(html, /<details data-qa="productivity-summary-member-breakdown"/);
  assert.match(html, /1 member in 1 group/);
  assert.doesNotMatch(html, /<details data-qa="productivity-summary-member-breakdown"[^>]*open/);
});

test('reports the trend between the first and last measured month', () => {
  const html = renderToStaticMarkup(
    <ProductivitySummaryCanonicalResult data={{
      range: { startMonth: '2026-01', endMonth: '2026-03', monthCount: 3 },
      metricBasis: 'SP',
      summary: { activeMembers: 2, productivityMetric: 300, productivityPercent: 80, bugsRaised: 1 },
      chart: [
        { month: '2026-01', activeMembers: 2, productivityMetric: 100, productivityPercent: 70, bugsRaised: 1 },
        { month: '2026-02', activeMembers: 2, productivityMetric: 100, productivityPercent: 75, bugsRaised: 0 },
        { month: '2026-03', activeMembers: 2, productivityMetric: 100, productivityPercent: 82.5, bugsRaised: 0 },
      ],
    }} />,
  );

  assert.match(html, /\+12\.5 pts/);
  assert.match(html, /2026-01 to 2026-03/);
});
