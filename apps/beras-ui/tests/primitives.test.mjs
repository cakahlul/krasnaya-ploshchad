import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
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
  const localRequire = (specifier) =>
    specifier.startsWith('.')
      ? loadTsModule(resolveLocalModule(specifier, absolutePath).slice(appRoot.length))
      : require(specifier);

  Function('require', 'module', 'exports', output)(
    localRequire,
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
};

const primitiveNames = [
  'BrandMark',
  'Button',
  'IconButton',
  'Badge',
  'StatusBadge',
  'Tag',
  'Avatar',
  'Card',
  'MetricCard',
  'StatGrid',
  'ProgressMeter',
  'Divider',
  'CodeBlock',
  'SecretField',
];

const iconNames = [
  'GoogleIcon',
  'SearchIcon',
  'CloseIcon',
  'MenuIcon',
  'ChevronDownIcon',
  'ChevronLeftIcon',
  'ChevronRightIcon',
  'ArrowRightIcon',
  'CalendarIcon',
  'ClockIcon',
  'UserIcon',
  'UsersIcon',
  'UserAddIcon',
  'LogoutIcon',
  'LockIcon',
  'EyeIcon',
  'EyeOffIcon',
  'CopyIcon',
  'ExternalLinkIcon',
  'EditIcon',
  'DeleteIcon',
  'AddIcon',
  'RemoveIcon',
  'MinusCircleIcon',
  'ReloadIcon',
  'SyncIcon',
  'LoadingIcon',
  'DownloadIcon',
  'SpreadsheetIcon',
  'BugIcon',
  'CheckIcon',
  'CheckCircleIcon',
  'WarningIcon',
  'ErrorIcon',
  'InfoIcon',
  'DatabaseIcon',
  'CodeIcon',
  'JsonIcon',
  'LinkIcon',
  'TagIcon',
  'TrendUpIcon',
  'ChartIcon',
  'FilterIcon',
  'TeamIcon',
  'ExperimentIcon',
  'MoreIcon',
  'HomeIcon',
  'ReportIcon',
  'SettingsIcon',
  'HolidayIcon',
  'TreeIcon',
  'KeyIcon',
];

const slug = (name) =>
  name
    .replace(/([A-Za-z])([0-9])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

test('actions preserve normal native behavior and suppress only pending duplicates', () => {
  const {
    createActionLatch,
    handleActionActivation,
    interactionSource,
    releaseAction,
    syncActionLatch,
  } = loadTsModule('src/components/primitives/action-logic.ts');

  assert.equal(interactionSource({ isTrusted: false, detail: 1 }), 'programmatic');
  assert.equal(interactionSource({ isTrusted: true, detail: 0 }), 'keyboard');
  assert.equal(interactionSource({ isTrusted: true, detail: 1 }), 'pointer');

  const eventHarness = () => {
    let prevented = false;
    return {
      event: {
        detail: 1,
        isTrusted: true,
        preventDefault() {
          prevented = true;
        },
      },
      commitNativeDefault(counter) {
        if (!prevented) counter.count += 1;
      },
      wasPrevented() {
        return prevented;
      },
    };
  };

  const normalLatch = createActionLatch('save', false);
  const normalCallbacks = { count: 0 };
  const nativeSubmits = { count: 0 };
  for (let activation = 0; activation < 2; activation += 1) {
    const harness = eventHarness();
    assert.equal(
      handleActionActivation(
        normalLatch,
        'save',
        false,
        false,
        harness.event,
        () => {
          normalCallbacks.count += 1;
        },
      ),
      true,
    );
    harness.commitNativeDefault(nativeSubmits);
    releaseAction(normalLatch, 'save');
  }
  assert.deepEqual(
    { callbacks: normalCallbacks.count, nativeSubmits: nativeSubmits.count },
    { callbacks: 2, nativeSubmits: 2 },
  );

  const pendingLatch = createActionLatch('export', false);
  const pendingCallbacks = { count: 0 };
  const nativePendingSubmits = { count: 0 };
  const firstPending = eventHarness();
  assert.equal(
    handleActionActivation(
      pendingLatch,
      'export',
      false,
      false,
      firstPending.event,
      () => {
        pendingCallbacks.count += 1;
      },
    ),
    true,
  );
  firstPending.commitNativeDefault(nativePendingSubmits);
  syncActionLatch(pendingLatch, 'export', true);

  const duplicatePending = eventHarness();
  assert.equal(
    handleActionActivation(
      pendingLatch,
      'export',
      false,
      true,
      duplicatePending.event,
      () => {
        pendingCallbacks.count += 1;
      },
    ),
    false,
  );
  duplicatePending.commitNativeDefault(nativePendingSubmits);
  assert.equal(duplicatePending.wasPrevented(), true);

  syncActionLatch(pendingLatch, 'export', false);
  const afterClear = eventHarness();
  assert.equal(
    handleActionActivation(
      pendingLatch,
      'export',
      false,
      false,
      afterClear.event,
      () => {
        pendingCallbacks.count += 1;
      },
    ),
    true,
  );
  afterClear.commitNativeDefault(nativePendingSubmits);
  assert.deepEqual(
    { callbacks: pendingCallbacks.count, nativeSubmits: nativePendingSubmits.count },
    { callbacks: 2, nativeSubmits: 2 },
  );

  const resetLatch = createActionLatch('reset-draft', false);
  const nativeResets = { count: 0 };
  const firstReset = eventHarness();
  handleActionActivation(resetLatch, 'reset-draft', false, false, firstReset.event, () => {});
  firstReset.commitNativeDefault(nativeResets);
  const changedAction = eventHarness();
  handleActionActivation(resetLatch, 'reset-all', false, false, changedAction.event, () => {});
  changedAction.commitNativeDefault(nativeResets);
  const noHandler = eventHarness();
  handleActionActivation(resetLatch, 'native-reset', false, false, noHandler.event);
  noHandler.commitNativeDefault(nativeResets);
  assert.equal(nativeResets.count, 3);
});

test('primitive exports render native, semantic roots and outer-only className', () => {
  const primitives = loadTsModule('src/components/primitives/index.ts');
  assert.deepEqual(Object.keys(primitives).sort(), [...primitiveNames, ...iconNames].sort());

  const noop = () => {};
  const samples = {
    BrandMark: { compact: false, label: 'Beras' },
    Button: { actionId: 'save', children: 'Save', onAction: noop },
    IconButton: {
      actionId: 'search',
      icon: React.createElement(primitives.SearchIcon),
      label: 'Search',
      onAction: noop,
    },
    Badge: { children: 'New', tone: 'info' },
    StatusBadge: { children: 'Healthy', tone: 'success' },
    Tag: { children: 'Frontend', removable: true, onAction: noop },
    Avatar: { name: 'Nadia Putri', initials: 'NP' },
    Card: { title: 'Summary', children: 'Ready' },
    MetricCard: { label: 'Coverage', value: '82/82', description: 'Complete' },
    StatGrid: { items: [{ id: 'coverage', label: 'Coverage', value: '82/82' }] },
    ProgressMeter: { label: 'Migration progress', value: 82, max: 100 },
    Divider: { label: 'Details' },
    CodeBlock: { code: 'npm run beras:verify', language: 'shell' },
    SecretField: {
      label: 'API key',
      value: 'beras_demo_key',
      actions: [{ id: 'copy', label: 'Copy' }],
      onAction: noop,
    },
  };

  for (const name of primitiveNames) {
    const markup = renderToStaticMarkup(
      React.createElement(primitives[name], { ...samples[name], className: 'sentinel-class' }),
    );
    assert.match(markup, new RegExp(`class="[^"]*beras-${slug(name)}[^"]*sentinel-class[^"]*"`));
    assert.equal(markup.match(/sentinel-class/g)?.length, 1, `${name} className leaked`);
    assert.doesNotMatch(markup, /\sstyle=/);
  }

  assert.match(
    renderToStaticMarkup(
      React.createElement(primitives.Button, {
        actionId: 'export',
        pending: true,
      }, 'Exporting report'),
    ),
    /^<button[^>]*disabled=""[^>]*aria-busy="true"|^<button[^>]*aria-busy="true"[^>]*disabled=""/,
  );
  assert.match(
    renderToStaticMarkup(
      React.createElement(primitives.IconButton, {
        actionId: 'close',
        icon: React.createElement(primitives.CloseIcon),
        label: 'Close',
      }),
    ),
    /<button[^>]*aria-label="Close"/,
  );
  assert.match(
    renderToStaticMarkup(
      React.createElement(primitives.ProgressMeter, {
        label: 'Progress',
        value: 130,
        max: 100,
      }),
    ),
    /<progress[^>]*value="100"[^>]*max="100"/,
  );
  assert.match(
    renderToStaticMarkup(
      React.createElement(primitives.SecretField, {
        label: 'API key',
        value: 'secret',
      }),
    ),
    /<input[^>]*type="password"[^>]*readOnly=""/,
  );
});

test('all named icons are static SVG exports with decorative and informative modes', async () => {
  const primitives = loadTsModule('src/components/primitives/index.ts');
  const iconSource = await read('src/components/primitives/icons.tsx');

  assert.doesNotMatch(iconSource, /\b(?:makeIcon|iconRegistry|iconMap)\b/);
  for (const name of iconNames) {
    assert.match(iconSource, new RegExp(`export function ${name}\\(`));
    const decorative = renderToStaticMarkup(
      React.createElement(primitives[name], { className: 'sentinel-class' }),
    );
    const informative = renderToStaticMarkup(
      React.createElement(primitives[name], {
        className: 'sentinel-class',
        label: `${name} label`,
        size: 28,
      }),
    );

    assert.match(decorative, /^<svg\b/);
    assert.match(decorative, /aria-hidden="true"/);
    assert.doesNotMatch(decorative, /<title>/);
    assert.equal(decorative.match(/sentinel-class/g)?.length, 1);
    assert.match(informative, /role="img"/);
    assert.match(informative, new RegExp(`aria-label="${name} label"`));
    assert.match(informative, new RegExp(`<title>${name} label</title>`));
    assert.match(informative, /width="28"/);
    assert.match(informative, /stroke="currentColor"/);
    assert.doesNotMatch(informative, /\sstyle=/);
  }
});

test('primitive cases and fixtures cover the frozen deterministic ID matrix', async () => {
  const customIds = [
    'primitive/brand-mark/default',
    'primitive/brand-mark/compact',
    'primitive/oauth-button/default',
    'primitive/oauth-button/focus',
    'primitive/oauth-button/disabled',
    'primitive/oauth-button/pending',
    'primitive/export-button/disabled',
    'primitive/export-button/default',
    'primitive/export-button/pending',
    'primitive/export-button/success',
    'primitive/export-button/failure',
    'primitive/export-button/reduced-motion',
    'primitive/status-badge/neutral',
    'primitive/status-badge/info',
    'primitive/status-badge/success',
    'primitive/status-badge/warning',
    'primitive/status-badge/danger',
    'primitive/status-badge/long-label',
  ];
  const remainingPrimitiveIds = [
    'primitive/icon-button/default',
    'primitive/badge/default',
    'primitive/tag/default',
    'primitive/avatar/default',
    'primitive/card/default',
    'primitive/metric-card/default',
    'primitive/stat-grid/default',
    'primitive/progress-meter/default',
    'primitive/divider/default',
    'primitive/code-block/default',
    'primitive/code-block/long-content',
    'primitive/secret-field/default',
  ];
  const iconIds = iconNames.map((name) => `primitive/${slug(name)}/default`);
  const expectedIds = [...customIds, ...remainingPrimitiveIds, ...iconIds];
  const [caseSource, fixtureSource] = await Promise.all([
    read('src/catalog/cases/primitives.tsx'),
    read('src/fixtures/primitives.ts'),
  ]);
  const caseIds = [...caseSource.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);
  const fixtureIds = [...fixtureSource.matchAll(/^\s*'(fixture:[^']+)':\s*\{/gm)].map(
    (match) => match[1],
  );

  assert.deepEqual(caseIds, expectedIds);
  assert.deepEqual(fixtureIds, expectedIds.map((id) => `fixture:${id}`));
  assert.equal(new Set(caseIds).size, caseIds.length);
  assert.equal(new Set(fixtureIds).size, fixtureIds.length);
  assert.match(caseSource, /^'use client';/);
  assert.match(caseSource, /from '@krasnaya\/beras-ui\/components'/);
  assert.match(caseSource, /import '@krasnaya\/beras-ui\/styles\.css'/);
  assert.match(caseSource, /export const primitiveCases: readonly CatalogRuntimeCase\[\]/);
  assert.match(caseSource, /function IconButtonPreview\(/);
  assert.match(caseSource, /function RemovableTagPreview\(/);
  assert.match(caseSource, /function SecretFieldPreview\(/);
  assert.match(caseSource, /revealed \? 'Conceal' : 'Reveal'/);
  assert.match(caseSource, /<output aria-live="polite">/);
  assert.match(caseSource, /<IconButton[\s\S]*?onAction=\{onAction\}/);
  assert.match(caseSource, /<Tag[\s\S]*?onAction=\{onAction\}/);
  assert.match(caseSource, /<SecretField[\s\S]*?onAction=\{onAction\}/);
  assert.doesNotMatch(caseSource, /from ['"][^'"]*components\/primitives/);
  assert.doesNotMatch(fixtureSource, /\b(?:map|Object\.fromEntries|Math\.random|Date\.now)\b/);
  assert.doesNotMatch(
    `${caseSource}\n${fixtureSource}`,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|localStorage|process\.env|apps\/tere-project)\b/,
  );
  assert.doesNotMatch(caseSource, /\bstyle\s*=|\bdangerouslySetInnerHTML\b/);

  const { primitiveFixtures } = loadTsModule('src/fixtures/primitives.ts');
  const longCode = primitiveFixtures['fixture:primitive/code-block/long-content'].code;
  assert.ok(longCode.length > 160);
  assert.doesNotMatch(longCode, /\s/);
});
