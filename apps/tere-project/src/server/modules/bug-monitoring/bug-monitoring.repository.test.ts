import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBugJql, buildBugSnapshotJql } from './bug-monitoring.repository';

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
