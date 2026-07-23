import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appRoot = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, appRoot), 'utf8');

const visualExports = [
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
  'TextField',
  'TextAreaField',
  'SwitchField',
  'CheckboxField',
  'SelectField',
  'Combobox',
  'SearchCombobox',
  'MultiSelect',
  'DateField',
  'MonthField',
  'DateRangeField',
  'FieldGroup',
  'FilterBar',
  'SegmentedControl',
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
  'Dialog',
  'ConfirmDialog',
  'LegalContentDialog',
  'Drawer',
  'Popover',
  'Tabs',
  'Pagination',
  'Breadcrumbs',
  'NavList',
  'AppHeader',
  'AppSidebar',
  'PageHeader',
  'DataTable',
  'AuditLogPanel',
  'ActivityList',
  'TaskList',
  'IssueList',
  'HolidayList',
  'LeaveList',
  'TeamMetricsTable',
  'LeaveScheduleGrid',
  'DefinitionList',
  'InstructionSteps',
  'Legend',
  'DonutChart',
  'BarChart',
  'AreaChart',
  'LineChart',
  'BugTrendPanel',
  'SprintTrendPanel',
  'MonthCalendar',
  'HolidayCalendar',
  'IssueTree',
  'TreeControls',
  'AdfContent',
  'Stat3DScene',
  'MemberTasksDialog',
  'MemberFormDialog',
  'LeaveFormDialog',
  'HolidayFormDialog',
  'ConfigFormDialog',
  'TicketDetailDialog',
  'ApiKeyTable',
  'JsonImportPanel',
  'AppShell',
  'AuthLayout',
  'SignInView',
  'SignUpView',
  'DashboardOverview',
  'BugMonitoringView',
  'ConfigurationView',
  'McpConnectionView',
  'ProductivitySummaryView',
  'ReportsView',
  'EpicExplorerView',
  'HolidayManagementView',
  'TalentLeaveView',
  'TeamMembersView',
];

const toRootClass = (name) =>
  `.beras-${name
    .replace(/([A-Za-z])([0-9])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()}`;

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const splitSelectorList = (selectorList) => {
  const selectors = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < selectorList.length; index += 1) {
    if (selectorList[index] === '(') depth += 1;
    if (selectorList[index] === ')') depth -= 1;
    if (selectorList[index] === ',' && depth === 0) {
      selectors.push(selectorList.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(selectorList.slice(start).trim());
  return selectors;
};

const berasSelectorMarker =
  /(?:\.beras-[a-z0-9-]+|\[data-beras-(?:root|[a-z0-9-]+)[^\]]*\])/;

const maskQuotedText = (selector) => {
  let masked = '';
  let quote = '';

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
    if (!quote) {
      masked += character;
      if (character === '"' || character === "'") quote = character;
    } else if (character === '\\') {
      index += 1;
    } else if (character === quote) {
      masked += character;
      quote = '';
    }
  }
  return masked;
};

const findClosingParenthesis = (selector, openingIndex) => {
  let depth = 0;

  for (let index = openingIndex; index < selector.length; index += 1) {
    if (selector[index] === '(') depth += 1;
    if (selector[index] === ')') depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
};

const splitSelectorCompounds = (selector) => {
  const compounds = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < selector.length; index += 1) {
    if (selector[index] === '(' || selector[index] === '[') depth += 1;
    if (selector[index] === ')' || selector[index] === ']') depth -= 1;
    if (depth === 0 && (/\s/.test(selector[index]) || /[>+~]/.test(selector[index]))) {
      const compound = selector.slice(start, index).trim();
      if (compound) compounds.push(compound);
      start = index + 1;
    }
  }
  const compound = selector.slice(start).trim();
  if (compound) compounds.push(compound);
  return compounds;
};

const isBerasScopedSelector = (selector) => {
  let hasScope = false;

  for (const compound of splitSelectorCompounds(maskQuotedText(selector))) {
    let normalized = '';
    let validBranches = true;

    for (let index = 0; index < compound.length; index += 1) {
      const functionalSelector = compound.slice(index).match(/^:([a-z-]+)\(/i);
      if (!functionalSelector) {
        normalized += compound[index];
        continue;
      }

      const openingIndex = index + functionalSelector[0].length - 1;
      const closingIndex = findClosingParenthesis(compound, openingIndex);
      assert.notEqual(closingIndex, -1, `unclosed functional selector: ${selector}`);
      const name = functionalSelector[1].toLowerCase();
      const branches = splitSelectorList(compound.slice(openingIndex + 1, closingIndex));
      const branchesAreScoped =
        (name === 'is' || name === 'where') &&
        branches.length > 0 &&
        branches.every(isBerasScopedSelector);

      if ((name === 'is' || name === 'where') && !branchesAreScoped) {
        validBranches = false;
      }
      normalized += branchesAreScoped ? '.beras-functional-scope' : ':functional-selector';
      index = closingIndex;
    }

    const compoundIsScoped = validBranches && berasSelectorMarker.test(normalized);
    const isUniversalTarget =
      normalized.replace(/\*/g, '').replace(/::?[a-z-]+/gi, '').trim() === '';
    if (!compoundIsScoped && !isUniversalTarget) return false;
    hasScope ||= compoundIsScoped;
  }
  return hasScope;
};

const assertBerasScopedSelectors = (css) => {
  const withoutKeyframes = css.replace(
    /@keyframes\s+[^\{]+\{(?:[^\{\}]|\{[^\{\}]*\})*\}/g,
    '',
  );
  const selectorLists = [
    ...withoutKeyframes.matchAll(/(?:^|[{}])\s*([^@{}][^{}]*?)\s*\{/g),
  ]
    .map((match) => match[1])
    .filter((selectorList) => !selectorList.trimStart().startsWith('@'));

  for (const selector of selectorLists.flatMap(splitSelectorList)) {
    assert.ok(isBerasScopedSelector(selector), `unscoped public selector: ${selector}`);
  }
};

const parseFoundationContract = (source) => {
  const breakpointBlock = source.match(
    /export const BERAS_BREAKPOINTS = Object\.freeze\(\{([\s\S]*?)\}\);/,
  )?.[1];
  assert.ok(breakpointBlock, 'missing BERAS_BREAKPOINTS metadata');

  const breakpoints = Object.fromEntries(
    [...breakpointBlock.matchAll(/^\s*([a-z][a-z0-9]*):\s*(\d+),?\s*$/gm)].map(
      ([, name, value]) => [name, Number(value)],
    ),
  );
  const tokenEntries = [
    ...source.matchAll(
      /^\s*'(--beras-[a-z0-9-]+)':\s*\{\s*value:\s*(['"])(.*?)\2,\s*group:/gm,
    ),
  ];
  const tokenReference = Object.fromEntries(
    tokenEntries.map(([, name, , value]) => [name, { value }]),
  );

  assert.equal(
    Object.keys(tokenReference).length,
    tokenEntries.length,
    'foundation metadata must not repeat token names',
  );
  assert.match(
    source,
    /export const BERAS_TOKEN_NAMES = Object\.freeze\(\s*Object\.keys\(berasLightTokenReference\)/,
  );

  return {
    breakpoints,
    tokenNames: Object.keys(tokenReference),
    tokenReference,
  };
};

test('foundation metadata and shipped CSS enumerate the same public tokens', async () => {
  const [foundationSource, tokensCss, baseCss, componentsCss, testSource] = await Promise.all([
    read('src/foundations/index.ts'),
    read('src/styles/tokens.css'),
    read('src/styles/base.css'),
    read('src/styles/components.css'),
    read('tests/foundations.test.mjs'),
  ]);
  const { breakpoints, tokenNames, tokenReference } = parseFoundationContract(foundationSource);
  const cssTokenNames = [
    ...tokensCss.matchAll(/^\s*(--beras-[a-z0-9-]+)\s*:/gm),
  ].map((match) => match[1]);
  const allPublicDeclarations = [
    ...`${tokensCss}\n${baseCss}\n${componentsCss}`.matchAll(
      /^\s*(--beras-[a-z0-9-]+)\s*:/gm,
    ),
  ].map((match) => match[1]);

  assert.deepEqual(breakpoints, {
    narrow: 320,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
  });
  assert.deepEqual([...tokenNames].sort(), [...cssTokenNames].sort());
  assert.deepEqual([...tokenNames].sort(), [...allPublicDeclarations].sort());
  assert.deepEqual(Object.keys(tokenReference).sort(), [...cssTokenNames].sort());
  assert.equal(new Set(cssTokenNames).size, cssTokenNames.length);
  assert.doesNotMatch(testSource, /\bimport\s*\(\s*['"][^'"]+\.tsx?['"]\s*\)/);

  for (const name of tokenNames) {
    assert.equal(
      tokenReference[name].value,
      tokensCss.match(new RegExp(`${name.replaceAll('-', '\\-')}\\s*:\\s*([^;]+)`))?.[1].trim(),
      `${name} metadata must match its shipped CSS value`,
    );
  }

  for (const anchor of ['#011d4d', '#034078', '#1282a2', '#22b8d4', '#f2f4f9', '#ffffff']) {
    assert.match(tokensCss.toLowerCase(), new RegExp(anchor));
  }
  assert.match(foundationSource, /contrast-corrected/i);
});

test('stylesheet entrypoint and selectors stay inside the frozen public boundary', async () => {
  const [indexCss, baseCssRaw, componentsCssRaw] = await Promise.all([
    read('src/styles/index.css'),
    read('src/styles/base.css'),
    read('src/styles/components.css'),
  ]);
  const baseCss = stripComments(baseCssRaw);
  const componentsCss = stripComments(componentsCssRaw);

  assert.equal(
    indexCss.trim(),
    "@import './tokens.css';\n@import './base.css';\n@import './components.css';",
  );
  assert.match(baseCss, /\[data-beras-root\]/);
  assert.doesNotMatch(baseCss, /(^|})\s*(?:html|body|button|table|dialog|\*)\b[^,{]*\{/m);

  for (const exportName of visualExports) {
    assert.match(componentsCss, new RegExp(`\\${toRootClass(exportName)}(?![a-z0-9-])`));
  }
  for (const attribute of ['state', 'tone', 'size', 'variant']) {
    assert.match(componentsCss, new RegExp(`\\[data-beras-${attribute}\\]`));
  }

  const allCss = `${baseCss}\n${componentsCss}`;
  assert.doesNotMatch(allCss, /\.(?:dark|void|crimson)\b/i);
  assert.doesNotMatch(allCss, /\.(?:ant-|recharts|lucide|framer|three)/i);
  assert.doesNotMatch(allCss, /\b(?:localStorage|slotProps|classNames)\b/);
  assert.doesNotMatch(componentsCss, /\.beras-[a-z0-9-]+\s+\.[a-z]/);
  assertBerasScopedSelectors(componentsCss);
  assert.throws(
    () => assertBerasScopedSelectors(`${componentsCss}\n[aria-label] { color: inherit; }`),
    /unscoped public selector: \[aria-label\]/,
  );
  for (const selector of [
    ':is(.beras-button, [aria-label])',
    '.beras-button + [aria-label]',
    '[aria-label] + .beras-button',
    ':not(.beras-button) [aria-label]',
    '[aria-label=".beras-button"]',
  ]) {
    assert.throws(
      () => assertBerasScopedSelectors(`${componentsCss}\n${selector} { color: inherit; }`),
      new RegExp(`unscoped public selector: ${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );
  }
  assert.deepEqual(
    [...new Set([...componentsCss.matchAll(/@media[^\{]*?(\d+)px/g)].map((match) => Number(match[1])))].sort(
      (left, right) => left - right,
    ),
    [320, 768, 1024, 1440],
  );
});

test('long primitive content stays contained at narrow widths', async () => {
  const css = stripComments(await read('src/styles/components.css'));
  const codeBlockRule = css.match(/\.beras-code-block\s*\{([^}]*)\}/)?.[1];
  const secretFieldRule = css.match(/\.beras-secret-field\s*\{([^}]*)\}/)?.[1];

  assert.ok(codeBlockRule, 'missing CodeBlock root rule');
  assert.match(codeBlockRule, /max-inline-size:\s*100%/);
  assert.match(codeBlockRule, /overflow-x:\s*auto/);
  assert.ok(secretFieldRule, 'missing SecretField root rule');
  assert.match(secretFieldRule, /max-inline-size:\s*100%/);
  assert.match(secretFieldRule, /overflow-wrap:\s*anywhere/);
});

test('reduced motion collapses duration and stops looping motion', async () => {
  const css = stripComments(
    `${await read('src/styles/base.css')}\n${await read('src/styles/components.css')}`,
  );
  const reducedMotion = css.match(
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]+)\}\s*$/,
  )?.[1];

  assert.ok(reducedMotion, 'missing reduced-motion media query');
  assert.match(reducedMotion, /(?:animation|transition)-duration:\s*1ms/);
  assert.match(reducedMotion, /animation-iteration-count:\s*1/);
  assert.match(reducedMotion, /scroll-behavior:\s*auto/);
  assert.match(reducedMotion, /--_beras-parallax-[xy]:\s*0/);
});

test('foundation catalog cases use exact deterministic IDs and public entrypoints', async () => {
  const expectedIds = [
    'foundation/typography/sans',
    'foundation/typography/mono',
    'foundation/typography/weights',
    'foundation/light-theme/tokens',
    'foundation/light-theme/status',
    'foundation/light-theme/data-visualization',
    'foundation/light-theme/contrast',
  ];
  const [caseSource, fixtureSource] = await Promise.all([
    read('src/catalog/cases/foundations.tsx'),
    read('src/fixtures/foundations.ts'),
  ]);
  const caseIds = [...caseSource.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);
  const fixtureIds = [...fixtureSource.matchAll(/^\s*'(fixture:[^']+)':\s*\{/gm)].map(
    (match) => match[1],
  );

  assert.deepEqual(caseIds, expectedIds);
  assert.match(fixtureSource, /export const foundationFixtures = Object\.freeze\(\{/);
  assert.deepEqual(fixtureIds, expectedIds.map((id) => `fixture:${id}`));
  assert.equal(new Set(fixtureIds).size, fixtureIds.length);
  assert.match(caseSource, /from '@krasnaya\/beras-ui\/foundations'/);
  assert.match(caseSource, /import '@krasnaya\/beras-ui\/styles\.css'/);
  assert.doesNotMatch(`${caseSource}\n${fixtureSource}`, /\b(?:Math\.random|Date\.now|fetch|XMLHttpRequest|WebSocket|EventSource|localStorage)\b/);
  assert.doesNotMatch(caseSource, /\bstyle\s*=|\bdangerouslySetInnerHTML\b/);
});
