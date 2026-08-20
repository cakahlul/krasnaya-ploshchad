import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveReportSource,
  resolveJiraValue,
  metadataFromResolution,
  type ReportSourceAttempt,
  type ReportSourcePort,
} from './report-source-resolver';

const unit = { kind: 'productivity-month', month: '2026-06' } as const;

test('resolves archive only when its coverage is complete, never merely cutoff', async () => {
  const archive: ReportSourcePort<typeof unit> = {
    source: 'archive',
    resolve: async () => ({
      source: 'archive',
      coverage: { expected: 3, covered: 3, cutoff: true },
      value: { rows: 3 },
    }),
  };

  const result = await resolveReportSource(unit, [archive]);
  assert.equal(result.source, 'partial');
  assert.equal(result.coverage.status, 'partial');
  assert.match(result.attempts[0].detail ?? '', /cutoff/i);
});

test('returns complete source and preserves failed attempts', async () => {
  const failed: ReportSourceAttempt = {
    source: 'snapshot',
    coverage: { expected: 2, covered: 1, cutoff: false },
    detail: 'missing segment: team-a',
  };
  const result = await resolveReportSource(unit, [
    { source: 'snapshot', resolve: async () => failed },
    { source: 'jira', resolve: async () => ({ source: 'jira', coverage: { expected: 2, covered: 2, cutoff: false }, value: { rows: 2 } }) },
  ]);

  assert.equal(result.source, 'jira');
  assert.equal(result.coverage.status, 'complete');
  assert.equal(result.attempts[0].source, failed.source);
  assert.equal(result.attempts[0].detail, failed.detail);
  assert.equal(result.attempts[0].coverage, undefined);
});

test('reports unavailable when every source fails or has no coverage', async () => {
  const result = await resolveReportSource(unit, [
    { source: 'archive', resolve: async () => { throw new Error('archive offline'); } },
    { source: 'snapshot', resolve: async () => ({ source: 'snapshot', coverage: { expected: 0, covered: 0, cutoff: false }, detail: 'no snapshot' }) },
  ]);

  assert.equal(result.source, 'unavailable');
  assert.equal(result.coverage.status, 'unavailable');
  assert.equal(result.attempts.length, 2);
  assert.match(result.attempts[0].detail ?? '', /archive offline/);
});

test('accepts an independent Team Reporting sprint unit', async () => {
  const teamUnit = {
    kind: 'team-reporting-sprint',
    identity: { boardId: 7, periodKind: 'scrum', sprintId: '42' },
  } as const;
  const result = await resolveReportSource(teamUnit, [{
    source: 'snapshot',
    resolve: async unit => ({
      source: 'snapshot',
      coverage: { expected: 1, covered: 1, cutoff: false },
      value: unit.identity,
    }),
  }]);
  assert.equal(result.source, 'snapshot');
  assert.deepEqual(result.value, teamUnit.identity);
});

test('does not select a complete attempt carrying rejection detail', async () => {
  const result = await resolveReportSource(unit, [
    { source: 'archive', resolve: async () => ({
      source: 'archive', coverage: { expected: 1, covered: 1, cutoff: false }, detail: 'checksum mismatch', value: { rows: 1 },
    }) },
  ]);
  assert.equal(result.source, 'unavailable');
  assert.equal(result.attempts[0].coverage, undefined);
  assert.match(result.attempts[0].detail ?? '', /checksum mismatch/);
});

test('does not relabel a source-identity mismatch as a successful attempt', async () => {
  const result = await resolveReportSource(unit, [
    { source: 'snapshot', resolve: async () => ({
      source: 'jira', coverage: { expected: 1, covered: 1, cutoff: false }, value: { rows: 1 },
    }) },
  ]);
  assert.equal(result.source, 'unavailable');
  assert.equal(result.attempts[0].source, 'snapshot');
  assert.equal(result.attempts[0].coverage, undefined);
  assert.match(result.attempts[0].detail ?? '', /identity mismatch/);
});

test('uses strict archive, snapshot, then Jira precedence and does not query lower sources after success', async () => {
  const calls: string[] = [];
  const result = await resolveReportSource(unit, [
    { source: 'jira', resolve: async () => { calls.push('jira'); return { source: 'jira', coverage: { expected: 1, covered: 1, cutoff: false }, value: { rows: 1 } }; } },
    { source: 'archive', resolve: async () => { calls.push('archive'); return { source: 'archive', coverage: { expected: 1, covered: 1, cutoff: false }, value: { rows: 1 } }; } },
    { source: 'snapshot', resolve: async () => { calls.push('snapshot'); return { source: 'snapshot', coverage: { expected: 1, covered: 1, cutoff: false }, value: { rows: 1 } }; } },
  ]);

  assert.equal(result.source, 'archive');
  assert.deepEqual(calls, ['archive']);
  assert.equal(result.attempts.length, 1);
});

test('falls back to Jira after rejected stored data without mixing rows', async () => {
  const result = await resolveReportSource(unit, [
    { source: 'snapshot', resolve: async () => ({ source: 'snapshot', coverage: { expected: 2, covered: 2, cutoff: false }, value: { rows: ['stored'] }, detail: 'checksum mismatch' }) },
    { source: 'jira', resolve: async () => ({ source: 'jira', coverage: { expected: 2, covered: 2, cutoff: false }, value: { rows: ['live'] } }) },
  ]);

  assert.equal(result.source, 'jira');
  assert.deepEqual(result.value, { rows: ['live'] });
  assert.equal(result.attempts.length, 2);
  assert.match(result.attempts[0].detail ?? '', /checksum mismatch/);
  assert.equal(result.attempts[0].coverage, undefined);
});

test('resolves a rejected stored unit as partial or unavailable when Jira also fails', async () => {
  const result = await resolveReportSource(unit, [
    { source: 'archive', resolve: async () => ({ source: 'archive', coverage: { expected: 1, covered: 1, cutoff: false }, value: { rows: ['stored'] }, detail: 'invalid integrity evidence' }) },
    { source: 'jira', resolve: async () => { throw new Error('jira offline'); } },
  ]);

  assert.equal(result.source, 'unavailable');
  assert.equal(result.value, null);
  assert.equal(result.attempts.length, 2);
  assert.match(result.attempts[1].detail ?? '', /jira offline/);
});

test('counts an empty but successful Jira report as one covered report unit', async () => {
  const result = await resolveJiraValue({ issues: [] }, 0);
  assert.equal(result.source, 'jira');
  assert.deepEqual(result.coverage, { status: 'complete', expected: 1, covered: 1 });
});

test('falls through archive and snapshot lazily before selecting Jira', async () => {
  const calls: string[] = [];
  const result = await resolveReportSource(unit, [
    { source: 'jira', resolve: async () => { calls.push('jira'); return { source: 'jira', coverage: { expected: 2, covered: 2, cutoff: false }, value: { rows: ['jira'] } }; } },
    { source: 'snapshot', resolve: async () => { calls.push('snapshot'); return { source: 'snapshot', coverage: { expected: 2, covered: 1, cutoff: false }, value: { rows: ['snapshot'] } }; } },
    { source: 'archive', resolve: async () => { calls.push('archive'); return { source: 'archive', coverage: { expected: 2, covered: 1, cutoff: true }, value: { rows: ['archive'] } }; } },
  ]);

  assert.equal(result.source, 'jira');
  assert.deepEqual(result.value, { rows: ['jira'] });
  assert.deepEqual(calls, ['archive', 'snapshot', 'jira']);
  assert.deepEqual(result.attempts.map(attempt => attempt.source), ['archive', 'snapshot', 'jira']);
  assert.match(result.attempts[0].detail ?? '', /cutoff/);
  assert.match(result.attempts[1].detail ?? '', /incomplete/);
});

test('returns partial coverage when stored data is incomplete and Jira is unavailable', async () => {
  const result = await resolveReportSource(unit, [
    { source: 'archive', resolve: async () => ({ source: 'archive', coverage: { expected: 3, covered: 2, cutoff: false }, value: { rows: ['stored'] } }) },
    { source: 'jira', resolve: async () => { throw new Error('jira unavailable'); } },
  ]);

  assert.equal(result.source, 'partial');
  assert.equal(result.value, null);
  assert.deepEqual(result.coverage, { status: 'partial', expected: 3, covered: 2 });
  assert.match(result.attempts[1].detail ?? '', /jira unavailable/);
});

test('keeps resolution independent for separate units and never mixes values', async () => {
  const seen: string[] = [];
  const ports: ReportSourcePort<{ readonly kind: 'productivity-month'; readonly month: string }, { month: string }>[] = [{
    source: 'snapshot',
    resolve: async requested => {
      seen.push(requested.month);
      return { source: 'snapshot', coverage: { expected: 1, covered: 1, cutoff: false }, value: { month: requested.month } };
    },
  }];
  const otherUnit = { kind: 'productivity-month', month: '2026-07' } as const;

  const first = await resolveReportSource(unit, ports);
  const second = await resolveReportSource(otherUnit, ports);
  assert.deepEqual(first.value, { month: '2026-06' });
  assert.deepEqual(second.value, { month: '2026-07' });
  assert.deepEqual(seen, ['2026-06', '2026-07']);
});

test('exposes additive provenance for live, fallback, snapshot, partial, and unavailable resolutions', async () => {
  const live = await resolveJiraValue({ rows: [] });
  assert.equal(metadataFromResolution(live).coverage.status, 'complete');

  const fallback = await resolveReportSource(unit, [
    { source: 'snapshot', resolve: async () => ({ source: 'snapshot', detail: 'snapshot unavailable' }) },
    { source: 'jira', resolve: async () => ({ source: 'jira', coverage: { expected: 1, covered: 1, cutoff: false }, value: { rows: [] } }) },
  ]);
  const fallbackMetadata = metadataFromResolution(fallback);
  assert.equal(fallbackMetadata.source, 'jira');
  assert.equal(fallbackMetadata.coverage.status, 'fallback');
  assert.equal(fallbackMetadata.fallback, true);
  assert.equal(fallbackMetadata.reason, 'snapshot unavailable');
  assert.equal(fallbackMetadata.warning, 'Using Jira after stored source fallback');

  const snapshot = await resolveReportSource(unit, [{
    source: 'snapshot',
    resolve: async () => ({ source: 'snapshot', coverage: { expected: 1, covered: 1, cutoff: false }, value: { rows: [] }, snapshotTimestamp: '2026-06-30T01:02:03.000Z' }),
  }]);
  assert.equal(metadataFromResolution(snapshot).snapshotTimestamp, '2026-06-30T01:02:03.000Z');

  const partial = await resolveReportSource(unit, [{
    source: 'snapshot',
    resolve: async () => ({ source: 'snapshot', coverage: { expected: 2, covered: 1, cutoff: false }, value: { rows: [] } }),
  }]);
  assert.equal(metadataFromResolution(partial).coverage.status, 'partial');

  const unavailable = await resolveReportSource(unit, [{
    source: 'snapshot',
    resolve: async () => ({ source: 'snapshot', detail: 'no snapshot' }),
  }]);
  assert.equal(metadataFromResolution(unavailable).coverage.status, 'unavailable');
});

test('does not label Jira as fallback when stored data is simply missing', async () => {
  const result = await resolveReportSource(unit, [
    { source: 'snapshot', resolve: async () => ({ source: 'snapshot', failureKind: 'missing', detail: 'SNAPSHOT_NOT_FOUND' }) },
    { source: 'jira', resolve: async () => ({ source: 'jira', coverage: { expected: 1, covered: 1, cutoff: false }, value: { rows: [] } }) },
  ]);

  const metadata = metadataFromResolution(result);
  assert.equal(metadata.source, 'jira');
  assert.equal(metadata.coverage.status, 'complete');
  assert.equal(metadata.fallback, false);
  assert.equal(metadata.warning, null);
});

test('does not label Jira as fallback when archive has no data', async () => {
  const result = await resolveReportSource(unit, [
    { source: 'archive', resolve: async () => ({ source: 'archive', coverage: { expected: 0, covered: 0, cutoff: false } }) },
    { source: 'jira', resolve: async () => ({ source: 'jira', coverage: { expected: 1, covered: 1, cutoff: false }, value: { rows: [] } }) },
  ]);

  const metadata = metadataFromResolution(result);
  assert.equal(metadata.source, 'jira');
  assert.equal(metadata.coverage.status, 'complete');
  assert.equal(metadata.fallback, false);
  assert.equal(metadata.warning, null);
});
