import assert from 'node:assert';
import { readSelection, toQueryString, selectionEquals } from './explorerParams';

// readSelection: present params
{
  const sel = readSelection(new URLSearchParams('project=SLS&epicKey=SLS-1'));
  assert.deepEqual(sel, { projects: ['SLS'], epicKeys: ['SLS-1'] });
}

// readSelection: empty/absent normalise to null (not '')
{
  assert.deepEqual(readSelection(new URLSearchParams('')), {
    projects: [],
    epicKeys: [],
  });
  assert.deepEqual(readSelection(new URLSearchParams('project=')), {
    projects: [],
    epicKeys: [],
  });
}

// toQueryString: full selection
assert.equal(
  toQueryString({ projects: ['SLS'], epicKeys: ['SLS-1'] }),
  'project=SLS&epicKey=SLS-1',
);

// toQueryString: project only
assert.equal(toQueryString({ projects: ['SLS'], epicKeys: [] }), 'project=SLS');

// toQueryString: lone epicKey is never emitted without a project
assert.equal(toQueryString({ projects: [], epicKeys: ['SLS-1'] }), '');

// toQueryString: empty selection -> empty string (clears the URL query)
assert.equal(toQueryString({ projects: [], epicKeys: [] }), '');

// round-trip: read(write(x)) === x for a project-scoped selection
{
  const sel = { projects: ['SLS'], epicKeys: ['SLS-1'] };
  assert.deepEqual(readSelection(new URLSearchParams(toQueryString(sel))), sel);
}

// selectionEquals
assert.ok(
  selectionEquals({ projects: ['A'], epicKeys: ['A-1'] }, { projects: ['A'], epicKeys: ['A-1'] }),
);
assert.ok(
  !selectionEquals({ projects: ['A'], epicKeys: ['A-1'] }, { projects: ['A'], epicKeys: ['A-2'] }),
);
assert.ok(
  !selectionEquals({ projects: ['A'], epicKeys: [] }, { projects: ['B'], epicKeys: [] }),
);

assert.deepEqual(
  readSelection(new URLSearchParams('project=SLS,USR&epicKey=SLS-1,USR-2')),
  { projects: ['SLS', 'USR'], epicKeys: ['SLS-1', 'USR-2'] },
);

console.log('explorerParams.test.ts OK');
