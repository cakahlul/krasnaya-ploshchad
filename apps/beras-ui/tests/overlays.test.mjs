import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const appRootUrl = new URL('../', import.meta.url);
const appRoot = fileURLToPath(appRootUrl);
const read = (path) => readFile(new URL(path, appRootUrl), 'utf8');
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

const overlayExports = [
  'Dialog',
  'ConfirmDialog',
  'LegalContentDialog',
  'Drawer',
  'Popover',
  'MemberTasksDialog',
  'MemberFormDialog',
  'LeaveFormDialog',
  'HolidayFormDialog',
  'ConfigFormDialog',
  'TicketDetailDialog',
  'ApiKeyTable',
  'JsonImportPanel',
];

const requiredCases = {
  'legal-dialog': ['terms', 'privacy', 'overflow', 'narrow'],
  'member-tasks': ['loading', 'empty', 'error', 'populated', 'expanded', 'long-content'],
  'member-form': ['create', 'edit', 'validation', 'lead', 'pending', 'error', 'narrow'],
  'leave-form': [
    'create',
    'edit',
    'read-only',
    'validation',
    'multiple-ranges',
    'confirm',
    'pending',
    'error',
    'narrow',
  ],
  'holiday-form': [
    'create',
    'edit',
    'validation',
    'existing',
    'confirm',
    'pending',
    'error',
    'narrow',
  ],
  dialog: ['default', 'overflow', 'narrow'],
  'confirm-dialog': ['default', 'pending'],
  drawer: ['closed', 'open', 'narrow'],
  popover: ['closed', 'open', 'long-content'],
  'config-form': ['default', 'validation', 'pending'],
  'ticket-detail': ['default', 'long-content'],
  'api-key-table': ['loading', 'empty', 'error', 'populated'],
  'json-import': ['default', 'validation', 'pending'],
};

const expectedOverlayIds = Object.entries(requiredCases).flatMap(([slug, variants]) =>
  variants.map((variant) => `overlay/${slug}/${variant}`),
);
const expectedFormJsonIds = ['empty', 'validation', 'ready', 'pending', 'success', 'failure'].map(
  (variant) => `form/json-import/${variant}`,
);
const expectedIds = [...expectedOverlayIds, ...expectedFormJsonIds];

test('native modal logic synchronizes state and restores a valid invoker', () => {
  const {
    canActivateAction,
    closeDialogAndRestore,
    focusInitialControl,
    interactionSource,
    pointerInteractionSource,
    restoreFocus,
    shouldHandlePopoverEscape,
    shouldCloseBackdrop,
    shouldRestorePopoverFocus,
    syncDialogState,
  } = loadTsModule('src/components/overlays/logic.ts');

  const calls = [];
  const firstControl = { focus: () => calls.push('first'), isConnected: true };
  const explicitControl = { focus: () => calls.push('explicit'), isConnected: true };
  const invoker = { focus: () => calls.push('invoker'), isConnected: true };
  const dialog = {
    open: false,
    contains: (element) => element === explicitControl,
    querySelector: () => firstControl,
    showModal() {
      this.open = true;
      calls.push('show');
    },
    close() {
      this.open = false;
      calls.push('close');
    },
  };

  syncDialogState(dialog, true);
  syncDialogState(dialog, true);
  focusInitialControl(dialog, explicitControl);
  syncDialogState(dialog, false);
  restoreFocus(invoker);

  assert.deepEqual(calls, ['show', 'explicit', 'close', 'invoker']);
  assert.equal(interactionSource({ detail: 0, isTrusted: true }), 'keyboard');
  assert.equal(interactionSource({ detail: 1, isTrusted: true }), 'pointer');
  assert.equal(interactionSource({ detail: 1, isTrusted: false }), 'programmatic');
  assert.equal(pointerInteractionSource({ detail: 0, isTrusted: true }), 'pointer');
  assert.equal(pointerInteractionSource({ detail: 0, isTrusted: false }), 'programmatic');

  const rect = { left: 100, right: 500, top: 80, bottom: 420 };
  assert.equal(
    shouldCloseBackdrop({ clientX: 120, clientY: 100 }, rect, true),
    false,
  );
  assert.equal(
    shouldCloseBackdrop({ clientX: 50, clientY: 100 }, rect, true),
    true,
  );
  assert.equal(
    shouldCloseBackdrop({ clientX: 50, clientY: 100 }, rect, false),
    false,
  );

  dialog.open = true;
  closeDialogAndRestore(dialog, invoker);
  assert.deepEqual(calls.slice(-2), ['close', 'invoker']);

  assert.equal(shouldHandlePopoverEscape('Escape', true, false), true);
  assert.equal(shouldHandlePopoverEscape('Escape', false, true), true);
  assert.equal(shouldHandlePopoverEscape('Escape', false, false), false);
  assert.equal(shouldHandlePopoverEscape('Enter', true, true), false);
  assert.equal(shouldRestorePopoverFocus('escape', 'keyboard'), true);
  assert.equal(shouldRestorePopoverFocus('action', 'pointer'), true);
  assert.equal(shouldRestorePopoverFocus('escape', 'programmatic'), false);
  assert.equal(shouldRestorePopoverFocus('outside', 'pointer'), false);
  assert.equal(shouldRestorePopoverFocus('programmatic', 'programmatic'), false);
  assert.equal(shouldRestorePopoverFocus(undefined, undefined), false);
  assert.equal(canActivateAction({ id: 'save', label: 'Save' }), true);
  assert.equal(canActivateAction({ id: 'save', label: 'Save', disabled: true }), false);
  assert.equal(canActivateAction({ id: 'save', label: 'Save', pending: true }), false);
});

test('dialog markup is labelled, safe, controlled, and keeps pending actions inert', () => {
  const {
    ConfirmDialog,
    Dialog,
    Drawer,
    LegalContentDialog,
    Popover,
  } = loadTsModule('src/components/overlays/index.ts');
  const onOpenChange = () => {};
  const onAction = () => {};

  const dialogMarkup = renderToStaticMarkup(
    React.createElement(Dialog, {
      open: false,
      title: 'Account details',
      description: 'Review before continuing',
      onOpenChange,
      className: 'consumer-placement',
    }, React.createElement('button', null, 'First control')),
  );
  assert.match(dialogMarkup, /^<dialog[^>]*class="beras-dialog consumer-placement"/);
  assert.match(dialogMarkup, /aria-labelledby=/);
  assert.match(dialogMarkup, /aria-describedby=/);
  assert.match(dialogMarkup, /class="beras-dialog__body"/);
  assert.match(dialogMarkup, /class="beras-dialog__footer"/);
  assert.equal((dialogMarkup.match(/consumer-placement/g) ?? []).length, 1);
  assert.doesNotMatch(dialogMarkup, /tabindex="[1-9]/);

  const confirmMarkup = renderToStaticMarkup(
    React.createElement(ConfirmDialog, {
      open: false,
      title: 'Remove member?',
      message: 'This action cannot be undone.',
      confirmAction: { id: 'confirm', label: 'Remove', pending: true },
      cancelAction: { id: 'cancel', label: 'Cancel' },
      onOpenChange,
      onAction,
    }),
  );
  assert.match(confirmMarkup, /class="beras-confirm-dialog beras-dialog"/);
  assert.match(confirmMarkup, /aria-busy="true"/);
  assert.match(confirmMarkup, /disabled=""/);

  const legalMarkup = renderToStaticMarkup(
    React.createElement(LegalContentDialog, {
      open: false,
      title: 'Terms',
      document: 'terms',
      content: '<img src=x onerror=alert(1)>',
      onOpenChange,
    }),
  );
  assert.match(legalMarkup, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(legalMarkup, /<img/);

  const popoverMarkup = renderToStaticMarkup(
    React.createElement(
      Popover,
      {
        open: true,
        label: 'Details',
        trigger: 'Toggle details',
        onOpenChange,
      },
      React.createElement('p', null, 'Block content'),
    ),
  );
  assert.match(popoverMarkup, /^<div[^>]*class="beras-popover"/);
  assert.match(popoverMarkup, /<button[^>]*class="beras-popover__trigger"/);
  assert.match(popoverMarkup, /<div[^>]*class="beras-popover__panel"/);
  assert.match(popoverMarkup, /<div[^>]*class="beras-popover__panel"[^>]*><p>Block content<\/p><\/div>/);

  const drawerMarkup = renderToStaticMarkup(
    React.createElement(
      Drawer,
      {
        open: false,
        title: 'Navigation',
        placement: 'end',
        onOpenChange,
      },
      React.createElement('p', null, 'Drawer content'),
    ),
  );
  assert.match(drawerMarkup, /^<dialog[^>]*class="beras-drawer beras-dialog"/);
  assert.match(drawerMarkup, /data-beras-variant="end"/);
});

test('overlay implementation uses native modal mechanics and explicit close policies', async () => {
  const [modalSource, logicSource, popoverSource, actionSource] = await Promise.all([
    read('src/components/overlays/modal.tsx'),
    read('src/components/overlays/logic.ts'),
    read('src/components/overlays/non-modal.tsx'),
    read('src/components/overlays/actions.tsx'),
  ]);
  const modalMechanics = `${modalSource}\n${logicSource}`;

  assert.match(modalSource, /<dialog/);
  assert.match(modalMechanics, /showModal/);
  assert.match(modalMechanics, /\.close\(/);
  assert.match(modalSource, /onCancel=/);
  assert.match(modalSource, /preventDefault\(\)/);
  assert.match(modalSource, /shouldCloseBackdrop/);
  assert.match(modalSource, /initialFocusRef/);
  assert.match(modalMechanics, /restoreFocus/);
  assert.match(modalSource, /closeDialogAndRestore/);
  assert.match(modalSource, /return \(\) =>/);
  assert.doesNotMatch(modalSource, /tabIndex=\{?[1-9]/);

  assert.match(popoverSource, /pointerdown/);
  assert.match(popoverSource, /Escape/);
  assert.match(popoverSource, /reason: 'outside'/);
  assert.match(popoverSource, /aria-expanded=/);
  assert.match(popoverSource, /shouldHandlePopoverEscape/);
  assert.match(popoverSource, /shouldRestorePopoverFocus/);
  assert.doesNotMatch(popoverSource, /tabIndex=\{?[1-9]/);

  assert.match(actionSource, /disabled=\{action\.disabled \|\| action\.pending\}/);
  assert.match(actionSource, /aria-busy=\{action\.pending/);
  assert.match(actionSource, /role="group"/);
});

test('specialized overlays render controlled fixture states without business coupling', () => {
  const {
    ApiKeyTable,
    JsonImportPanel,
    MemberTasksDialog,
    TicketDetailDialog,
  } = loadTsModule('src/components/overlays/index.ts');
  const noop = () => {};

  const tasksMarkup = renderToStaticMarkup(
    React.createElement(MemberTasksDialog, {
      open: false,
      title: 'Member tasks',
      state: {
        status: 'ready',
        data: [{ id: 'task-1', label: 'BERAS-107', description: 'Overlay contract' }],
      },
      actions: [{ id: 'open-task', label: 'Open task' }],
      onOpenChange: noop,
      onAction: noop,
    }),
  );
  assert.match(tasksMarkup, /BERAS-107/);
  assert.match(tasksMarkup, /Overlay contract/);

  const expandedTasksMarkup = renderToStaticMarkup(
    React.createElement(MemberTasksDialog, {
      open: false,
      title: 'Member tasks',
      state: {
        status: 'ready',
        data: [{ id: 'task-1', label: 'BERAS-107', value: 'expanded', description: 'Details' }],
      },
      onOpenChange: noop,
    }),
  );
  assert.match(expandedTasksMarkup, /<details open=""/);

  const ticketMarkup = renderToStaticMarkup(
    React.createElement(TicketDetailDialog, {
      open: false,
      title: 'Ticket detail',
      item: { id: 'BERAS-107', label: 'Accessible overlays' },
      content: '<script>alert(1)</script>',
      onOpenChange: noop,
    }),
  );
  assert.match(ticketMarkup, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(ticketMarkup, /<script>/);

  const tableMarkup = renderToStaticMarkup(
    React.createElement(ApiKeyTable, {
      state: {
        status: 'ready',
        data: [{ id: 'key-1', label: 'Local development', value: '•••• 8H2K' }],
      },
      actions: [{ id: 'revoke:key-1', label: 'Revoke' }],
      onAction: noop,
    }),
  );
  assert.match(tableMarkup, /<table/);
  assert.match(tableMarkup, /class="beras-api-key-table__overflow"/);
  assert.match(tableMarkup, /class="beras-api-key-table__table"/);
  assert.match(tableMarkup, /Local development/);
  assert.match(tableMarkup, /•••• 8H2K/);

  const importMarkup = renderToStaticMarkup(
    React.createElement(JsonImportPanel, {
      label: 'Holiday JSON',
      value: '[{&quot;date&quot;:&quot;2026-08-17&quot;}]',
      error: 'Expected an array of holiday records.',
      actions: [{ id: 'validate', label: 'Validate' }],
      onValueChange: noop,
      onAction: noop,
    }),
  );
  assert.match(importMarkup, /<textarea/);
  assert.match(importMarkup, /class="beras-json-import-panel__input"/);
  assert.match(importMarkup, /aria-invalid="true"/);
  assert.match(importMarkup, /role="alert"/);
  assert.match(importMarkup, /role="group"/);
});

test('overlay fixtures and runtime cases cover the exact deterministic matrix', async () => {
  const fixtures = loadTsModule('src/fixtures/overlays.ts');
  const caseSource = await read('src/catalog/cases/overlays.tsx');

  assert.deepEqual([...fixtures.OVERLAY_CASE_IDS].sort(), [...expectedIds].sort());
  assert.equal(new Set(fixtures.OVERLAY_CASE_IDS).size, expectedIds.length);
  for (const id of expectedIds) {
    const fixtureId = `fixture:${id}`;
    assert.equal(fixtures.overlayFixtures[fixtureId].id, id);
    assert.equal(fixtures.overlayFixtures[fixtureId].variant, id.split('/')[2]);
    assert.match(fixtureId, /^fixture:[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/);
  }
  assert.match(caseSource, /OVERLAY_CASE_IDS\.map/);
  assert.match(caseSource, /export const overlayCases: readonly CatalogRuntimeCase\[\]/);
  assert.match(caseSource, /from '@krasnaya\/beras-ui(?:\/components)?'/);
  assert.doesNotMatch(caseSource, /from ['"][.]{1,2}\/.*components/);
});

test('JSON import ready, success, validation, and failure fixtures render distinctly', () => {
  const { JsonImportPanel } = loadTsModule('src/components/overlays/index.ts');
  const { overlayFixtures } = loadTsModule('src/fixtures/overlays.ts');
  const noop = () => {};
  const renderState = (caseId) => {
    const fixture = overlayFixtures[`fixture:${caseId}`];
    return renderToStaticMarkup(
      React.createElement(JsonImportPanel, {
        label: fixture.title,
        value: fixture.jsonValue,
        helperText: fixture.helperText,
        error: fixture.error,
        actions: fixture.actions,
        onValueChange: noop,
        onAction: noop,
      }),
    );
  };

  const ready = renderState('form/json-import/ready');
  const success = renderState('form/json-import/success');
  const validation = renderState('form/json-import/validation');
  const failure = renderState('form/json-import/failure');

  assert.match(ready, /Ready:/);
  assert.doesNotMatch(ready, /Success:/);
  assert.match(success, /Success:/);
  assert.match(validation, /JSON syntax/);
  assert.match(failure, /Consumer rejected/);
  assert.notEqual(validation, failure);
});

test('public surface is complete and owned source has no forbidden runtime coupling', async () => {
  const overlayFileNames = (await readdir(new URL('src/components/overlays/', appRootUrl)))
    .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'));
  const [barrel, ...ownedSources] = await Promise.all([
    read('src/public/components.ts'),
    ...overlayFileNames.map((name) => read(`src/components/overlays/${name}`)),
    read('src/fixtures/overlays.ts'),
    read('src/catalog/cases/overlays.tsx'),
  ]);
  for (const name of overlayExports) {
    assert.match(barrel, new RegExp(`\\b${name}\\b`));
    assert.equal(typeof loadTsModule('src/components/overlays/index.ts')[name], 'function');
  }
  assert.equal(ownedSources.length, overlayFileNames.length + 2);
  for (const source of ownedSources) {
    assert.doesNotMatch(source, /ContractStub|contractPlaceholder|requires BU-P1-07/);
    assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
    assert.doesNotMatch(
      source,
      /\b(fetch|axios|XMLHttpRequest|clipboard|localStorage|sessionStorage|process\.env|window\.)\b/,
    );
    assert.doesNotMatch(
      source,
      /@ant-design|antd|recharts|lucide|framer-motion|three|@radix|shadcn/,
    );
    assert.doesNotMatch(source, /next\/navigation|router\.(push|replace)|location\.(assign|replace)/);
    assert.doesNotMatch(source, /apps\/tere-project/);
  }
});
