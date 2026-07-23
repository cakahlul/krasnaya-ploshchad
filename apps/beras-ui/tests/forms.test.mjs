import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const appRoot = new URL('../', import.meta.url);
const appRootPath = fileURLToPath(appRoot);
const read = (path) => readFile(new URL(path, appRoot), 'utf8');
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
  const absolutePath = resolve(appRootPath, relativePath);
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
      ? loadTsModule(resolveLocalModule(specifier, absolutePath).slice(appRootPath.length))
      : require(specifier);

  Function('require', 'module', 'exports', output)(
    localRequire,
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
};

const mappedCases = {
  combobox: ['empty', 'populated', 'search', 'selection', 'clear', 'disabled', 'long-options'],
  'sprint-combobox': ['empty', 'populated', 'search', 'selection', 'disabled', 'long-options'],
  'sprint-multiselect': [
    'empty',
    'populated',
    'search',
    'partial',
    'all',
    'draft',
    'disabled',
    'long-options',
  ],
  'team-multiselect': [
    'empty',
    'populated',
    'search',
    'partial',
    'all',
    'draft',
    'disabled',
    'long-options',
  ],
  'epic-multiselect': [
    'loading',
    'empty',
    'error',
    'populated',
    'search',
    'partial',
    'draft',
    'long-options',
  ],
  'team-select': ['empty', 'populated', 'selection', 'disabled', 'long-options'],
  'project-combobox': ['loading', 'empty', 'error', 'populated', 'search', 'selection'],
  'epic-search': ['idle', 'loading', 'empty', 'error', 'populated', 'long-options'],
  'global-search': [
    'idle',
    'loading',
    'empty',
    'error',
    'populated',
    'detail-open',
    'long-content',
  ],
  'date-range-field': [
    'empty',
    'populated',
    'preset',
    'custom',
    'validation',
    'disabled',
    'narrow',
  ],
  'month-field': ['empty', 'populated', 'disabled', 'validation'],
  'report-filter-bar': ['default', 'partial', 'complete', 'disabled', 'narrow', 'overflow'],
  'tree-controls': ['default', 'populated', 'disabled', 'narrow'],
  'json-import': ['empty', 'validation', 'ready', 'pending', 'success', 'failure'],
  'segmented-control': ['default', 'selection', 'disabled'],
  'text-field': ['default', 'error', 'disabled'],
  'text-area-field': ['default', 'error', 'disabled'],
  'switch-field': ['default', 'disabled'],
  'checkbox-field': ['default', 'disabled'],
  'date-field': ['default', 'validation', 'disabled'],
  'field-group': ['default'],
};

const expectedIds = Object.entries(mappedCases).flatMap(([slug, variants]) =>
  variants.map((variant) => `form/${slug}/${variant}`),
);

async function loadLogic() {
  const source = await read('src/components/forms/logic.ts');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}

test('form logic filters labels/descriptions and moves only through enabled options', async () => {
  const { filterOptions, moveActiveOption } = await loadLogic();
  const options = [
    { value: 'alpha', label: 'Alpha team', description: 'Platform' },
    { value: 'blocked', label: 'Blocked team', disabled: true },
    { value: 'gamma', label: 'Gamma team', description: 'Payments' },
  ];

  assert.deepEqual(
    filterOptions(options, 'PAY').map((option) => option.value),
    ['gamma'],
  );
  assert.equal(moveActiveOption(options, undefined, 'next'), 'alpha');
  assert.equal(moveActiveOption(options, 'alpha', 'next'), 'gamma');
  assert.equal(moveActiveOption(options, 'gamma', 'next'), 'gamma');
  assert.equal(moveActiveOption(options, 'gamma', 'previous'), 'alpha');
  assert.equal(moveActiveOption(options, 'gamma', 'first'), 'alpha');
  assert.equal(moveActiveOption(options, 'alpha', 'last'), 'gamma');
});

test('form logic toggles explicit selections without mutating the controlled value', async () => {
  const {
    commitStagedSelection,
    movementForKey,
    selectionTransition,
    sourceFromClickDetail,
    toggleSelection,
  } = await loadLogic();
  const original = Object.freeze(['alpha']);

  assert.deepEqual(toggleSelection(original, 'beta'), ['alpha', 'beta']);
  assert.deepEqual(toggleSelection(['alpha', 'beta'], 'alpha'), ['beta']);
  assert.deepEqual(original, ['alpha']);
  assert.deepEqual(selectionTransition(['alpha', 'beta'], true), {
    draft: ['alpha', 'beta'],
  });
  assert.deepEqual(selectionTransition(['alpha', 'beta'], false), {
    draft: null,
    commit: ['alpha', 'beta'],
  });
  assert.deepEqual(commitStagedSelection(original, ['beta']), ['beta']);
  assert.deepEqual(commitStagedSelection(original, null), ['alpha']);
  assert.equal(movementForKey('ArrowDown'), 'next');
  assert.equal(movementForKey('ArrowUp'), 'previous');
  assert.equal(movementForKey('Home'), 'first');
  assert.equal(movementForKey('End'), 'last');
  assert.equal(movementForKey('ArrowRight'), undefined);
  assert.equal(sourceFromClickDetail(0), 'keyboard');
  assert.equal(sourceFromClickDetail(1), 'pointer');
});

test('controlled selection sessions reset on external close and reopen from latest props', async () => {
  const {
    multiSelectionSessionTransition,
    singleSelectionSessionTransition,
  } = await loadLogic();
  const options = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
  ];

  assert.deepEqual(
    singleSelectionSessionTransition(
      { open: true, query: 'local text', value: 'alpha' },
      { open: false, query: 'server query', value: 'beta' },
      options,
    ),
    { search: 'server query', active: undefined },
  );
  assert.deepEqual(
    singleSelectionSessionTransition(
      { open: false, query: 'old', value: 'alpha' },
      { open: true, query: '', value: 'beta' },
      options,
    ),
    { search: '', active: 'beta' },
  );
  assert.deepEqual(
    singleSelectionSessionTransition(
      { open: true, query: '', value: 'alpha' },
      { open: true, query: 'bet', value: 'alpha' },
      options,
    ),
    { search: 'bet', active: 'beta' },
  );

  assert.deepEqual(
    multiSelectionSessionTransition(
      { open: true, query: 'local text', value: ['alpha'] },
      { open: false, query: 'server query', value: ['beta'] },
      options,
      true,
    ),
    { search: 'server query', active: undefined, draft: null },
  );
  assert.deepEqual(
    multiSelectionSessionTransition(
      { open: false, query: 'old', value: ['alpha'] },
      { open: true, query: '', value: ['beta'] },
      options,
      true,
    ),
    { search: '', active: 'alpha', draft: ['beta'] },
  );
  assert.deepEqual(
    multiSelectionSessionTransition(
      { open: true, query: '', value: ['alpha'] },
      { open: true, query: 'bet', value: ['alpha'] },
      options,
      true,
    ),
    { search: 'bet', active: 'beta', draft: ['alpha'] },
  );
});

test('disabled and read-only form actions never invoke their callback', async () => {
  const { formActionDisabled, runFormAction } = await loadLogic();
  let calls = 0;
  const callback = () => {
    calls += 1;
  };

  for (const state of [
    { disabled: true },
    { readOnly: true },
    { actionDisabled: true },
    { pending: true },
  ]) {
    assert.equal(formActionDisabled(state), true);
    assert.equal(runFormAction(state, callback), false);
  }
  assert.equal(calls, 0);
  assert.equal(runFormAction({}, callback), true);
  assert.equal(calls, 1);
});

test('ISO and range validation is deterministic at calendar and boundary edges', async () => {
  const { validateIsoDate, validateIsoMonth, validateDateRange } = await loadLogic();

  assert.equal(validateIsoDate('2024-02-29'), undefined);
  assert.match(validateIsoDate('2023-02-29'), /valid/i);
  assert.match(validateIsoDate('29-02-2024'), /YYYY-MM-DD/);
  assert.match(validateIsoDate('2026-06-30', '2026-07-01'), /on or after 2026-07-01/);
  assert.match(validateIsoDate('2026-08-01', undefined, '2026-07-31'), /on or before 2026-07-31/);
  assert.equal(validateIsoMonth('2026-07'), undefined);
  assert.match(validateIsoMonth('2026-13'), /valid/i);
  assert.equal(validateDateRange({ start: '', end: '' }), undefined);
  assert.match(
    validateDateRange({ start: '2026-07-31', end: '2026-07-01' }),
    /not be after/i,
  );
});

test('date display formatting uses Intl with fixed ISO input instead of the current clock', async () => {
  const { formatIsoDate, formatIsoMonth } = await loadLogic();

  assert.equal(formatIsoDate('2026-07-23', 'en-US'), 'Jul 23, 2026');
  assert.equal(formatIsoMonth('2026-07', 'en-US'), 'July 2026');
  assert.equal(formatIsoDate('', 'en-US'), '');
});

test('component source replaces the scaffold and wires native controlled accessibility', async () => {
  const [indexSource, fieldsSource, selectionSource, dateSource, groupsSource] =
    await Promise.all([
    read('src/components/forms/index.ts'),
    read('src/components/forms/fields.tsx'),
    read('src/components/forms/selection.tsx'),
    read('src/components/forms/date.tsx'),
    read('src/components/forms/groups.tsx'),
  ]);
  const componentSource = [fieldsSource, selectionSource, dateSource, groupsSource].join('\n');
  const source = `${indexSource}\n${componentSource}`;

  assert.doesNotMatch(source, /\bstub\b|ContractStub|requires BU-P1-06|contractPlaceholder/);
  assert.match(componentSource, /'use client'/);
  for (const type of ['date', 'month']) assert.match(source, new RegExp(`type="${type}"`));
  assert.match(source, /<select/);
  for (const token of [
    'role="combobox"',
    'role="listbox"',
    'role="option"',
    'aria-expanded',
    'aria-controls',
    'aria-activedescendant',
    'aria-multiselectable',
    'aria-describedby',
    'aria-invalid',
  ]) {
    assert.match(source, new RegExp(token));
  }
  assert.match(selectionSource, /movementForKey/);
  for (const key of ['Enter', 'Escape']) {
    assert.match(selectionSource, new RegExp(`'${key}'`));
  }
  assert.doesNotMatch(groupsSource, /ArrowDown|ArrowUp|ArrowLeft|ArrowRight|Home|End/);
  for (const rootClass of [
    'text-field',
    'text-area-field',
    'switch-field',
    'checkbox-field',
    'select-field',
    'combobox',
    'search-combobox',
    'multi-select',
    'date-field',
    'month-field',
    'date-range-field',
    'field-group',
    'filter-bar',
    'segmented-control',
  ]) {
    assert.match(source, new RegExp(`beras-${rootClass}`));
  }
  assert.doesNotMatch(source, /tabIndex=\{?[1-9]/);
  assert.doesNotMatch(source, /\b(?:dayjs|moment|date-fns|@radix|antd)\b/i);
});

test('segmented control renders one native controlled radio group and forwards changes', async () => {
  const { SegmentedControl } = loadTsModule('src/components/forms/groups.tsx');
  const source = await read('src/components/forms/groups.tsx');
  const markup = renderToStaticMarkup(
    React.createElement(SegmentedControl, {
      label: 'View',
      value: 'board',
      options: [
        { value: 'board', label: 'Board' },
        { value: 'table', label: 'Table', disabled: true },
        { value: 'timeline', label: 'Timeline' },
      ],
      onValueChange() {},
    }),
  );
  const radios = [...markup.matchAll(/<input\b[^>]*type="radio"[^>]*>/g)].map(
    (match) => match[0],
  );
  const names = radios.map((radio) => radio.match(/\bname="([^"]+)"/)?.[1]);

  assert.equal(radios.length, 3);
  assert.equal(new Set(names).size, 1);
  assert.match(radios[0], /\bchecked=""/);
  assert.match(radios[1], /\bdisabled=""/);
  assert.match(source, /checked=\{option\.value === value\}/);
  assert.match(source, /onValueChange\(option\.value, interaction\.meta\(\)\)/);
});

test('controlled selection props are wired to local session synchronization', async () => {
  const source = await read('src/components/forms/selection.tsx');

  assert.match(source, /singleSelectionSessionTransition/);
  assert.match(source, /multiSelectionSessionTransition/);
  assert.match(source, /useEffect/);
  assert.match(source, /previousSingleControls/);
  assert.match(source, /previousMultiControls/);
});

test('comboboxes submit committed selections instead of editable search text', () => {
  const { Combobox, MultiSelect } = loadTsModule('src/components/forms/selection.tsx');
  const options = {
    status: 'ready',
    data: [
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta' },
    ],
  };
  const common = {
    label: 'Team',
    options,
    open: true,
    required: true,
    onOpenChange() {},
    onValueChange() {},
  };
  const selectedMarkup = renderToStaticMarkup(
    React.createElement(Combobox, {
      ...common,
      name: 'team',
      value: 'alpha',
      query: '',
    }),
  );
  const selectedInputs = [...selectedMarkup.matchAll(/<input\b[^>]*>/g)].map(
    (match) => match[0],
  );
  const selectedSearch = selectedInputs.find((input) => /\btype="search"/.test(input));
  const selectedHidden = selectedInputs.find((input) => /\btype="hidden"/.test(input));

  assert.ok(selectedSearch);
  assert.ok(selectedHidden);
  assert.doesNotMatch(selectedSearch, /\bname=/);
  assert.match(selectedSearch, /\bvalue=""/);
  assert.match(selectedSearch, /\baria-required="true"/);
  assert.doesNotMatch(selectedSearch, /\baria-invalid="true"/);
  assert.match(selectedHidden, /\bname="team"/);
  assert.match(selectedHidden, /\bvalue="alpha"/);

  const queryOnlyMarkup = renderToStaticMarkup(
    React.createElement(Combobox, {
      ...common,
      name: 'team',
      value: '',
      query: 'typed only',
    }),
  );
  const queryOnlyInputs = [...queryOnlyMarkup.matchAll(/<input\b[^>]*>/g)].map(
    (match) => match[0],
  );
  const queryOnlySearch = queryOnlyInputs.find((input) => /\btype="search"/.test(input));
  const queryOnlyHidden = queryOnlyInputs.find((input) => /\btype="hidden"/.test(input));

  assert.match(queryOnlySearch, /\bvalue="typed only"/);
  assert.match(queryOnlySearch, /\baria-invalid="true"/);
  assert.doesNotMatch(queryOnlySearch, /\bname=/);
  assert.match(queryOnlyHidden, /\bname="team"/);
  assert.match(queryOnlyHidden, /\bvalue=""/);

  const multiMarkup = renderToStaticMarkup(
    React.createElement(MultiSelect, {
      ...common,
      name: 'teams',
      value: ['alpha', 'beta'],
      query: '',
    }),
  );
  const multiInputs = [...multiMarkup.matchAll(/<input\b[^>]*>/g)].map(
    (match) => match[0],
  );
  const multiSearch = multiInputs.find((input) => /\btype="search"/.test(input));
  const committedValues = multiInputs
    .filter((input) => /\btype="hidden"/.test(input))
    .map((input) => input.match(/\bvalue="([^"]*)"/)?.[1]);

  assert.doesNotMatch(multiSearch, /\bname=/);
  assert.deepEqual(committedValues, ['alpha', 'beta']);
});

test('selection source keeps native validity tied to committed values', async () => {
  const source = await read('src/components/forms/selection.tsx');

  assert.match(source, /setCustomValidity/);
  assert.match(source, /selectionValidityMessage/);
  assert.doesNotMatch(source, /name=\{name\}\s+type="search"/);
});

test('staged multiselect applies once, cancels without committing, and guards disabled options', async () => {
  const source = await read('src/components/forms/selection.tsx');

  assert.match(source, /staged/);
  assert.match(source, /setDraft/);
  assert.match(source, /'apply'/);
  assert.match(source, /'cancel'/);
  assert.match(source, /option\.disabled/);
  assert.match(source, /onValueChange\(/);
  assert.match(source, /'keyboard'/);
  assert.match(source, /'pointer'/);
  assert.match(source, /clickMeta/);
  assert.match(source, /formActionDisabled/);
  assert.match(source, /runFormAction/);
});

test('form catalog has every exact deterministic case and imports components publicly', async () => {
  const [caseSource, fixtureSource] = await Promise.all([
    read('src/catalog/cases/forms.tsx'),
    read('src/fixtures/forms.ts'),
  ]);
  const caseIds = [...fixtureSource.matchAll(/^\s*'((?:form\/)[^']+)',?\s*$/gm)].map(
    (match) => match[1],
  );

  assert.deepEqual(caseIds, expectedIds);
  assert.equal(new Set(caseIds).size, caseIds.length);
  assert.match(caseSource, /from '@krasnaya\/beras-ui'/);
  assert.match(caseSource, /import '@krasnaya\/beras-ui\/styles\.css'/);
  assert.match(caseSource, /export const formCases:\s*readonly CatalogRuntimeCase\[\]/);
  assert.doesNotMatch(caseSource, /from ['"](?:\.\.\/)+(?:components|layouts|internal)/);
  assert.doesNotMatch(
    `${caseSource}\n${fixtureSource}`,
    /\b(?:Math\.random|Date\.now|fetch|XMLHttpRequest|WebSocket|EventSource|localStorage)\b/,
  );
});

test('generic form exports preserve option literal inference', async () => {
  const fixturePath = join(tmpdir(), `beras-forms-types-${process.pid}.ts`);
  const publicComponents = new URL('../src/public/components.ts', import.meta.url).pathname;
  const fixture = `
    import { SelectField, Combobox, MultiSelect, SegmentedControl } from ${JSON.stringify(publicComponents)};
    const options = [
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta' },
    ] as const;
    SelectField({
      name: 'team', label: 'Team', value: 'alpha', options,
      onValueChange(next) { const exact: 'alpha' | 'beta' | '' = next; void exact; },
    });
    Combobox({
      name: 'team', label: 'Team', value: 'alpha', options: { status: 'ready', data: options },
      open: false,
      onOpenChange() {},
      onValueChange(next) { const exact: 'alpha' | 'beta' | '' = next; void exact; },
    });
    MultiSelect({
      name: 'team', label: 'Team', value: ['alpha'], options: { status: 'ready', data: options },
      open: false,
      onOpenChange() {},
      onValueChange(next) { const exact: readonly ('alpha' | 'beta')[] = next; void exact; },
    });
    SegmentedControl({
      label: 'View', value: 'alpha', options,
      onValueChange(next) { const exact: 'alpha' | 'beta' = next; void exact; },
    });
  `;
  await writeFile(fixturePath, fixture);
  try {
    try {
      await execFileAsync(process.execPath, [
        new URL('../../node_modules/typescript/bin/tsc', appRoot).pathname,
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--target',
        'ES2020',
        '--module',
        'ESNext',
        '--moduleResolution',
        'Bundler',
        '--allowImportingTsExtensions',
        '--jsx',
        'react-jsx',
        fixturePath,
      ]);
    } catch (error) {
      assert.fail(`${error.stdout ?? ''}${error.stderr ?? ''}`);
    }
  } finally {
    await import('node:fs/promises').then(({ rm }) => rm(fixturePath, { force: true }));
  }
});
