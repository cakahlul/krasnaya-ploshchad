import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLoginThemeSelection,
  createLoginThemeMediaController,
  getEffectiveLoginTheme,
  getSystemLoginTheme,
  isLoginTheme,
  LOGIN_THEME_CONTRAST_PAIRS,
  LOGIN_THEME_MEDIA_QUERY,
  LOGIN_THEME_STORAGE_KEY,
  readStoredLoginTheme,
  type LoginThemeStorage,
} from './useLoginTheme';

class FakeMediaQueryList {
  matches: boolean;
  private readonly listeners = new Set<() => void>();

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(_type: 'change', listener: () => void) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'change', listener: () => void) {
    this.listeners.delete(listener);
  }

  emit() {
    this.listeners.forEach((listener) => listener());
  }

  get listenerCount() {
    return this.listeners.size;
  }
}

function createStorage(values: Record<string, string> = {}): LoginThemeStorage {
  const stored = new Map(Object.entries(values));
  return {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
  };
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
}

function relativeLuminance(hex: string) {
  return hexToRgb(hex)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

test('stored login theme accepts only system, light, and dark', () => {
  assert.equal(isLoginTheme('system'), true);
  assert.equal(isLoginTheme('light'), true);
  assert.equal(isLoginTheme('dark'), true);
  assert.equal(isLoginTheme('void'), false);
  assert.equal(isLoginTheme(null), false);
  assert.equal(readStoredLoginTheme(createStorage({ [LOGIN_THEME_STORAGE_KEY]: 'light' })), 'light');
  assert.equal(readStoredLoginTheme(createStorage({ [LOGIN_THEME_STORAGE_KEY]: 'void' })), 'system');
  assert.equal(readStoredLoginTheme(createStorage()), 'system');
});

test('selection persists valid choice and reload restores it', () => {
  const storage = createStorage();
  const selection = createLoginThemeSelection(storage);

  assert.equal(selection.getSelectedTheme(), 'system');
  assert.equal(selection.setSelectedTheme('light'), 'light');
  assert.equal(selection.getSelectedTheme(), 'light');
  assert.equal(readStoredLoginTheme(storage), 'light');
  assert.equal(selection.reload(), 'light');
});

test('failed write keeps current choice but reload restores prior valid value', () => {
  const stored: string | null = 'light';
  const deniedStorage: LoginThemeStorage = {
    getItem: () => stored,
    setItem: () => {
      throw new Error('denied');
    },
  };
  const selection = createLoginThemeSelection(deniedStorage);

  assert.equal(selection.getSelectedTheme(), 'light');
  assert.equal(selection.setSelectedTheme('dark'), 'dark');
  assert.equal(selection.getSelectedTheme(), 'dark');
  assert.equal(selection.reload(), 'light');
});

test('invalid or absent persisted choice reloads as System', () => {
  let stored: string | null = 'void';
  const storage: LoginThemeStorage = {
    getItem: () => stored,
    setItem: (_key, value) => { stored = value; },
  };
  const selection = createLoginThemeSelection(storage);

  assert.equal(selection.getSelectedTheme(), 'system');
  stored = 'dark';
  assert.equal(selection.reload(), 'dark');
  stored = 'void';
  assert.equal(selection.reload(), 'system');
  stored = null;
  assert.equal(selection.reload(), 'system');
});

test('selection accesses only the login storage key', () => {
  const accesses: string[] = [];
  const storage: LoginThemeStorage = {
    getItem: (key) => {
      accesses.push(`get:${key}`);
      return null;
    },
    setItem: (key, value) => {
      accesses.push(`set:${key}:${value}`);
    },
  };
  const selection = createLoginThemeSelection(storage);

  assert.equal(selection.setSelectedTheme('dark'), 'dark');
  assert.deepEqual(accesses, [
    `get:${LOGIN_THEME_STORAGE_KEY}`,
    `set:${LOGIN_THEME_STORAGE_KEY}:dark`,
  ]);
  assert.equal(accesses.some((access) => access.endsWith(':theme')), false);
});

test('system theme resolves through requested media query and falls back dark', () => {
  let receivedQuery = '';
  const light = getSystemLoginTheme((query) => {
    receivedQuery = query;
    return { matches: false } as MediaQueryList;
  });
  assert.equal(receivedQuery, LOGIN_THEME_MEDIA_QUERY);
  assert.equal(light, 'light');
  assert.equal(getSystemLoginTheme(() => ({ matches: true }) as MediaQueryList), 'dark');
  assert.equal(getSystemLoginTheme(undefined), 'dark');
  assert.equal(getSystemLoginTheme(() => { throw new Error('unavailable'); }), 'dark');
});

test('System media controller follows OS changes and cleans listener', () => {
  const mediaQuery = new FakeMediaQueryList(false);
  const controller = createLoginThemeMediaController(mediaQuery as unknown as MediaQueryList);
  const changes: string[] = [];
  const unsubscribe = controller.subscribe(() => changes.push(controller.getCurrentTheme()));

  assert.equal(controller.getCurrentTheme(), 'light');
  assert.equal(mediaQuery.listenerCount, 1);
  mediaQuery.matches = true;
  mediaQuery.emit();
  assert.deepEqual(changes, ['dark']);
  unsubscribe();
  assert.equal(mediaQuery.listenerCount, 0);
  mediaQuery.matches = false;
  mediaQuery.emit();
  assert.deepEqual(changes, ['dark']);
});

test('media controller supports legacy listeners and guarded failures', () => {
  let listener: (() => void) | undefined;
  let removed = false;
  const legacyMedia = {
    matches: false,
    addListener: (next: () => void) => { listener = next; },
    removeListener: () => { removed = true; },
  } as unknown as MediaQueryList;
  const controller = createLoginThemeMediaController(legacyMedia);
  const unsubscribe = controller.subscribe(() => undefined);
  assert.ok(listener);
  unsubscribe();
  assert.equal(removed, true);

  const deniedMedia = {
    matches: false,
    addEventListener: () => { throw new Error('denied'); },
  } as unknown as MediaQueryList;
  assert.doesNotThrow(() => createLoginThemeMediaController(deniedMedia).subscribe(() => undefined));
});

test('explicit themes ignore system theme', () => {
  assert.equal(getEffectiveLoginTheme('system', 'light'), 'light');
  assert.equal(getEffectiveLoginTheme('system', 'dark'), 'dark');
  assert.equal(getEffectiveLoginTheme('light', 'dark'), 'light');
  assert.equal(getEffectiveLoginTheme('dark', 'light'), 'dark');
});

test('approved opaque token pairs meet normal-text contrast threshold', () => {
  for (const pair of LOGIN_THEME_CONTRAST_PAIRS) {
    assert.ok(
      contrastRatio(pair.foreground, pair.background) >= pair.minimum,
      `${pair.mode}: ${pair.foreground} on ${pair.background}`,
    );
  }
});
