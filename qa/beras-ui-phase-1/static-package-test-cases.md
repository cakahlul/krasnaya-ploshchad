# BU-QA-P1-01 — Static/package executable test cases

Planning artifact only. No gate has been executed and no pass result is claimed here.

## Scope and source of truth

These cases cover Phase 1 static/package contracts in:

- `.claude/specs/beras-ui/prd.md`;
- `.claude/specs/beras-ui/trd-phase-1-fe-web.md`;
- `.claude/specs/beras-ui/trd-phase-1-qa.md`;
- `.claude/specs/beras-ui/inventory-baseline.md`;
- `tasks/plan.md` contracts C-01 through C-05;
- `tasks/beras-ui-phase-1/BU-P1-01-workspace-public-contract.md`;
- `tasks/beras-ui-phase-1/BU-P1-02-inventory-ledger.md`;
- `tasks/beras-ui-phase-1/BU-P1-15-catalog-docs.md`;
- `tasks/beras-ui-phase-1/BU-P1-16-consumer-validators.md`;
- `tasks/beras-ui-phase-1/BU-P1-17-evidence-integration.md`.

Static/package scope excludes browser interaction, responsive screenshots, visual parity, and
accessibility walkthroughs. Those belong to the later QA plans. No unauthorized-access scenario
is added: this package has no auth/RBAC runtime. Isolation checks instead prove that auth/RBAC
logic is absent.

## Common execution contract

### Canonical-run preconditions

Run from repository root on the assembled Phase 1 commit:

1. All Phase 1 implementation inputs required by the case exist. Missing input is a failed
   precondition, not a pass.
2. Working tree is clean. Do not execute positive gates over another task's uncommitted edits.
3. Node is `>=20.9.0`; npm is `10.9.2`.
4. Tere baseline is `79927540a3c27d2c29b42d84c42b7e9abcb51800`.
5. No Tere environment variable, credential, or service is supplied.
6. `npm ci` has completed successfully.

Record preconditions with:

```bash
git rev-parse --show-toplevel
git rev-parse HEAD
git status --short
node --version
npm --version
npm ci
```

Expected: repository root is current directory; tested commit is recorded; `git status --short`
prints nothing; Node satisfies the minimum; npm prints `10.9.2`; `npm ci` exits `0`.

### Isolated seeded-negative harness

Never seed the canonical workspace. In one shell, initialize:

```bash
QA_STATIC_REPO_ROOT="$(git rev-parse --show-toplevel)" || exit 1
QA_STATIC_REPO_ROOT="$(cd "$QA_STATIC_REPO_ROOT" && pwd -P)" || exit 1
export QA_STATIC_REPO_ROOT || exit 1
unset QA_STATIC_SEED_REPO || exit 1

seed_repo() {
  local seed_root seed_repo_path temp_parent
  unset QA_STATIC_SEED_REPO || return 1
  temp_parent="$(cd "${TMPDIR:-/tmp}" && pwd -P)" || return 1
  case "$temp_parent" in
    "$QA_STATIC_REPO_ROOT"|"$QA_STATIC_REPO_ROOT"/*) return 1 ;;
  esac
  seed_root="$(mktemp -d "$temp_parent/beras-ui-static.XXXXXX")" || return 1
  seed_root="$(cd "$seed_root" && pwd -P)" || return 1
  case "$seed_root" in
    "$QA_STATIC_REPO_ROOT"|"$QA_STATIC_REPO_ROOT"/*) return 1 ;;
  esac
  seed_repo_path="$seed_root/repo"
  git clone --quiet --local --no-hardlinks \
    "$QA_STATIC_REPO_ROOT" "$seed_repo_path" || return 1
  cd "$seed_repo_path" || return 1
  seed_repo_path="$(pwd -P)" || return 1
  test -n "$seed_repo_path" || return 1
  case "$seed_repo_path" in
    "$QA_STATIC_REPO_ROOT"|"$QA_STATIC_REPO_ROOT"/*) return 1 ;;
  esac
  export QA_STATIC_SEED_REPO="$seed_repo_path" || return 1
  test "$(pwd -P)" = "$QA_STATIC_SEED_REPO" || return 1
  printf '%s\n' "$QA_STATIC_SEED_REPO" || return 1
}

assert_seed_repo() {
  local current_path
  test -n "${QA_STATIC_SEED_REPO:-}" || return 1
  current_path="$(pwd -P)" || return 1
  test "$current_path" = "$QA_STATIC_SEED_REPO" || return 1
  case "$current_path" in
    "$QA_STATIC_REPO_ROOT"|"$QA_STATIC_REPO_ROOT"/*) return 1 ;;
  esac
  test -d "$QA_STATIC_SEED_REPO/.git" || return 1
}
```

Call `seed_repo || exit 1`, then `assert_seed_repo || exit 1` immediately before every command
that writes or redirects output. Before clone, the harness resolves and rejects a temp parent or
seed root equal to or nested under the canonical root. The assertion requires physical `PWD` to
equal the exported seed path and remain outside the canonical root. Any `mktemp`, clone, `cd`,
export, assertion, or write failure terminates the procedure; no mutation command may run from
the canonical path.
Keep each clone unchanged after the run so its path can be recorded as evidence. Return with
`cd "$QA_STATIC_REPO_ROOT" || exit 1` before the next case. A negative passes only when the
seeded contract violation is rejected with non-zero status and a diagnostic identifying the
seeded file/value. An unexpected crash, missing script, or unrelated failure is not a pass.

### Result recording

For every case, fill the matching suffix row and defect template in
`static-package-results.md`. Capture complete stdout/stderr and record:

- positive command, exit code, actual output, artifact path;
- negative clone path, exact seed, command, exit code, actual diagnostic, artifact path;
- final `PASS` only when both positive and negative oracles match;
- exactly one owning `BU-P1-*` task for each defect.

## Frozen objective oracles

### Inventory and graph

Required literal successful report fields:

```text
production_sources=82/82
stylesheets=4/4
unexplained_artifacts=0
deferred=0
```

Inventory manifest is exactly:

- `schemaVersion: 1`;
- `baselineCommit: "79927540a3c27d2c29b42d84c42b7e9abcb51800"`;
- `productionSources`: normative ordered Appendix A list, unique `82`;
- `stylesheets`: exactly the four Appendix B paths;
- `foundationInputs`: exactly
  `apps/tere-project/tailwind.config.ts`,
  `apps/tere-project/src/app/layout.tsx#font-loading`, and
  `apps/tere-project/src/hooks/useTheme.tsx#theme-behavior`.

Unique physical denominator is `87`: 82 production paths + four CSS paths + Tailwind config.
Font/theme tags point to production rows 13 and 82 and do not inflate 82 or 87.

Ledger is an ordered array of 82 unique source rows. Row keys are exactly
`sourcePath`, `currentDependencies`, `removedRuntimeCoupling`, `responsiveConcerns`,
`accessibilityConcerns`, `artifacts`. Artifact keys are exactly `id`, `description`,
`disposition`, `canonicalExports`, `caseIds`, `requiredStates`, `rationale`, `evidenceIds`.
Allowed dispositions are only:

```text
implemented
canonicalized into <non-empty Beras export text>
non-visual business boundary
not ported: dead CSS or known defect
inventory-only: void/crimson
```

Case IDs match `^[a-z0-9-]+/[a-z0-9-]+/[a-z0-9-]+$`. Fixture IDs have exact form
`fixture:<category>/<slug>/<name>`. Evidence IDs have exact form
`evidence:<case-id>:<check>:<viewport-or-mode>`. Every visual artifact has non-empty canonical
export, case, and evidence links. Non-visual artifacts retain non-empty rationale.

Catalog and evidence schemas are exact, without renamed fields or optionality changes:

```ts
export type CatalogCoverageTag =
  | 'default'
  | 'loading'
  | 'empty'
  | 'error'
  | 'populated'
  | 'disabled'
  | 'validation'
  | 'focus'
  | 'overflow'
  | 'selection'
  | 'expanded'
  | 'pending'
  | 'success'
  | 'failure'
  | 'reduced-motion';

export interface CatalogCaseManifestEntry {
  id: `${string}/${string}/${string}`;
  category: string;
  slug: string;
  title: string;
  exportNames: string[];
  fixtureId: `fixture:${string}`;
  sourcePaths: string[];
  variant: string;
  coverage: CatalogCoverageTag[];
  widths: Array<320 | 768 | 1024 | 1440>;
  docsHref: string;
  interactive: boolean;
}

export interface EvidenceEntry {
  id: string;
  caseId: string;
  check:
    | 'visual'
    | 'responsive'
    | 'keyboard'
    | 'focus'
    | 'contrast'
    | 'motion'
    | 'offline';
  viewport?: 320 | 768 | 1024 | 1440;
  artifactPath: string;
  result: 'pass' | 'fail';
  note?: string;
}
```

Strict assertions:

- case-manifest entry keys are exactly `id`, `category`, `slug`, `title`, `exportNames`,
  `fixtureId`, `sourcePaths`, `variant`, `coverage`, `widths`, `docsHref`, `interactive`;
- `variant` equals the third `id` segment; every coverage value is one exact
  `CatalogCoverageTag`; every width is one of `320 | 768 | 1024 | 1440`;
- evidence required keys are exactly `id`, `caseId`, `check`, `artifactPath`, `result`; only
  optional `viewport` and `note` may be added;
- evidence `check` is one of the seven exact values above, `result` is only `pass | fail`, and
  an included `viewport` is only `320 | 768 | 1024 | 1440`;
- evidence `id` embeds the same `caseId` and `check` fields and a non-empty legal
  viewport-or-mode suffix;
- validators reject every extra key, missing required key, wrong primitive/array type, illegal
  coverage/width/check/result/viewport, and mismatched `variant`; they do not coerce values.

### Package, dependencies, and public exports

Package identity is `@krasnaya/beras-ui@0.1.0`, `private: true`, Node `>=20.9.0`.
`sideEffects` is exactly `["./src/styles/index.css"]`. Export map is exactly:

```json
{
  ".": "./src/public/index.ts",
  "./components": "./src/public/components.ts",
  "./layouts": "./src/public/layouts.ts",
  "./foundations": "./src/public/foundations.ts",
  "./types": "./src/public/types.ts",
  "./styles.css": "./src/styles/index.css"
}
```

No wildcard key, extra/private source subpath, wildcard re-export, default public export, or
throwing public-barrel placeholder is allowed.

Runtime direct dependencies are exactly:

```json
{
  "next": "16.0.8",
  "react": "19.2.1",
  "react-dom": "19.2.1"
}
```

Direct dev dependencies are exactly:

```json
{
  "@types/node": "^20",
  "@types/react": "19.2.7",
  "@types/react-dom": "19.2.3",
  "autoprefixer": "^10.4.18",
  "eslint": "^9",
  "eslint-config-next": "16.0.8",
  "postcss": "^8.4.35",
  "tailwindcss": "3.4.1",
  "typescript": "5.8.2"
}
```

`peerDependencies`, `optionalDependencies`, and `bundledDependencies` must not add a runtime
escape. Any other direct dependency or bare runtime import fails, including Ant Design,
`@ant-design/icons`, Recharts, Lucide, Framer Motion, Three/R3F/Drei/react-spring, Radix,
shadcn, TanStack Table, `dayjs`, or a class/style/UI/chart/icon package.

Frozen live-case denominator is 149 public visual exports: 135 component exports plus 14 layout
exports. Exact names:

```text
BrandMark, Button, IconButton, Badge, StatusBadge, Tag, Avatar, Card, MetricCard, StatGrid,
ProgressMeter, Divider, CodeBlock, SecretField,
GoogleIcon, SearchIcon, CloseIcon, MenuIcon, ChevronDownIcon, ChevronLeftIcon,
ChevronRightIcon, ArrowRightIcon, CalendarIcon, ClockIcon, UserIcon, UsersIcon, UserAddIcon,
LogoutIcon, LockIcon, EyeIcon, EyeOffIcon, CopyIcon, ExternalLinkIcon, EditIcon, DeleteIcon,
AddIcon, RemoveIcon, MinusCircleIcon, ReloadIcon, SyncIcon, LoadingIcon, DownloadIcon,
SpreadsheetIcon, BugIcon, CheckIcon, CheckCircleIcon, WarningIcon, ErrorIcon, InfoIcon,
DatabaseIcon, CodeIcon, JsonIcon, LinkIcon, TagIcon, TrendUpIcon, ChartIcon, FilterIcon,
TeamIcon, ExperimentIcon, MoreIcon, HomeIcon, ReportIcon, SettingsIcon, HolidayIcon, TreeIcon,
KeyIcon,
TextField, TextAreaField, SwitchField, CheckboxField, SelectField, Combobox, SearchCombobox,
MultiSelect, DateField, MonthField, DateRangeField, FieldGroup, FilterBar, SegmentedControl,
Spinner, Skeleton, PageSkeleton, LoadingOverlay, LoadingIllustration, StateView, Callout,
Toast, ToastViewport, MaintenanceState, AccessState,
Dialog, ConfirmDialog, LegalContentDialog, Drawer, Popover,
Tabs, Pagination, Breadcrumbs, NavList, AppHeader, AppSidebar, PageHeader,
DataTable, AuditLogPanel, ActivityList, TaskList, IssueList, HolidayList, LeaveList,
TeamMetricsTable, LeaveScheduleGrid, DefinitionList, InstructionSteps,
Legend, DonutChart, BarChart, AreaChart, LineChart, BugTrendPanel, SprintTrendPanel,
MonthCalendar, HolidayCalendar, IssueTree, TreeControls, AdfContent, Stat3DScene,
MemberTasksDialog, MemberFormDialog, LeaveFormDialog, HolidayFormDialog, ConfigFormDialog,
TicketDetailDialog, ApiKeyTable, JsonImportPanel,
AppShell, AuthLayout, SignInView, SignUpView, DashboardOverview, BugMonitoringView,
ConfigurationView, McpConnectionView, ProductivitySummaryView, ReportsView, EpicExplorerView,
HolidayManagementView, TalentLeaveView, TeamMembersView
```

Foundations export exactly three values `BERAS_BREAKPOINTS`, `BERAS_TOKEN_NAMES`,
`berasLightTokenReference` and semantic unions `BerasSize`, `BerasTone`, `BerasVariant`.
Root re-exports components, layouts, foundations, and public types.

### Exact forbidden static patterns

Validator scope is Beras public/runtime/catalog/fixture/config/CSS sources, not prose or the
intentional validator-test seed fixtures.

- Catalog/private boundary: relative component/layout/public/internal source imports,
  `apps/tere-project`, package-private or wildcard entrypoints.
- Runtime isolation: Tere path, runtime `process.env`/`import.meta.env`, secret/API URL,
  auth/RBAC/store/repository/query/mutation/API-client/Firebase/Axios/analytics coupling, remote
  runtime asset, `fetch(`, `XMLHttpRequest`, `WebSocket`, or `EventSource`.
- Determinism: `Math.random(`, `crypto.randomUUID(`, `Date.now(`, zero-argument `new Date()`, or
  `performance.now(` in fixtures/case rendering.
- CSS: unscoped public selector; global `button`, `table`, `dialog`, `*`, `body`, or `html`
  reset; third-party selector; emitted dark/void/crimson selector or token/value. `:root` is
  limited to token declarations; reset scope is `[data-beras-root]`.
- Public styling escape: `style`, `styles`, `classNames`, `slotProps`, or equivalent
  consumer-supplied internal styling. Internal inline style is allowed only for computed
  geometry and must not accept consumer CSS.

### Defect owner routing

Use the first failing owned file, not the validator that merely reported a real product defect:

| Failing path/contract | Owner |
|---|---|
| manifest, ledger, inventory schemas/tests | `BU-P1-02` |
| package/export map/public barrels/public types/root workspace | `BU-P1-01` |
| shared foundations or CSS | `BU-P1-03` |
| primitives/forms/feedback/overlays/navigation/data/charts/calendars/tree/3D/compositions | matching `BU-P1-04` through `BU-P1-14` family task |
| catalog shell, registry, case manifest, docs | `BU-P1-15` |
| consumer fixture or any validator false negative/crash | `BU-P1-16` |
| evidence manifest or evidence artifact resolution | `BU-P1-17` |
| Tere file changed | the single Phase 1 task whose diff introduced that file |

Do not open one defect against multiple owners. If multiple paths fail, create separate defect
records.

## Test cases

### QA-S01 — Manifest baseline, denominator, path uniqueness, and existence

| Field | Record |
|---|---|
| Description | Prove exact baseline, 82 production paths, four CSS paths, three foundation tags, source existence at baseline, and physical denominator 87. |
| Requirement | PRD Gate 1; QA TRD static manifest check; C-03. |
| Preconditions | Common preconditions; manifest and inventory validator exist. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Canonical manifest/schema: `BU-P1-02`; seed not rejected: `BU-P1-16`. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
node --test apps/beras-ui/tests/inventory-schema.test.mjs
npm run verify:inventory --workspace=@krasnaya/beras-ui
```

Expected: both exit `0`; exact manifest/schema/path checks pass; every source/CSS/Tailwind path
exists in the baseline tree; row-13 font and row-82 theme tags resolve without denominator
inflation; output contains `production_sources=82/82` and `stylesheets=4/4`.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/src/inventory/inventory-manifest.json';
  const value = JSON.parse(fs.readFileSync(path, 'utf8'));
  value.baselineCommit = '0000000000000000000000000000000000000000';
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
" || exit 1
npm run verify:inventory --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic names `baselineCommit`, the seeded all-zero SHA,
and required SHA `79927540a3c27d2c29b42d84c42b7e9abcb51800`. A generic parse crash fails the
negative oracle.

### QA-S02 — Ledger schema, dispositions, and complete artifact linkage

| Field | Record |
|---|---|
| Description | Prove 82 ordered rows, exact keys, five disposition forms, stylesheet artifacts, complete visual links, and zero unexplained/deferred artifacts. |
| Requirement | PRD Gate 1; QA TRD ledger check; C-03. |
| Preconditions | Common preconditions; manifest, ledger, schema test, and inventory validator exist. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Canonical ledger/schema: `BU-P1-02`; seed not rejected: `BU-P1-16`. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
node --test apps/beras-ui/tests/inventory-schema.test.mjs
npm run verify:inventory --workspace=@krasnaya/beras-ui
```

Expected: both exit `0`; ledger paths equal manifest order and group counts are
`17 + 12 + 51 + 1 + 1 = 82`; all artifact IDs are unique; all four stylesheet paths have
artifact disposition/case/evidence links; only the five allowed disposition forms occur;
visual artifacts have canonical/case/evidence links; non-visual artifacts have rationale.
Output contains exactly:

```text
production_sources=82/82
stylesheets=4/4
unexplained_artifacts=0
deferred=0
```

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/src/inventory/inventory-ledger.json';
  const value = JSON.parse(fs.readFileSync(path, 'utf8'));
  const row = value.find((entry) =>
    entry.sourcePath === 'apps/tere-project/src/app/dashboard/bug-monitoring/page.tsx'
  );
  const artifact = row?.artifacts.find((entry) =>
    entry.id === 'source:S01:bug-monitoring-view'
  );
  if (!artifact) throw new Error('seed target missing');
  artifact.disposition = 'deferred';
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
" || exit 1
npm run verify:inventory --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic identifies
`source:S01:bug-monitoring-view`, illegal disposition `deferred`, and the ledger path. It must
not print the successful `deferred=0` claim.

### QA-S03 — Artifact-to-case/fixture/renderer/docs/evidence graph

| Field | Record |
|---|---|
| Description | Prove every stable artifact link resolves exactly once through case manifest, deterministic fixture, runtime renderer, docs route, source mapping, and evidence. |
| Requirement | PRD Gate 3; QA TRD graph check; C-03. |
| Preconditions | Common preconditions; case/evidence manifests, registry, fixtures, docs, and inventory/catalog validators exist. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Broken ledger link `BU-P1-02`; catalog graph `BU-P1-15`; evidence resolution `BU-P1-17`; seed not rejected `BU-P1-16`. Record one. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
npm run verify:inventory --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:evidence --workspace=@krasnaya/beras-ui
node --test apps/beras-ui/tests/validators.test.mjs
```

Expected: all exit `0`; IDs obey frozen formats; no duplicate or dangling artifact/case/fixture/
renderer/evidence ID; every ledger case exists exactly once; every manifest entry has one
matching runtime renderer, fixture ID, existing docs route, source mapping, and applicable
evidence entry/artifact. Validator tests reject extra/missing fields, wrong field types, illegal
coverage/width/check/result/viewport, and a variant unequal to the third ID segment. Counts are
graph-derived, not accepted by count equality alone.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/src/inventory/case-manifest.json';
  const value = JSON.parse(fs.readFileSync(path, 'utf8'));
  const entry = value.find((item) => item.id === 'foundation/typography/sans');
  if (!entry) throw new Error('seed target missing');
  entry.fixtureId = 'fixture:qa-seed/missing/missing';
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
" || exit 1
npm run verify:catalog --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic identifies case
`foundation/typography/sans`, dangling fixture `fixture:qa-seed/missing/missing`, and case
manifest path.

### QA-S04 — Exact public export graph and live-case coverage

| Field | Record |
|---|---|
| Description | Prove exact package map, explicit frozen barrels, no wildcard/private/default export, and a live case for all 149 component/layout exports. |
| Requirement | PRD Gates 2–3; QA TRD public export graph; C-01 and C-03. |
| Preconditions | Common preconditions; public barrels, case manifest/registry, and catalog/boundary validators exist. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Export map/barrel `BU-P1-01`; missing live catalog case `BU-P1-15` or owning family task; seed not rejected `BU-P1-16`. Record one. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
```

Expected: both exit `0`; export map and all names exactly match the frozen oracle; component
barrel has 135 names, layout barrel 14 names, no extras; root re-exports the four TypeScript
surfaces; every one of 149 visual exports maps to at least one discoverable live manifest case
and renderer through public imports.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/src/public/components.ts';
  fs.appendFileSync(path, \"\nexport * from './types';\n\");
" || exit 1
npm run verify:boundaries --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic identifies `src/public/components.ts`, wildcard
re-export `export *`, and target `./types`. TypeScript duplicate-export noise alone does not
satisfy this oracle.

### QA-S05 — Clean consumer fixture through every public subpath

| Field | Record |
|---|---|
| Description | Prove a clean consumer imports root/components/layouts/foundations/types/styles exactly through the package map and passes typecheck/build. |
| Requirement | PRD Gate 2; QA TRD consumer fixture; C-01, C-02, C-05. |
| Preconditions | Common preconditions; consumer fixture exists and is included by TypeScript/build validation. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Consumer fixture `BU-P1-16`; public map/type `BU-P1-01`; implementation compile error matching family owner. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run typecheck --workspace=@krasnaya/beras-ui
npm run build --workspace=@krasnaya/beras-ui
```

Expected: all exit `0`; consumer imports at least one item from
`@krasnaya/beras-ui`, `/components`, `/layouts`, `/foundations`, `/types`, and imports
`@krasnaya/beras-ui/styles.css` exactly once; no relative/private source import; public values
and types compile; Next build resolves stylesheet and package self-consumption.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/tests/consumer/consumer.tsx';
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes('@krasnaya/beras-ui/types')) throw new Error('seed target missing');
  fs.writeFileSync(
    path,
    source.replace('@krasnaya/beras-ui/types', '@krasnaya/beras-ui/private')
  );
" || exit 1
assert_seed_repo || exit 1
npm ci || exit 1
npm run typecheck --workspace=@krasnaya/beras-ui
```

Expected: `npm ci` exits `0`; typecheck exits non-zero with diagnostic naming
`@krasnaya/beras-ui/private` as an unresolved/non-exported package subpath and the consumer file.

### QA-S06 — Catalog public-import-only boundary

| Field | Record |
|---|---|
| Description | Prove catalog and case modules self-consume only public Beras entrypoints/styles, while relatives are limited to catalog helpers, fixtures, and JSON. |
| Requirement | PRD R-03/Gate 2; QA TRD catalog boundary; C-03 and C-05. |
| Preconditions | Common preconditions; catalog sources and boundary validator exist. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Canonical catalog import `BU-P1-15` or owning family case task; seed not rejected `BU-P1-16`. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
```

Expected: both exit `0`; catalog component/layout/foundation/type imports use only exact package
entrypoints; public stylesheet import is package-based and singular; no relative component,
layout, public, internal, or Tere import exists.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/src/catalog/cases/foundations.tsx';
  const source = fs.readFileSync(path, 'utf8');
  fs.writeFileSync(
    path,
    \"import type { BerasCommonProps as QaSeedPrivateType } from '../../public/types';\n\" + source
  );
" || exit 1
npm run verify:boundaries --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic identifies the foundations case file and forbidden
relative private specifier `../../public/types`.

### QA-S07 — Exact dependency allowlists and prohibited-import scan

| Field | Record |
|---|---|
| Description | Prove exact runtime/dev dependency maps and zero unapproved runtime/UI/visual imports. |
| Requirement | PRD R-15/Gate 2; QA TRD dependency allowlist; C-01 and C-05. |
| Preconditions | Common preconditions; package manifest and boundary validator exist. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Manifest `BU-P1-01`; prohibited source import matching source owner; seed not rejected `BU-P1-16`. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
npm run verify:boundaries --workspace=@krasnaya/beras-ui
```

Expected: exits `0`; runtime and dev maps exactly equal the frozen maps above, with no extra
dependency section escape; every production bare import is provided by the exact allowlists or
Node/Next/React contract; prohibited dependency/import count is zero.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/package.json';
  const value = JSON.parse(fs.readFileSync(path, 'utf8'));
  value.dependencies.antd = '5.0.0';
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
" || exit 1
npm run verify:boundaries --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic identifies `dependencies.antd`, seeded version
`5.0.0`, exact allowed runtime names/versions, and package manifest path. It must fail without
requiring `antd` installation.

### QA-S08 — Runtime and fixture isolation from Tere/environment/network

| Field | Record |
|---|---|
| Description | Prove no Tere path, env/secret/API URL, auth/store/query/mutation coupling, remote runtime asset, or network fixture exists. |
| Requirement | PRD R-09/R-16/Gate 5; QA TRD runtime isolation; C-05. |
| Preconditions | Common preconditions; isolation validator exists. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Violating runtime/fixture file's family owner; catalog shell `BU-P1-15`; seed not rejected `BU-P1-16`. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
npm run verify:isolation --workspace=@krasnaya/beras-ui
```

Expected: exits `0`; exact forbidden isolation patterns above have zero findings. Build-time
`next/font/google` is allowed, but browser/runtime font output must be local; fixtures make no
request and import no Tere/runtime-business source.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/src/fixtures/foundations.ts';
  fs.appendFileSync(path, \"\nvoid fetch('https://qa-seed.invalid/runtime');\n\");
" || exit 1
npm run verify:isolation --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic identifies the fixture path, `fetch`, and
`https://qa-seed.invalid/runtime`. A DNS/network error is not the expected detector; the seeded
code must not be executed.

### QA-S09 — Stylesheet entrypoint, selector scope, and light-only output

| Field | Record |
|---|---|
| Description | Prove the single public stylesheet imports only tokens/base/components, scopes public selectors/resets, and emits no dark/void/crimson output. |
| Requirement | PRD R-06/R-07; QA TRD stylesheet boundary; C-04. |
| Preconditions | Common preconditions; four shared CSS files, foundation tests, and boundary validator exist. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Canonical CSS/foundation defect `BU-P1-03`; seed not rejected `BU-P1-16`. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
node --test apps/beras-ui/tests/foundations.test.mjs
npm run verify:boundaries --workspace=@krasnaya/beras-ui
```

Expected: both exit `0`; `styles.css` resolves to `src/styles/index.css`; index imports exactly
`tokens.css`, `base.css`, `components.css`; public selectors start with `.beras-*` or are scoped
by `data-beras-*`; reset scope is `[data-beras-root]`; only token declarations use `:root`;
forbidden global/third-party/dark/void/crimson patterns have zero findings.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/src/styles/components.css';
  fs.appendFileSync(path, '\nbutton { color: inherit; }\n');
" || exit 1
npm run verify:boundaries --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic identifies `components.css`, unscoped global
selector `button`, and the scoped-reset rule. Detecting only a generic CSS parse error fails the
negative oracle.

### QA-S10 — Outer-root-only `className` and no public style escape

| Field | Record |
|---|---|
| Description | Prove sentinel `className` appears once on each public visual outer root and no public internal-style/slot API exists. |
| Requirement | PRD R-07/Gate 2; QA TRD className contract; C-02 and C-04. |
| Preconditions | Common preconditions; all 149 visual exports are implemented; boundary validator and validator tests exist. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Public type escape `BU-P1-01`; root behavior matching family owner; seed not rejected `BU-P1-16`. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
npm run verify:boundaries --workspace=@krasnaya/beras-ui
node --test apps/beras-ui/tests/validators.test.mjs
```

Expected: both exit `0`; for each of 149 public visual exports, the boundary sentinel occurs
exactly once and on the outermost rendered element; no descendant repeats it. Public type/source
scan finds no `style`, `styles`, `classNames`, `slotProps`, or equivalent internal-style input.
Computed geometry styles are internal values only.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/src/public/types.ts';
  const source = fs.readFileSync(path, 'utf8');
  const before = '  className?: string;\n}';
  const after = '  className?: string;\n  slotProps?: Record<string, unknown>;\n}';
  if (!source.includes(before)) throw new Error('seed target missing');
  fs.writeFileSync(path, source.replace(before, after));
" || exit 1
npm run verify:boundaries --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic identifies `src/public/types.ts` and forbidden
public `slotProps`. A TypeScript parse failure is not sufficient.

### QA-S11 — Deterministic fixtures and repeated-load equality

| Field | Record |
|---|---|
| Description | Prove fixtures/case rendering use fixed data, no random/current-clock/network primitive, and yield identical data across independent loads. |
| Requirement | PRD R-10/R-16; QA TRD deterministic fixtures; C-03 and C-05. |
| Preconditions | Common preconditions; all fixtures/cases, catalog validator, isolation validator, and validator tests exist. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Violating fixture/case family owner; seed not rejected or equality oracle absent `BU-P1-16`. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
npm run verify:isolation --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
node --test apps/beras-ui/tests/validators.test.mjs
```

Expected: all exit `0`; forbidden determinism/network patterns have zero findings; validator
loads deterministic fixture/case data in two independent runs and deep-equal serialized values,
IDs, dates, labels, series, and seeded geometry. No validator rewrites source data.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
node --input-type=module -e "
  import fs from 'node:fs';
  const path = 'apps/beras-ui/src/fixtures/foundations.ts';
  fs.appendFileSync(path, '\nvoid Math.random();\n');
" || exit 1
npm run verify:isolation --workspace=@krasnaya/beras-ui
```

Expected: verifier exits non-zero; diagnostic identifies the fixture path and forbidden
`Math.random`. The random expression must not execute.

### QA-S12 — Tere baseline immutability

| Field | Record |
|---|---|
| Description | Prove Phase 1 has no changed file under `apps/tere-project/**` relative to the frozen baseline. |
| Requirement | PRD R-17/Gate 5; QA TRD Tere immutability; C-05. |
| Preconditions | Common preconditions; baseline commit exists locally; isolation validator exists. |
| Positive actual | `[NOT EXECUTED]` |
| Negative actual | `[NOT EXECUTED]` |
| Pass/fail | `[NOT EXECUTED]` |
| Positive artifact path | `[PENDING]` |
| Negative artifact/clone path | `[PENDING]` |
| Defect owner | Actual changed file: exact Phase 1 task that introduced it; seed not rejected by validator: `BU-P1-16`. |
| Defect handoff | ID `[PENDING]`; reproduction `[PENDING]`; expected `[PENDING]`; actual `[PENDING]`; artifact `[PENDING]`. |

Positive procedure:

```bash
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
npm run verify:isolation --workspace=@krasnaya/beras-ui
```

Expected: first command prints no bytes/path; isolation verifier exits `0`. A zero exit code from
`git diff --name-only` is insufficient when stdout is non-empty.

Seeded-negative procedure:

```bash
seed_repo || exit 1
assert_seed_repo || exit 1
printf '\n// qa-seed: intentional Tere mutation\n' >> apps/tere-project/src/app/page.tsx || exit 1
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
npm run verify:isolation --workspace=@krasnaya/beras-ui
```

Expected: diff stdout is exactly `apps/tere-project/src/app/page.tsx`; isolation verifier exits
non-zero and names that path as a Tere baseline mutation. The seeded clone is retained; canonical
Tere remains untouched.
