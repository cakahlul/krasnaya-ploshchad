import assert from 'node:assert/strict';
import { isSpotlightShortcut } from './spotlight-shortcut';

assert.equal(isSpotlightShortcut({ key: 'k', metaKey: true, ctrlKey: false }), true);
assert.equal(isSpotlightShortcut({ key: 'K', metaKey: false, ctrlKey: true }), true);
assert.equal(isSpotlightShortcut({ key: 'k', metaKey: false, ctrlKey: false }), false);
assert.equal(isSpotlightShortcut({ key: 'p', metaKey: true, ctrlKey: false }), false);

console.log('spotlight shortcut contract passed');
