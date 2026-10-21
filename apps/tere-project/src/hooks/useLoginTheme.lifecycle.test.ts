import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createLoginThemeMediaController,
  getEffectiveLoginTheme,
  useLoginTheme,
  type LoginTheme,
} from './useLoginTheme';
import { ThemeProvider } from './useTheme';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type FakeDocument = {
  nodeType: number;
  defaultView: FakeWindow;
  documentElement: FakeNode;
  activeElement: FakeNode | null;
  createElement: () => FakeNode;
  createElementNS: () => FakeNode;
  createTextNode: (text: string) => { nodeType: number; nodeValue: string };
  addEventListener: () => void;
  removeEventListener: () => void;
};

type FakeWindow = {
  HTMLIFrameElement: typeof FakeIFrameElement;
  HTMLElement: typeof FakeNode;
  Node: typeof FakeNode;
  document: FakeDocument;
  localStorage: StorageLike;
  matchMedia?: (query: string) => MediaQueryList;
};

class FakeIFrameElement {}

class FakeNode {
  readonly nodeType = 1;
  readonly nodeName = 'DIV';
  readonly tagName = 'DIV';
  readonly namespaceURI = 'http://www.w3.org/1999/xhtml';
  readonly childNodes: FakeNode[] = [];
  readonly classList = {
    add: (..._tokens: string[]) => undefined,
    remove: (..._tokens: string[]) => undefined,
  };
  readonly ownerDocument: FakeDocument;

  constructor(ownerDocument: FakeDocument) {
    this.ownerDocument = ownerDocument;
  }

  addEventListener() {}
  removeEventListener() {}
  appendChild(node: FakeNode) {
    this.childNodes.push(node);
    return node;
  }
  insertBefore(node: FakeNode) {
    this.childNodes.push(node);
    return node;
  }
  removeChild(node: FakeNode) {
    const index = this.childNodes.indexOf(node);
    if (index >= 0) this.childNodes.splice(index, 1);
    return node;
  }
  setAttribute() {}
  removeAttribute() {}
}

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

function createStorage(values: Record<string, string> = {}): StorageLike {
  const stored = new Map(Object.entries(values));
  return {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
  };
}

function installBrowserHarness(options: {
  storage?: StorageLike;
  mediaQuery?: FakeMediaQueryList;
  matchMedia?: ((query: string) => MediaQueryList) | undefined;
} = {}) {
  const mediaQuery = options.mediaQuery ?? new FakeMediaQueryList(false);
  const fakeWindow = {} as FakeWindow;
  const fakeDocument = {
    nodeType: 9,
    defaultView: fakeWindow,
    activeElement: null,
    createElement: () => new FakeNode(fakeDocument),
    createElementNS: () => new FakeNode(fakeDocument),
    createTextNode: (text: string) => ({ nodeType: 3, nodeValue: text }),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as FakeDocument;
  fakeDocument.documentElement = new FakeNode(fakeDocument);
  Object.assign(fakeWindow, {
    HTMLIFrameElement: FakeIFrameElement,
    HTMLElement: FakeNode,
    Node: FakeNode,
    document: fakeDocument,
    localStorage: options.storage ?? createStorage(),
    matchMedia: 'matchMedia' in options
      ? options.matchMedia
      : () => mediaQuery as unknown as MediaQueryList,
  });

  const globals = globalThis as typeof globalThis & {
    document: FakeDocument;
    window: FakeWindow;
    IS_REACT_ACT_ENVIRONMENT: boolean;
    React: typeof React;
  };
  globals.document = fakeDocument;
  globals.window = fakeWindow;
  globals.IS_REACT_ACT_ENVIRONMENT = true;
  globals.React = React;
  return { mediaQuery };
}

type LoginThemeSnapshot = ReturnType<typeof useLoginTheme>;

async function renderLoginTheme(options: Parameters<typeof installBrowserHarness>[0] = {}) {
  installBrowserHarness(options);
  let snapshot: LoginThemeSnapshot | undefined;

  function Probe() {
    snapshot = useLoginTheme();
    return null;
  }

  function App() {
    return React.createElement(ThemeProvider, null, React.createElement(Probe));
  }

  const container = new FakeNode(globalThis.document as unknown as FakeDocument);
  const root = createRoot(container as unknown as Element);
  await React.act(async () => {
    root.render(React.createElement(App));
  });

  assert.ok(snapshot);
  return {
    root,
    getSnapshot: () => {
      assert.ok(snapshot);
      return snapshot;
    },
  };
}

test('actual hook effect refreshes OS match after explicit override returns to System', async () => {
  const mediaQuery = new FakeMediaQueryList(false);
  const harness = await renderLoginTheme({ mediaQuery });
  assert.equal(harness.getSnapshot().effectiveTheme, 'light');
  assert.equal(mediaQuery.listenerCount, 1);

  await React.act(async () => {
    harness.getSnapshot().setSelectedTheme('dark');
  });
  assert.equal(harness.getSnapshot().effectiveTheme, 'dark');
  assert.equal(mediaQuery.listenerCount, 0);

  mediaQuery.matches = true;
  mediaQuery.emit();
  assert.equal(harness.getSnapshot().effectiveTheme, 'dark');

  await React.act(async () => {
    harness.getSnapshot().setSelectedTheme('system');
  });
  assert.equal(harness.getSnapshot().effectiveTheme, 'dark');
  assert.equal(mediaQuery.listenerCount, 1);

  await React.act(async () => {
    harness.root.unmount();
  });
  assert.equal(mediaQuery.listenerCount, 0);
});

test('successful subscription guards throwing cleanup', () => {
  let subscribed = false;
  const mediaQuery = {
    matches: false,
    addEventListener(_type: 'change', _listener: () => void) {
      subscribed = true;
    },
    removeEventListener() {
      throw new Error('denied');
    },
  } as unknown as MediaQueryList;
  const controller = createLoginThemeMediaController(mediaQuery);
  const unsubscribe = controller.subscribe(() => undefined);

  assert.equal(subscribed, true);
  assert.doesNotThrow(unsubscribe);
});

test('listener registration failure is guarded', () => {
  const mediaQuery = {
    matches: false,
    addEventListener() {
      throw new Error('denied');
    },
  } as unknown as MediaQueryList;
  const controller = createLoginThemeMediaController(mediaQuery);

  assert.doesNotThrow(() => controller.subscribe(() => undefined));
});

test('storage denial leaves provider and login theme usable', async () => {
  const deniedStorage: StorageLike = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
  };
  const harness = await renderLoginTheme({ storage: deniedStorage });

  assert.equal(harness.getSnapshot().isReady, true);
  assert.equal(harness.getSnapshot().selectedTheme, 'system');
  await React.act(async () => {
    harness.getSnapshot().setSelectedTheme('light');
  });
  assert.equal(harness.getSnapshot().effectiveTheme, 'light');

  await React.act(async () => {
    harness.root.unmount();
  });
});

test('missing or throwing matchMedia falls back to Dark', async () => {
  const missing = await renderLoginTheme({ matchMedia: undefined });
  assert.equal(missing.getSnapshot().isReady, true);
  assert.equal(missing.getSnapshot().effectiveTheme, 'dark');
  await React.act(async () => {
    missing.root.unmount();
  });

  const throwing = await renderLoginTheme({
    matchMedia: () => {
      throw new Error('unavailable');
    },
  });
  assert.equal(throwing.getSnapshot().isReady, true);
  assert.equal(throwing.getSnapshot().effectiveTheme, 'dark');
  await React.act(async () => {
    throwing.root.unmount();
  });
});

test('effective theme keeps explicit choices independent from system', () => {
  let selectedTheme: LoginTheme = 'system';
  assert.equal(getEffectiveLoginTheme(selectedTheme, 'light'), 'light');
  selectedTheme = 'dark';
  assert.equal(getEffectiveLoginTheme(selectedTheme, 'light'), 'dark');
});
