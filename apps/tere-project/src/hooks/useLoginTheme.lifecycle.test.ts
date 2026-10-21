import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLoginThemeMediaController,
  getEffectiveLoginTheme,
  type LoginTheme,
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

test('refreshes current OS match after explicit override returns to System', () => {
  const mediaQuery = new FakeMediaQueryList(false);
  const controller = createLoginThemeMediaController(mediaQuery as unknown as MediaQueryList);
  let selectedTheme: LoginTheme = 'system';
  let systemTheme = controller.getCurrentTheme();
  let effectiveTheme = getEffectiveLoginTheme(selectedTheme, systemTheme);
  const update = () => {
    systemTheme = controller.getCurrentTheme();
    effectiveTheme = getEffectiveLoginTheme(selectedTheme, systemTheme);
  };

  let unsubscribe = controller.subscribe(update);
  assert.equal(effectiveTheme, 'light');
  assert.equal(mediaQuery.listenerCount, 1);

  selectedTheme = 'dark';
  unsubscribe();
  effectiveTheme = getEffectiveLoginTheme(selectedTheme, systemTheme);
  assert.equal(effectiveTheme, 'dark');
  assert.equal(mediaQuery.listenerCount, 0);

  mediaQuery.matches = true;
  mediaQuery.emit();
  assert.equal(effectiveTheme, 'dark');

  selectedTheme = 'system';
  update();
  unsubscribe = controller.subscribe(update);
  assert.equal(systemTheme, 'dark');
  assert.equal(effectiveTheme, 'dark');
  assert.equal(mediaQuery.listenerCount, 1);

  unsubscribe();
  assert.equal(mediaQuery.listenerCount, 0);
});

test('listener failures do not escape subscribe or cleanup', () => {
  const mediaQuery = {
    matches: false,
    addEventListener() {
      throw new Error('denied');
    },
    removeEventListener() {
      throw new Error('denied');
    },
  } as unknown as MediaQueryList;
  const controller = createLoginThemeMediaController(mediaQuery);

  assert.doesNotThrow(() => {
    const unsubscribe = controller.subscribe(() => undefined);
    unsubscribe();
  });
});
