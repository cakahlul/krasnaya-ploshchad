import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFile(new URL(path, new URL('../', import.meta.url)), 'utf8');
const moduleCache = new Map();

const resolveLocalModule = (specifier, parentPath) => {
  const base = resolve(dirname(parentPath), specifier);
  const candidates = extname(base)
    ? [base]
    : [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')];
  const found = candidates.find((candidate) => {
    try {
      readFileSync(candidate);
      return true;
    } catch {
      return false;
    }
  });
  if (!found) throw new Error(`Cannot resolve ${specifier} from ${parentPath}`);
  return found;
};

const loadTsModule = (relativePath) => {
  const absolutePath = resolve(appRoot, relativePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;

  const compiledModule = { exports: {} };
  moduleCache.set(absolutePath, compiledModule);
  const source = readFileSync(absolutePath, 'utf8');
  const output = ts.transpileModule(source, {
    fileName: absolutePath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier === '@krasnaya/beras-ui/components') {
      return loadTsModule('src/components/feedback/index.ts');
    }
    if (specifier === '@krasnaya/beras-ui/styles.css') return {};
    return specifier.startsWith('.')
      ? loadTsModule(resolveLocalModule(specifier, absolutePath).slice(appRoot.length))
      : require(specifier);
  };

  Function('require', 'module', 'exports', output)(
    localRequire,
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
};

const expectedExports = [
  'Spinner',
  'Skeleton',
  'PageSkeleton',
  'LoadingOverlay',
  'LoadingIllustration',
  'StateView',
  'Callout',
  'Toast',
  'ToastViewport',
  'MaintenanceState',
  'AccessState',
];

const expectedCaseIds = [
  'feedback/loading-overlay/waiting',
  'feedback/loading-overlay/data',
  'feedback/loading-overlay/progress',
  'feedback/loading-overlay/reduced-motion',
  'feedback/page-skeleton/default',
  'feedback/page-skeleton/dense',
  'feedback/page-skeleton/reduced-motion',
  'feedback/spinner/default',
  'feedback/spinner/labelled',
  'feedback/spinner/reduced-motion',
  'feedback/maintenance-state/default',
  'feedback/maintenance-state/retry-pending',
  'feedback/maintenance-state/narrow',
  'feedback/access-state/loading',
  'feedback/access-state/denied',
  'feedback/access-state/not-registered',
  'feedback/state-view/loading',
  'feedback/state-view/empty',
  'feedback/state-view/error',
  'feedback/state-view/retry',
  'feedback/state-view/coming-soon',
  'feedback/toast/success',
  'feedback/toast/error',
  'feedback/toast/long-content',
  'feedback/toast/reduced-motion',
  'feedback/export-toast/success',
  'feedback/export-toast/error',
  'feedback/export-toast/long-content',
  'feedback/export-toast/reduced-motion',
  'feedback/export-toast/narrow',
];

test('feedback index replaces the scaffold with every exact export', async () => {
  const source = await read('src/components/feedback/index.ts');
  const feedback = loadTsModule('src/components/feedback/index.ts');

  assert.deepEqual(Object.keys(feedback).sort(), [...expectedExports].sort());
  for (const name of expectedExports) assert.equal(typeof feedback[name], 'function');
  assert.doesNotMatch(source, /\b(?:stub|contractPlaceholder|ContractStub)\b/);
});

test('loading surfaces expose busy state and hide decorative geometry', () => {
  const {
    LoadingIllustration,
    LoadingOverlay,
    PageSkeleton,
    Skeleton,
    Spinner,
  } = loadTsModule('src/components/feedback/index.ts');

  const spinner = renderToStaticMarkup(
    React.createElement(Spinner, {
      id: 'spinner',
      className: 'consumer-space',
      label: 'Loading report',
      size: 'lg',
    }),
  );
  assert.match(spinner, /^<span id="spinner" class="beras-spinner consumer-space"/);
  assert.match(spinner, /role="status"/);
  assert.match(spinner, /aria-busy="true"/);
  assert.match(spinner, /Loading report/);
  assert.match(spinner, /<svg[^>]*aria-hidden="true"/);
  assert.equal((spinner.match(/consumer-space/g) ?? []).length, 1);

  const skeleton = renderToStaticMarkup(
    React.createElement(Skeleton, { label: 'Loading row' }),
  );
  assert.match(skeleton, /class="beras-skeleton"/);
  assert.match(skeleton, /aria-busy="true"/);
  assert.match(skeleton, /aria-hidden="true"/);

  const page = renderToStaticMarkup(
    React.createElement(PageSkeleton, { label: 'Loading dashboard', dense: true }),
  );
  assert.match(page, /class="beras-page-skeleton"/);
  assert.match(page, /data-beras-variant="dense"/);
  assert.match(page, /aria-busy="true"/);
  assert.ok((page.match(/aria-hidden="true"/g) ?? []).length >= 1);

  const illustrationProps = {
    label: 'Preparing export',
    stage: 'progress',
    progress: 125,
    seed: 'beras-05',
  };
  const illustration = renderToStaticMarkup(
    React.createElement(LoadingIllustration, illustrationProps),
  );
  assert.equal(
    illustration,
    renderToStaticMarkup(React.createElement(LoadingIllustration, illustrationProps)),
  );
  assert.match(illustration, /class="beras-loading-illustration"/);
  assert.match(illustration, /data-beras-state="progress"/);
  assert.match(illustration, /role="status"/);
  assert.match(illustration, /aria-busy="true"/);
  assert.match(illustration, /<svg[^>]*aria-hidden="true"/);
  assert.match(illustration, /<progress[^>]*value="100"[^>]*max="100"/);
  assert.match(illustration, /Preparing export/);
  assert.doesNotMatch(illustration, /(?:https?:\/\/|<img)/);

  const closed = renderToStaticMarkup(
    React.createElement(LoadingOverlay, { ...illustrationProps, open: false }),
  );
  const open = renderToStaticMarkup(
    React.createElement(LoadingOverlay, { ...illustrationProps, open: true }),
  );
  assert.match(closed, /class="beras-loading-overlay" hidden=""/);
  assert.doesNotMatch(closed.match(/^<section[^>]*>/)?.[0] ?? '', /aria-busy="true"/);
  assert.match(open, /class="beras-loading-overlay"/);
  assert.match(open, /role="status"/);
  assert.match(open, /aria-busy="true"/);
  assert.equal((open.match(/role="status"/g) ?? []).length, 1);
});

test('state, maintenance, and access surfaces expose text and native pending guards', () => {
  const {
    AccessState,
    Callout,
    MaintenanceState,
    StateView,
  } = loadTsModule('src/components/feedback/index.ts');

  const loading = renderToStaticMarkup(
    React.createElement(StateView, {
      state: { status: 'loading', label: 'Loading members' },
    }),
  );
  assert.match(loading, /class="beras-state-view"/);
  assert.match(loading, /data-beras-state="loading"/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /Loading members/);
  assert.equal((loading.match(/role="status"/g) ?? []).length, 1);

  const retry = renderToStaticMarkup(
    React.createElement(StateView, {
      state: {
        status: 'error',
        title: 'Members unavailable',
        description: 'Try again.',
      },
      action: { id: 'retry', label: 'Retry', pending: true },
      onRetry() {},
    }),
  );
  assert.match(retry, /role="alert"/);
  assert.match(retry, /data-beras-state="error"/);
  assert.match(retry, /<button[^>]*disabled=""/);
  assert.match(retry, /aria-busy="true"/);

  const maintenance = renderToStaticMarkup(
    React.createElement(MaintenanceState, {
      title: 'Scheduled maintenance',
      description: 'Service will return shortly.',
      pending: true,
      onRetry() {},
    }),
  );
  assert.match(maintenance, /class="beras-maintenance-state"/);
  assert.match(maintenance, /aria-busy="true"/);
  assert.match(maintenance, /<button[^>]*disabled=""/);

  const access = renderToStaticMarkup(
    React.createElement(AccessState, {
      status: 'denied',
      title: 'Access denied',
      description: 'Ask an administrator for access.',
      action: { id: 'request-access', label: 'Request access' },
      onAction() {},
    }),
  );
  assert.match(access, /class="beras-access-state"/);
  assert.match(access, /data-beras-state="denied"/);
  assert.match(access, /data-beras-tone="danger"/);
  assert.match(access, /Request access/);

  const accessLoading = renderToStaticMarkup(
    React.createElement(AccessState, {
      status: 'loading',
      title: 'Checking access',
    }),
  );
  assert.equal((accessLoading.match(/role="status"/g) ?? []).length, 1);

  const callout = renderToStaticMarkup(
    React.createElement(
      Callout,
      {
        title: 'Export ready',
        tone: 'success',
        action: { id: 'download', label: 'Download' },
        onAction() {},
      },
      'The file is available.',
    ),
  );
  assert.match(callout, /class="beras-callout"/);
  assert.match(callout, /role="note"/);
  assert.match(callout, /data-beras-tone="success"/);
});

test('state actions prefer semantic onRetry and never emit both callbacks', () => {
  const { resolveStateActionHandler } = loadTsModule(
    'src/components/feedback/states.tsx',
  );
  let retryCount = 0;
  const actionEvents = [];
  const onRetry = () => {
    retryCount += 1;
  };
  const onAction = (actionId, meta) => {
    actionEvents.push([actionId, meta.source]);
  };

  const retryHandler = resolveStateActionHandler(onRetry, onAction);
  retryHandler('load-members-again', { source: 'pointer' });
  assert.equal(retryCount, 1);
  assert.deepEqual(actionEvents, []);

  const actionHandler = resolveStateActionHandler(undefined, onAction);
  actionHandler('load-members-again', { source: 'keyboard' });
  assert.deepEqual(actionEvents, [['load-members-again', 'keyboard']]);
  assert.equal(resolveStateActionHandler(undefined, undefined), undefined);
});

test('feedback catalog routes retry and non-retry state actions to exclusive handlers', () => {
  const { resolveFeedbackStateHandlers } = loadTsModule(
    'src/catalog/cases/feedback.tsx',
  );
  const { resolveStateActionHandler } = loadTsModule(
    'src/components/feedback/states.tsx',
  );
  const { feedbackFixtures } = loadTsModule('src/fixtures/feedback.ts');
  let retryCount = 0;
  const actionEvents = [];
  const onRetry = () => {
    retryCount += 1;
  };
  const onAction = (actionId, meta) => {
    actionEvents.push([actionId, meta.source]);
  };

  const inviteFixture =
    feedbackFixtures['fixture:feedback/state-view/empty'];
  const inviteProps = resolveFeedbackStateHandlers(
    inviteFixture.id,
    onRetry,
    onAction,
  );
  const inviteHandler = resolveStateActionHandler(
    inviteProps.onRetry,
    inviteProps.onAction,
  );
  inviteHandler(inviteFixture.action.id, { source: 'pointer' });

  const retryFixture =
    feedbackFixtures['fixture:feedback/state-view/retry'];
  const retryProps = resolveFeedbackStateHandlers(
    retryFixture.id,
    onRetry,
    onAction,
  );
  const retryHandler = resolveStateActionHandler(
    retryProps.onRetry,
    retryProps.onAction,
  );
  retryHandler(retryFixture.action.id, { source: 'keyboard' });

  assert.equal(retryFixture.action.id, 'load-members-again');
  assert.deepEqual(actionEvents, [['invite-member', 'pointer']]);
  assert.equal(retryCount, 1);
  assert.equal(inviteProps.onRetry, undefined);
  assert.equal(retryProps.onAction, undefined);
});

test('feedback actions are omitted when their matching handler is absent', () => {
  const {
    AccessState,
    Callout,
    StateView,
    Toast,
    ToastViewport,
  } = loadTsModule('src/components/feedback/index.ts');
  const action = { id: 'continue', label: 'Continue' };
  const state = {
    status: 'empty',
    title: 'Nothing here',
    description: 'No action handler is attached.',
  };
  const toast = {
    id: 'no-handler',
    title: 'Saved',
    description: 'Display-only notification.',
    tone: 'success',
    action,
  };

  const markup = [
    renderToStaticMarkup(React.createElement(StateView, { state, action })),
    renderToStaticMarkup(
      React.createElement(Callout, { title: 'Display only', action }, 'No callback.'),
    ),
    renderToStaticMarkup(
      React.createElement(AccessState, {
        status: 'denied',
        title: 'Access denied',
        action,
      }),
    ),
    renderToStaticMarkup(React.createElement(Toast, { toast })),
    renderToStaticMarkup(React.createElement(ToastViewport, { toasts: [toast] })),
  ].join('\n');

  assert.doesNotMatch(markup, /<button\b/);
});

test('toast urgency and close controls follow the live-region policy', () => {
  const { Toast, ToastViewport } = loadTsModule('src/components/feedback/index.ts');
  const success = {
    id: 'export-success',
    title: 'Export complete',
    description: 'Report is ready.',
    tone: 'success',
  };
  const danger = {
    id: 'export-error',
    title: 'Export failed',
    description: 'Retry the export.',
    tone: 'danger',
    urgent: true,
    action: { id: 'retry-export', label: 'Retry', pending: true },
  };

  const successMarkup = renderToStaticMarkup(
    React.createElement(Toast, { toast: success, onAction() {} }),
  );
  assert.match(successMarkup, /class="beras-toast"/);
  assert.match(successMarkup, /role="status"/);
  assert.doesNotMatch(successMarkup, /role="alert"/);
  assert.match(successMarkup, /aria-label="Dismiss notification: Export complete"/);

  const dangerMarkup = renderToStaticMarkup(
    React.createElement(Toast, { toast: danger, onAction() {} }),
  );
  assert.match(dangerMarkup, /role="alert"/);
  assert.match(dangerMarkup, /data-beras-tone="danger"/);
  assert.match(dangerMarkup, /<button[^>]*disabled=""/);
  assert.match(dangerMarkup, /aria-label="Dismiss notification: Export failed"/);

  const viewport = renderToStaticMarkup(
    React.createElement(ToastViewport, {
      label: 'Export notifications',
      toasts: [success, danger],
      onAction() {},
    }),
  );
  assert.match(viewport, /class="beras-toast-viewport"/);
  assert.match(viewport, /aria-label="Export notifications"/);
  assert.equal((viewport.match(/role="status"/g) ?? []).length, 1);
  assert.equal((viewport.match(/role="alert"/g) ?? []).length, 1);
});

test('feedback catalog and fixtures expose every exact deterministic public case', async () => {
  const [caseSource, fixtureSource] = await Promise.all([
    read('src/catalog/cases/feedback.tsx'),
    read('src/fixtures/feedback.ts'),
  ]);
  const caseIds = [...fixtureSource.matchAll(/^\s*'((?:feedback\/)[^']+)',?\s*$/gm)].map(
    (match) => match[1],
  );
  const { FEEDBACK_CASE_IDS, feedbackFixtures } = loadTsModule(
    'src/fixtures/feedback.ts',
  );

  assert.deepEqual(caseIds, expectedCaseIds);
  assert.deepEqual(FEEDBACK_CASE_IDS, expectedCaseIds);
  assert.deepEqual(
    Object.keys(feedbackFixtures),
    expectedCaseIds.map((id) => `fixture:${id}`),
  );
  for (const id of expectedCaseIds) {
    const fixture = feedbackFixtures[`fixture:${id}`];
    assert.equal(fixture.id, id);
    assert.equal(fixture.variant, id.split('/')[2]);
  }
  const { feedbackCases } = loadTsModule('src/catalog/cases/feedback.tsx');
  const toastMarkup = renderToStaticMarkup(
    feedbackCases.find(({ id }) => id === 'feedback/toast/success').render(),
  );
  assert.equal(
    (toastMarkup.match(/role="(?:status|alert)"|aria-live="(?:polite|assertive)"/g) ?? [])
      .length,
    1,
  );
  assert.equal(new Set(caseIds).size, caseIds.length);
  assert.match(caseSource, /^'use client';/);
  assert.match(caseSource, /from '@krasnaya\/beras-ui(?:\/components)?'/);
  assert.match(caseSource, /import '@krasnaya\/beras-ui\/styles\.css'/);
  assert.match(caseSource, /export const feedbackCases:\s*readonly CatalogRuntimeCase\[\]/);
  assert.match(caseSource, /const toastCase =/);
  assert.match(
    caseSource,
    /\{toastCase \? \(\s*<p>Last event: \{lastEvent\}<\/p>\s*\) : \(\s*<output aria-live="polite">/,
  );
  assert.match(
    caseSource,
    /\{!visible \? <p role="status">Notification dismissed\.<\/p> : null\}/,
  );
  assert.doesNotMatch(caseSource, /from ['"](?:\.\.\/)+(?:components|layouts|internal)/);
  assert.doesNotMatch(
    `${caseSource}\n${fixtureSource}`,
    /\b(?:Math\.random|Date\.now|fetch|XMLHttpRequest|WebSocket|EventSource|localStorage|process\.env|apps\/tere-project)\b/,
  );
  assert.doesNotMatch(caseSource, /\bstyle\s*=|\bdangerouslySetInnerHTML\b/);
});

test('feedback implementation is deterministic, isolated, and outer-class only', async () => {
  const sources = await Promise.all([
    read('src/components/feedback/index.ts'),
    read('src/components/feedback/loading.tsx'),
    read('src/components/feedback/states.tsx'),
    read('src/components/feedback/toasts.tsx'),
  ]);
  const source = sources.join('\n');

  assert.doesNotMatch(
    source,
    /\b(?:Math\.random|Date\.now|setTimeout|setInterval|fetch|XMLHttpRequest|WebSocket|EventSource|localStorage|window\.location|process\.env|apps\/tere-project)\b/,
  );
  assert.doesNotMatch(source, /\bdangerouslySetInnerHTML\b|\bstyle\s*=/);
  assert.doesNotMatch(source, /(?:antd|recharts|lucide|framer-motion|three|radix|shadcn)/i);
  assert.doesNotMatch(source, /\b(?:style|styles|classNames|slotProps)\??:/);
  assert.match(source, /className=\{rootClass\('beras-spinner', className\)\}/);
  assert.match(source, /className=\{rootClass\('beras-toast', className\)\}/);
});
