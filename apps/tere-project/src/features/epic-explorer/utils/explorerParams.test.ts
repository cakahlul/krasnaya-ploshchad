import assert from 'node:assert';
import { readSelection, toQueryString, selectionEquals } from './explorerParams';

// readSelection: present params
{
  const sel = readSelection(new URLSearchParams('project=SLS&epicKey=SLS-1'));
  assert.deepEqual(sel, { project: 'SLS', epicKey: 'SLS-1' });
}

// readSelection: empty/absent normalise to null (not '')
{
  assert.deepEqual(readSelection(new URLSearchParams('')), {
    project: null,
    epicKey: null,
  });
  assert.deepEqual(readSelection(new URLSearchParams('project=')), {
    project: null,
    epicKey: null,
  });
}

// toQueryString: full selection
assert.equal(
  toQueryString({ project: 'SLS', epicKey: 'SLS-1' }),
  'project=SLS&epicKey=SLS-1',
);

// toQueryString: project only
assert.equal(toQueryString({ project: 'SLS', epicKey: null }), 'project=SLS');

// toQueryString: lone epicKey is never emitted without a project
assert.equal(toQueryString({ project: null, epicKey: 'SLS-1' }), '');

// toQueryString: empty selection -> empty string (clears the URL query)
assert.equal(toQueryString({ project: null, epicKey: null }), '');

// round-trip: read(write(x)) === x for a project-scoped selection
{
  const sel = { project: 'SLS', epicKey: 'SLS-1' };
  assert.deepEqual(readSelection(new URLSearchParams(toQueryString(sel))), sel);
}

// selectionEquals
assert.ok(
  selectionEquals({ project: 'A', epicKey: 'A-1' }, { project: 'A', epicKey: 'A-1' }),
);
assert.ok(
  !selectionEquals({ project: 'A', epicKey: 'A-1' }, { project: 'A', epicKey: 'A-2' }),
);
assert.ok(
  !selectionEquals({ project: 'A', epicKey: null }, { project: 'B', epicKey: null }),
);

console.log('explorerParams.test.ts OK');
