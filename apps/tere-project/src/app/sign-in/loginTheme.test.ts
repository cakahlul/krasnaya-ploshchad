import assert from 'node:assert/strict';
import test from 'node:test';
import { readDashboardTheme, writeDashboardTheme } from '../../hooks/themeStorage';
import { getSystemLoginTheme, isLoginThemePreference, readLoginThemePreference, resolveLoginTheme, subscribeToSystemLoginTheme, writeLoginThemePreference } from './loginThemeCore';
function makeStorage(initial: Record<string, string> = {}, onWrite?: (key: string, value: string) => void) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { onWrite?.(key, value); values.set(key, value); },
  } as unknown as Storage;
}
test('accepts only exact lowercase preferences', () => {
  assert.equal(isLoginThemePreference('system'), true);
  assert.equal(isLoginThemePreference('light'), true);
  assert.equal(isLoginThemePreference('dark'), true);
  for (const value of ['System', 'LIGHT', 'dark ', '', null, undefined, 1]) assert.equal(isLoginThemePreference(value), false);
});
test('reads login preference without touching dashboard key', () => {
  const writes: string[] = [];
  const storage = makeStorage({ theme: 'crimson', 'tere-login-theme': 'dark' }, key => writes.push(key));
  assert.equal(readLoginThemePreference(storage), 'dark');
  writeLoginThemePreference(storage, 'light');
  writeLoginThemePreference(storage, 'system');
  storage.setItem('theme', 'void');
  assert.deepEqual(writes, ['tere-login-theme', 'tere-login-theme', 'theme']);
  assert.equal(readLoginThemePreference(storage), 'system');
});
test('missing, invalid, and throwing storage safely use System', () => {
  assert.equal(readLoginThemePreference(undefined), 'system');
  assert.equal(readLoginThemePreference(makeStorage({ 'tere-login-theme': 'LIGHT' })), 'system');
  const throwingStorage = { getItem: () => { throw new Error('denied'); } } as unknown as Storage;
  assert.equal(readLoginThemePreference(throwingStorage), 'system');
});
test('write failure is non-fatal', () => {
  const throwingStorage = { setItem: () => { throw new Error('denied'); } } as unknown as Storage;
  assert.doesNotThrow(() => writeLoginThemePreference(throwingStorage, 'dark'));
  assert.doesNotThrow(() => writeLoginThemePreference(undefined, 'light'));
});
test('fixed preferences ignore system theme', () => {
  assert.equal(resolveLoginTheme('light', 'dark'), 'light');
  assert.equal(resolveLoginTheme('dark', 'light'), 'dark');
  assert.equal(resolveLoginTheme('system', 'dark'), 'dark');
  assert.equal(resolveLoginTheme('system', 'light'), 'light');
});
test('system resolution handles media, missing API, and throws', () => {
  assert.equal(getSystemLoginTheme(() => ({ matches: true } as MediaQueryList)), 'dark');
  assert.equal(getSystemLoginTheme(() => ({ matches: false } as MediaQueryList)), 'light');
  assert.equal(getSystemLoginTheme(undefined), 'light');
  assert.equal(getSystemLoginTheme(() => { throw new Error('unsupported'); }), 'light');
});

test('dashboard provider read guard preserves allowed themes and ignores failures', () => {
  assert.equal(readDashboardTheme(undefined), null);
  assert.equal(readDashboardTheme(makeStorage({ theme: 'void' })), 'void');
  const throwingStorage = { getItem: () => { throw new Error('denied'); } } as unknown as Storage;
  assert.equal(readDashboardTheme(throwingStorage), null);
});
test('dashboard provider write guard ignores unavailable storage', () => {
  const writes: string[] = [];
  const storage = makeStorage({}, key => writes.push(key));
  assert.doesNotThrow(() => writeDashboardTheme(storage, 'crimson'));
  assert.deepEqual(writes, ['theme']);
  const throwingStorage = { setItem: () => { throw new Error('denied'); } } as unknown as Storage;
  assert.doesNotThrow(() => writeDashboardTheme(throwingStorage, 'light'));
});
test('system media subscription follows transitions and blocks stale callbacks after guarded cleanup', () => {
  let listener: ((event: MediaQueryListEvent) => void) | undefined;
  let cleanupCalls = 0;
  const mediaQuery = {
    matches: false,
    addEventListener: (_type: string, callback: (event: MediaQueryListEvent) => void) => { listener = callback; },
    removeEventListener: () => { cleanupCalls += 1; throw new Error('cleanup denied'); },
  } as unknown as MediaQueryList;
  const observed: string[] = [];
  const unsubscribe = subscribeToSystemLoginTheme(() => mediaQuery, theme => observed.push(theme));
  listener?.({ matches: true } as MediaQueryListEvent);
  assert.deepEqual(observed, ['dark']);
  unsubscribe();
  listener?.({ matches: false } as MediaQueryListEvent);
  assert.deepEqual(observed, ['dark']);
  assert.equal(cleanupCalls, 1);
});
