import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCloseOverrides, buildBugJql, buildBugSnapshotJql, countActiveBugsAtMonthEnd } from './bug-monitoring.repository';

test('uses a project-specific bug JQL unchanged', () => {
  assert.equal(
    buildBugJql({ shortName: 'INCL', bugJql: 'project = INCL AND labels = lending-incident' }),
    'project = INCL AND labels = lending-incident',
  );
});

test('keeps the existing project and issue-type query as fallback', () => {
  assert.equal(
    buildBugJql({ shortName: 'INCF', bugIssueType: 'Bug' }),
    'project = INCF AND issuetype = Bug ORDER BY created DESC',
  );
});

test('builds an end-of-month active bug snapshot query', () => {
  assert.equal(
    buildBugSnapshotJql({ shortName: 'INCF', bugIssueType: 'Bug' }, '2026-01-31'),
    'project = INCF AND issuetype = Bug AND created < "2026-02-01" AND (resolutiondate >= "2026-02-01" OR resolution IS EMPTY) ORDER BY created DESC',
  );
});

test('keeps custom bug filters while replacing their ordering for snapshots', () => {
  assert.equal(
    buildBugSnapshotJql({ shortName: 'INCL', bugJql: 'project = INCL AND labels = lending-incident ORDER BY updated DESC' }, '2026-02-28'),
    'project = INCL AND labels = lending-incident AND created < "2026-03-01" AND (resolutiondate >= "2026-03-01" OR resolution IS EMPTY) ORDER BY created DESC',
  );
});

test('overrides the Jira close date only for keys listed in the override table', () => {
  const bugs = [
    { key: 'INCF-711', fields: { created: '2026-06-01T00:00:00.000Z', resolutiondate: '2026-08-04T09:00:00.000Z' } },
    { key: 'INCL-212', fields: { created: '2026-06-01T00:00:00.000Z', resolutiondate: null } },
    { key: 'SLS-123', fields: { created: '2026-06-01T00:00:00.000Z', resolutiondate: '2026-07-02T09:00:00.000Z' } },
  ] as never[];
  const result = applyCloseOverrides(bugs, new Map([['INCF-711', '2026-06-20'], ['INCL-212', '2026-06-25']]));

  assert.equal(result[0].fields.resolutiondate, '2026-06-20');
  assert.equal(result[1].fields.resolutiondate, '2026-06-25');
  assert.equal(result[2].fields.resolutiondate, '2026-07-02T09:00:00.000Z');
  assert.equal(result[2], bugs[2]);
});

test('counts active bugs from the full history at month end', () => {
  const bug = (created: string, resolutiondate: string | null = null) => ({
    fields: { created, resolutiondate },
  }) as never;

  assert.equal(countActiveBugsAtMonthEnd([
    bug('2026-01-01T00:00:00.000Z'),
    bug('2026-02-01T00:00:00.000Z'),
    bug('2025-12-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
    bug('2025-12-01T00:00:00.000Z', '2026-01-31T00:00:00.000Z'),
  ], '2026-01-31'), 2);
});
