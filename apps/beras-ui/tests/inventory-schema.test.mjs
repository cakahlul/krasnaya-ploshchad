import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const BASELINE = '79927540a3c27d2c29b42d84c42b7e9abcb51800';
const INVENTORY_URL = new URL('../src/inventory/', import.meta.url);

const PRODUCTION_SOURCES = [
  'apps/tere-project/src/app/dashboard/bug-monitoring/page.tsx',
  'apps/tere-project/src/app/dashboard/configuration/page.tsx',
  'apps/tere-project/src/app/dashboard/epic-explorer/page.tsx',
  'apps/tere-project/src/app/dashboard/holiday-management/page.tsx',
  'apps/tere-project/src/app/dashboard/layout.tsx',
  'apps/tere-project/src/app/dashboard/mcp-connection/page.tsx',
  'apps/tere-project/src/app/dashboard/page.tsx',
  'apps/tere-project/src/app/dashboard/productivity-summary/page.tsx',
  'apps/tere-project/src/app/dashboard/reports/page.tsx',
  'apps/tere-project/src/app/dashboard/talent-leave/page.tsx',
  'apps/tere-project/src/app/dashboard/team-members/page.tsx',
  'apps/tere-project/src/app/icon.tsx',
  'apps/tere-project/src/app/layout.tsx',
  'apps/tere-project/src/app/page.tsx',
  'apps/tere-project/src/app/sign-in/Stat3DScene.tsx',
  'apps/tere-project/src/app/sign-in/page.tsx',
  'apps/tere-project/src/app/sign-up/page.tsx',
  'apps/tere-project/src/components/AxiosErrorInterceptor.tsx',
  'apps/tere-project/src/components/LegalModal.tsx',
  'apps/tere-project/src/components/LoadingScreen.tsx',
  'apps/tere-project/src/components/PageSkeleton.tsx',
  'apps/tere-project/src/components/RoleBasedRoute.tsx',
  'apps/tere-project/src/components/ThemeToggle.tsx',
  'apps/tere-project/src/components/buttonLoginGoogle.tsx',
  'apps/tere-project/src/components/loadingBar.tsx',
  'apps/tere-project/src/components/loadingBounce.tsx',
  'apps/tere-project/src/components/maintenancePage.tsx',
  'apps/tere-project/src/components/sidebar.tsx',
  'apps/tere-project/src/components/topbar.tsx',
  'apps/tere-project/src/features/api-keys/components/McpConnectionPage.tsx',
  'apps/tere-project/src/features/bug-monitoring/components/BugListView.tsx',
  'apps/tere-project/src/features/bug-monitoring/components/BugStatistics.tsx',
  'apps/tere-project/src/features/bug-monitoring/components/BugTable.tsx',
  'apps/tere-project/src/features/bug-monitoring/components/BugTrendChart.tsx',
  'apps/tere-project/src/features/configuration/components/ComingSoon.tsx',
  'apps/tere-project/src/features/configuration/components/ConfigAuditLogPanel.tsx',
  'apps/tere-project/src/features/configuration/components/ConfigurationTabs.tsx',
  'apps/tere-project/src/features/configuration/components/HolidayAuditLogPanel.tsx',
  'apps/tere-project/src/features/configuration/components/TargetWpAuditLogPanel.tsx',
  'apps/tere-project/src/features/configuration/components/TargetWpConfigPanel.tsx',
  'apps/tere-project/src/features/configuration/components/WpWeightAuditLogPanel.tsx',
  'apps/tere-project/src/features/configuration/components/WpWeightConfigPanel.tsx',
  'apps/tere-project/src/features/dashboard/components/DateRangeSelect.tsx',
  'apps/tere-project/src/features/dashboard/components/GlobalSearch.tsx',
  'apps/tere-project/src/features/dashboard/components/MemberTaskModal.tsx',
  'apps/tere-project/src/features/dashboard/components/MultiSelectSprint.tsx',
  'apps/tere-project/src/features/dashboard/components/MultiSelectTeam.tsx',
  'apps/tere-project/src/features/dashboard/components/ProductivitySummary.tsx',
  'apps/tere-project/src/features/dashboard/components/ProductivitySummaryExportButton.tsx',
  'apps/tere-project/src/features/dashboard/components/SprintSelect.tsx',
  'apps/tere-project/src/features/dashboard/components/SprintTrendChart.tsx',
  'apps/tere-project/src/features/dashboard/components/TeamSelect.tsx',
  'apps/tere-project/src/features/dashboard/components/epicSelect.tsx',
  'apps/tere-project/src/features/dashboard/components/filterReport.tsx',
  'apps/tere-project/src/features/dashboard/components/teamPerformance.tsx',
  'apps/tere-project/src/features/dashboard/components/teamTable.tsx',
  'apps/tere-project/src/features/epic-explorer/components/DescendantControls.tsx',
  'apps/tere-project/src/features/epic-explorer/components/DescendantDetail.tsx',
  'apps/tere-project/src/features/epic-explorer/components/EpicInfoCard.tsx',
  'apps/tere-project/src/features/epic-explorer/components/EpicSearch.tsx',
  'apps/tere-project/src/features/epic-explorer/components/FrSelect.tsx',
  'apps/tere-project/src/features/epic-explorer/components/HierarchyTree.tsx',
  'apps/tere-project/src/features/epic-explorer/components/MetricsPanel.tsx',
  'apps/tere-project/src/features/epic-explorer/components/ProjectSelect.tsx',
  'apps/tere-project/src/features/epic-explorer/components/StateViews.tsx',
  'apps/tere-project/src/features/epic-explorer/components/StatusBadge.tsx',
  'apps/tere-project/src/features/holiday-management/components/BulkInsert.tsx',
  'apps/tere-project/src/features/holiday-management/components/HolidayCalendar.tsx',
  'apps/tere-project/src/features/holiday-management/components/HolidayFormModal.tsx',
  'apps/tere-project/src/features/holiday-management/components/HolidayListView.tsx',
  'apps/tere-project/src/features/talent-leave/components/DateRangePicker.tsx',
  'apps/tere-project/src/features/talent-leave/components/ExportButton.tsx',
  'apps/tere-project/src/features/talent-leave/components/ExportToast.tsx',
  'apps/tere-project/src/features/talent-leave/components/LeaveCalendar.tsx',
  'apps/tere-project/src/features/talent-leave/components/LeaveCalendarSimple.tsx',
  'apps/tere-project/src/features/talent-leave/components/LeaveListView.tsx',
  'apps/tere-project/src/features/talent-leave/components/LeaveModal.tsx',
  'apps/tere-project/src/features/talent-leave/components/MonthSelector.tsx',
  'apps/tere-project/src/features/team-members/components/MemberFormModal.tsx',
  'apps/tere-project/src/features/team-members/components/TeamMembersPage.tsx',
  'apps/tere-project/src/features/epic-explorer/utils/adfToReact.tsx',
  'apps/tere-project/src/hooks/useTheme.tsx',
];

const STYLESHEETS = [
  'apps/tere-project/src/app/bug-monitoring.css',
  'apps/tere-project/src/app/globals.css',
  'apps/tere-project/src/features/dashboard/components/FilterReport.css',
  'apps/tere-project/src/features/dashboard/components/SprintSelect.css',
];

const FOUNDATION_INPUTS = [
  'apps/tere-project/tailwind.config.ts',
  'apps/tere-project/src/app/layout.tsx#font-loading',
  'apps/tere-project/src/hooks/useTheme.tsx#theme-behavior',
];

const MANIFEST_KEYS = [
  'schemaVersion',
  'baselineCommit',
  'productionSources',
  'stylesheets',
  'foundationInputs',
];
const LEDGER_KEYS = [
  'sourcePath',
  'currentDependencies',
  'removedRuntimeCoupling',
  'responsiveConcerns',
  'accessibilityConcerns',
  'artifacts',
];
const ARTIFACT_KEYS = [
  'id',
  'description',
  'disposition',
  'canonicalExports',
  'caseIds',
  'requiredStates',
  'rationale',
  'evidenceIds',
];
const CASE_ID = /^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/;
const EVIDENCE_ID = /^evidence:([a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+):(visual|responsive|keyboard|focus|contrast|motion|offline):([a-z0-9-]+)$/;
const STATIC_DISPOSITIONS = new Set([
  'implemented',
  'non-visual business boundary',
  'not ported: dead CSS or known defect',
  'inventory-only: void/crimson',
]);
const NORMATIVE_LEDGER_SEMANTIC_SHA256 = '5765d81e06c77b7e296c1e27e6dbf8e84faf42c8398dd9c0d70b61c352f49698';
const FOUNDATION_TAGS = [
  {
    row: 12,
    sourcePath: 'apps/tere-project/src/app/layout.tsx',
    artifactId: 'source:S13:font-and-light-foundation',
    tag: 'apps/tere-project/src/app/layout.tsx#font-loading',
  },
  {
    row: 81,
    sourcePath: 'apps/tere-project/src/hooks/useTheme.tsx',
    artifactId: 'source:S82:light-theme',
    tag: 'apps/tere-project/src/hooks/useTheme.tsx#theme-behavior',
  },
];

async function readJson(name) {
  return JSON.parse(await readFile(new URL(name, INVENTORY_URL), 'utf8'));
}

function assertExactKeys(value, expected, label) {
  assert.deepEqual(Object.keys(value), expected, `${label} keys`);
}

function assertStringArray(value, label, { allowEmpty = true } = {}) {
  assert.ok(Array.isArray(value), `${label} must be an array`);
  if (!allowEmpty) assert.ok(value.length > 0, `${label} must not be empty`);
  assert.ok(value.every((item) => typeof item === 'string' && item.trim()), `${label} must contain non-empty strings`);
  assert.equal(new Set(value).size, value.length, `${label} must be unique`);
}

function validateManifest(manifest) {
  assertExactKeys(manifest, MANIFEST_KEYS, 'manifest');
  assert.equal(manifest.schemaVersion, 1, 'schemaVersion');
  assert.equal(manifest.baselineCommit, BASELINE, 'baselineCommit');
  assert.deepEqual(manifest.productionSources, PRODUCTION_SOURCES, 'productionSources');
  assert.deepEqual(manifest.stylesheets, STYLESHEETS, 'stylesheets');
  assert.deepEqual(manifest.foundationInputs, FOUNDATION_INPUTS, 'foundationInputs');

  const physicalPaths = [
    ...manifest.productionSources,
    ...manifest.stylesheets,
    ...manifest.foundationInputs.map((input) => input.split('#')[0]),
  ];
  assert.equal(new Set(physicalPaths).size, 87, 'physical denominator must stay 87');
}

function validateNormativeLedgerGraph(ledger) {
  for (const { row, sourcePath, artifactId, tag } of FOUNDATION_TAGS) {
    assert.equal(ledger[row].sourcePath, sourcePath, `${tag} source row`);
    const artifact = ledger[row].artifacts.find(({ id }) => id === artifactId);
    assert.ok(artifact?.description.startsWith(`${tag}:`), `${tag} must remain explicit on its source artifact`);
  }

  const semanticGraph = ledger.map(({ sourcePath, artifacts }) => ({
    sourcePath,
    artifacts: artifacts.map(({
      id,
      disposition,
      canonicalExports,
      caseIds,
      requiredStates,
    }) => ({
      id,
      disposition,
      canonicalExports,
      caseIds,
      requiredStates,
    })),
  }));
  const digest = createHash('sha256')
    .update(JSON.stringify(semanticGraph))
    .digest('hex');
  assert.equal(digest, NORMATIVE_LEDGER_SEMANTIC_SHA256, 'normative semantic digest');
}

function validateLedger(ledger, manifest) {
  assert.ok(Array.isArray(ledger), 'ledger must be an array');
  assert.equal(ledger.length, 82, 'ledger must contain 82 rows');
  assert.deepEqual(ledger.map(({ sourcePath }) => sourcePath), manifest.productionSources, 'ledger paths');
  assert.equal(new Set(ledger.map(({ sourcePath }) => sourcePath)).size, 82, 'ledger paths must be unique');

  const artifactIds = new Set();
  const stylesheetPaths = new Set();

  ledger.forEach((entry, index) => {
    const row = String(index + 1).padStart(2, '0');
    assertExactKeys(entry, LEDGER_KEYS, `ledger[${index}]`);
    assertStringArray(entry.currentDependencies, `ledger[${index}].currentDependencies`);
    assertStringArray(entry.removedRuntimeCoupling, `ledger[${index}].removedRuntimeCoupling`);
    assertStringArray(entry.responsiveConcerns, `ledger[${index}].responsiveConcerns`);
    assertStringArray(entry.accessibilityConcerns, `ledger[${index}].accessibilityConcerns`);
    assert.ok(Array.isArray(entry.artifacts) && entry.artifacts.length > 0, `ledger[${index}].artifacts`);
    assert.ok(entry.artifacts.some(({ id }) => id.startsWith(`source:S${row}:`)), `row ${row} must retain source seed S${row}`);

    entry.artifacts.forEach((artifact, artifactIndex) => {
      const label = `ledger[${index}].artifacts[${artifactIndex}]`;
      assertExactKeys(artifact, ARTIFACT_KEYS, label);
      assert.equal(typeof artifact.id, 'string', `${label}.id`);
      assert.ok(artifact.id.trim(), `${label}.id`);
      assert.ok(!artifactIds.has(artifact.id), `${label}.id must be globally unique`);
      artifactIds.add(artifact.id);

      assert.equal(typeof artifact.description, 'string', `${label}.description`);
      assert.ok(artifact.description.trim(), `${label}.description`);
      assert.ok(
        STATIC_DISPOSITIONS.has(artifact.disposition) || /^canonicalized into \S(?:.*\S)?$/.test(artifact.disposition),
        `${label}.disposition is invalid`,
      );
      assert.notEqual(artifact.disposition, 'deferred', `${label}.disposition`);
      assertStringArray(artifact.canonicalExports, `${label}.canonicalExports`);
      assertStringArray(artifact.caseIds, `${label}.caseIds`);
      assertStringArray(artifact.requiredStates, `${label}.requiredStates`);
      assertStringArray(artifact.evidenceIds, `${label}.evidenceIds`);
      assert.equal(typeof artifact.rationale, 'string', `${label}.rationale`);
      assert.ok(artifact.rationale.trim(), `${label}.rationale`);

      const visual = artifact.disposition !== 'non-visual business boundary';
      if (visual) {
        assertStringArray(artifact.canonicalExports, `${label}.canonicalExports`, { allowEmpty: false });
        assertStringArray(artifact.caseIds, `${label}.caseIds`, { allowEmpty: false });
        assertStringArray(artifact.requiredStates, `${label}.requiredStates`, { allowEmpty: false });
        assertStringArray(artifact.evidenceIds, `${label}.evidenceIds`, { allowEmpty: false });
      }

      for (const caseId of artifact.caseIds) assert.match(caseId, CASE_ID, `${label}.caseIds`);
      assert.deepEqual(
        artifact.requiredStates,
        [...new Set(artifact.caseIds.map((caseId) => caseId.split('/')[2]))],
        `${label}.requiredStates must match case variants`,
      );
      for (const evidenceId of artifact.evidenceIds) {
        const match = evidenceId.match(EVIDENCE_ID);
        assert.ok(match, `${label}.evidenceIds contains malformed ID`);
        assert.ok(artifact.caseIds.includes(match[1]), `${label}.evidenceIds must link one of its cases`);
      }
      for (const caseId of artifact.caseIds) {
        assert.ok(
          artifact.evidenceIds.some((evidenceId) => evidenceId.startsWith(`evidence:${caseId}:`)),
          `${label} needs evidence for ${caseId}`,
        );
      }

      const stylesheetMatch = artifact.id.match(/^stylesheet:(.+\.css)#/);
      if (stylesheetMatch) stylesheetPaths.add(stylesheetMatch[1]);
    });
  });

  assert.deepEqual(
    [...stylesheetPaths].sort(),
    [...manifest.stylesheets].sort(),
    'stylesheet analyses must cover 4/4',
  );
  const serializedLedger = JSON.stringify(ledger);
  for (const input of manifest.foundationInputs) {
    assert.ok(serializedLedger.includes(input), `foundation input must be explicit: ${input}`);
  }

  assert.equal(ledger.filter(({ sourcePath }) => sourcePath.startsWith('apps/tere-project/src/app/')).length, 17, 'app/page/layout count');
  assert.equal(ledger.filter(({ sourcePath }) => sourcePath.startsWith('apps/tere-project/src/components/')).length, 12, 'shared count');
  assert.equal(ledger.filter(({ sourcePath }) => sourcePath.includes('/src/features/') && sourcePath.includes('/components/')).length, 51, 'feature count');
  assert.equal(ledger.filter(({ sourcePath }) => sourcePath.endsWith('/adfToReact.tsx')).length, 1, 'ADF count');
  assert.equal(ledger.filter(({ sourcePath }) => sourcePath.endsWith('/useTheme.tsx')).length, 1, 'theme count');
  validateNormativeLedgerGraph(ledger);
}

async function validInventory() {
  const [manifest, ledger] = await Promise.all([
    readJson('inventory-manifest.json'),
    readJson('inventory-ledger.json'),
  ]);
  validateManifest(manifest);
  validateLedger(ledger, manifest);
  return { manifest, ledger };
}

test('accepts the frozen manifest and 87-path physical denominator', async () => {
  validateManifest(await readJson('inventory-manifest.json'));
});

test('accepts the frozen 82/82 production and 4/4 stylesheet inventory', async () => {
  await validInventory();
});

test('rejects a wrong baseline SHA', async () => {
  const { manifest } = await validInventory();
  assert.throws(() => validateManifest({ ...manifest, baselineCommit: '0'.repeat(40) }), /baselineCommit/);
});

test('rejects wrong counts, duplicate/missing paths, and denominator inflation', async () => {
  const { manifest, ledger } = await validInventory();
  assert.throws(() => validateManifest({ ...manifest, productionSources: manifest.productionSources.slice(1) }), /productionSources/);
  assert.throws(
    () => validateManifest({ ...manifest, productionSources: [...manifest.productionSources.slice(0, -1), manifest.productionSources[0]] }),
    /productionSources/,
  );
  assert.throws(() => validateLedger(ledger.slice(0, -1), manifest), /82 rows/);
  assert.throws(
    () => validateManifest({ ...manifest, foundationInputs: [...manifest.foundationInputs, 'apps/tere-project/extra.ts'] }),
    /foundationInputs/,
  );
});

test('rejects illegal disposition and malformed IDs', async () => {
  const { manifest, ledger } = await validInventory();
  const badDisposition = structuredClone(ledger);
  badDisposition[0].artifacts[0].disposition = 'deferred';
  assert.throws(() => validateLedger(badDisposition, manifest), /disposition/);

  const badCase = structuredClone(ledger);
  badCase[0].artifacts[0].caseIds[0] = 'two/segments';
  assert.throws(() => validateLedger(badCase, manifest), /caseIds/);

  const badEvidence = structuredClone(ledger);
  badEvidence[0].artifacts[0].evidenceIds[0] = 'S01';
  assert.throws(() => validateLedger(badEvidence, manifest), /malformed ID/);
});

test('rejects an empty visual canonical, case, state, or evidence link', async () => {
  const { manifest, ledger } = await validInventory();
  for (const field of ['canonicalExports', 'caseIds', 'requiredStates', 'evidenceIds']) {
    const invalid = structuredClone(ledger);
    invalid[0].artifacts[0][field] = [];
    assert.throws(() => validateLedger(invalid, manifest), new RegExp(field));
  }
});

test('rejects deletion of normative artifacts, cases, states, and evidence', async () => {
  const { manifest, ledger } = await validInventory();

  const missingMobileFix = structuredClone(ledger);
  missingMobileFix[4].artifacts = missingMobileFix[4].artifacts.filter(
    ({ id }) => id !== 'source:S05:fixed-mobile-offset',
  );
  assert.throws(() => validateLedger(missingMobileFix, manifest), /normative semantic digest/);

  const missingBugEmpty = structuredClone(ledger);
  const bugMonitoring = missingBugEmpty[0].artifacts.find(
    ({ id }) => id === 'source:S01:bug-monitoring-view',
  );
  bugMonitoring.caseIds = bugMonitoring.caseIds.filter(
    (caseId) => caseId !== 'composition/bug-monitoring/empty',
  );
  bugMonitoring.requiredStates = bugMonitoring.requiredStates.filter(
    (state) => state !== 'empty',
  );
  bugMonitoring.evidenceIds = bugMonitoring.evidenceIds.filter(
    (evidenceId) => !evidenceId.startsWith('evidence:composition/bug-monitoring/empty:'),
  );
  assert.throws(() => validateLedger(missingBugEmpty, manifest), /normative semantic digest/);

  const missingSafeHtmlBoundary = structuredClone(ledger);
  missingSafeHtmlBoundary[44].artifacts = missingSafeHtmlBoundary[44].artifacts.filter(
    ({ id }) => id !== 'source:S45:raw-html-description',
  );
  assert.throws(() => validateLedger(missingSafeHtmlBoundary, manifest), /normative semantic digest/);
});

test('freezes SprintOption beside the row 46 and 50 canonical controls', async () => {
  const { ledger } = await validInventory();
  const sprintMultiSelect = ledger[45].artifacts.find(
    ({ id }) => id === 'source:S46:sprint-multiselect',
  );
  const sprintCombobox = ledger[49].artifacts.find(
    ({ id }) => id === 'source:S50:sprint-combobox',
  );

  assert.deepEqual(sprintMultiSelect.canonicalExports, ['MultiSelect', 'SprintOption']);
  assert.deepEqual(sprintCombobox.canonicalExports, ['Combobox', 'SprintOption']);
});
