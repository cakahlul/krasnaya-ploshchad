import assert from 'node:assert/strict';
import test from 'node:test';
import { metadataProvenance, monthProvenance } from './productivity-summary-provenance';

test('uses approved source and coverage labels for every provenance state', () => {
  const cases = [
    [{ source: 'jira', fallback: false, coverage: { status: 'complete' }, warning: null }, ['Live Jira', 'Complete', null]],
    [{ source: 'jira', fallback: true, coverage: { status: 'fallback' }, warning: 'Using Jira after stored source fallback' }, ['Jira Fallback', 'Fallback', 'Using Jira after stored source fallback']],
    [{ source: 'snapshot', fallback: false, coverage: { status: 'complete' }, warning: null }, ['Captured Report Snapshot', 'Complete', null]],
    [{ source: 'partial', fallback: false, coverage: { status: 'partial' }, warning: 'Report coverage is incomplete' }, ['Partial', 'Partial', 'Report coverage is incomplete']],
    [{ source: 'unavailable', fallback: false, coverage: { status: 'unavailable' }, warning: 'Report coverage is incomplete' }, ['Unavailable', 'Unavailable', 'Report coverage is incomplete']],
  ] as const;
  for (const [metadata, expected] of cases) assert.deepEqual(metadataProvenance(metadata as never), { sourceLabel: expected[0], coverageLabel: expected[1], warning: expected[2] });
  assert.equal(metadataProvenance(undefined), null);
  assert.deepEqual(monthProvenance({ source: 'live' }), { sourceLabel: 'Live Jira', coverageLabel: 'Complete', warning: null });
  assert.deepEqual(monthProvenance({ source: 'live', fallback: true }), {
    sourceLabel: 'Jira Fallback',
    coverageLabel: 'Fallback',
    warning: 'Using Jira after stored source fallback',
  });
});
