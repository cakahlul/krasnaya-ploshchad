import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReportSourceMetadata } from '@server/modules/report-source-resolver/report-source-resolver';
import { ReportProvenance } from './ReportProvenance';

const metadata = (overrides: Partial<ReportSourceMetadata> = {}): ReportSourceMetadata => ({
  source: 'jira',
  coverage: { status: 'complete', expected: 1, covered: 1 },
  fallback: false,
  reason: null,
  warning: null,
  attemptedSources: [{ source: 'jira', detail: null }],
  snapshotTimestamp: null,
  ...overrides,
});

test('renders approved source labels and accessible complete status', () => {
  const cases = [
    [metadata({ source: 'archive' }), 'Archived'],
    [metadata({ source: 'snapshot' }), 'Captured Report Snapshot'],
    [metadata(), 'Live Jira'],
    [metadata({ fallback: true }), 'Jira Fallback'],
  ] as const;

  for (const [sourceMetadata, label] of cases) {
    const markup = renderToStaticMarkup(<ReportProvenance metadata={sourceMetadata} />);
    assert.match(markup, /role="status"/);
    assert.match(markup, new RegExp(`Data source:[\\s\\S]*${label}`));
    assert.match(markup, /Complete coverage/);
  }
});

test('renders partial and unavailable warnings as text', () => {
  const partial = renderToStaticMarkup(
    <ReportProvenance
      metadata={metadata({
        source: 'partial',
        coverage: { status: 'partial', expected: 3, covered: 2 },
        warning: 'Some sprint reports are unavailable',
      })}
    />,
  );
  assert.match(partial, /Partial data/);
  assert.match(partial, /Partial coverage \(2 of 3\)/);
  assert.match(partial, /Warning: Some sprint reports are unavailable/);

  const unavailable = renderToStaticMarkup(
    <ReportProvenance
      metadata={metadata({
        source: 'unavailable',
        coverage: { status: 'unavailable', expected: 1, covered: 0 },
        warning: 'Sprint reports are unavailable',
      })}
    />,
  );
  assert.match(unavailable, /<strong>Data source:<\/strong> Unavailable/);
  assert.match(unavailable, /Warning: Sprint reports are unavailable/);
});

test('omits provenance markup for legacy responses without metadata', () => {
  assert.equal(renderToStaticMarkup(<ReportProvenance />), '');
});
