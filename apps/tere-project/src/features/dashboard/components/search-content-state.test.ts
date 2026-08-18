import assert from 'node:assert/strict';
import { getSearchContentState } from './search-content-state';

assert.equal(getSearchContentState(true, 0), 'loading');
assert.equal(getSearchContentState(false, 0), 'empty');
assert.equal(getSearchContentState(true, 3), 'results');
assert.equal(getSearchContentState(false, 3), 'results');

console.log('search content state contract passed');
