import assert from 'node:assert/strict';
import test from 'node:test';
import { reportCoverageLabel, reportProvenanceText, reportSourceLabel } from './report-provenance';
import type { ReportSourceMetadata } from '@server/modules/report-source-resolver/report-source-resolver';

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

test('uses the approved human-readable source labels', () => {
  assert.equal(reportSourceLabel(metadata({ source: 'archive' })), 'Archived');
  assert.equal(reportSourceLabel(metadata({ source: 'snapshot' })), 'Captured Report Snapshot');
  assert.equal(reportSourceLabel(metadata()), 'Live Jira');
  assert.equal(reportSourceLabel(metadata({ fallback: true })), 'Jira Fallback');
});

test('makes partial and unavailable coverage explicit with warnings', () => {
  const partial = metadata({
    source: 'partial',
    coverage: { status: 'partial', expected: 3, covered: 2 },
    warning: 'Some sprint reports are unavailable',
  });
  assert.equal(reportCoverageLabel(partial), 'Partial coverage (2 of 3)');
  assert.match(reportProvenanceText(partial), /Warning: Some sprint reports are unavailable/);

  const unavailable = metadata({
    source: 'unavailable',
    coverage: { status: 'unavailable', expected: 1, covered: 0 },
    warning: 'Sprint reports are unavailable',
  });
  assert.equal(reportProvenanceText(unavailable), 'Unavailable. Unavailable. Warning: Sprint reports are unavailable.');
});
