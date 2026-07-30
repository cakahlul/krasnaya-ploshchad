import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBugJql } from './bug-monitoring.repository';

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
