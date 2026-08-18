import assert from 'node:assert/strict';
import { normalizeTheme } from './useTheme';

assert.equal(normalizeTheme('light'), 'light');
assert.equal(normalizeTheme('dark'), 'dark');
assert.equal(normalizeTheme('void'), 'dark');
assert.equal(normalizeTheme('crimson'), 'dark');
assert.equal(normalizeTheme(null), 'light');

console.log('theme contract passed');
