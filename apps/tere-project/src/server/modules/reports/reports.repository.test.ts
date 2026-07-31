import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEpicDescendantJql, buildEpicHeaderJql } from './reports.repository';

test('builds one epic header query for multiple selected epics', () => {
  assert.equal(
    buildEpicHeaderJql(['SLS-1', 'USR-2']),
    'issuekey in (SLS-1,USR-2)',
  );
});

test('builds one descendant query for multiple teams and parent epics', () => {
  assert.equal(
    buildEpicDescendantJql(['SLS', 'USR'], ['SLS-1', 'USR-2']),
    'project in (SLS,USR) AND parent in (SLS-1,USR-2) ORDER BY created DESC',
  );
});
