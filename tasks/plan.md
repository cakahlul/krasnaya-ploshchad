# Implementation Plan: Beras UI Phase 1/MVP

## Scope

Build only the private `@krasnaya/beras-ui` package and internal catalog in `apps/beras-ui`. Phase 1 must account for the frozen Tere baseline `79927540a3c27d2c29b42d84c42b7e9abcb51800`, exactly **82/82** production UI sources and **4/4** stylesheets. No task may edit `apps/tere-project/**`, add Tere runtime/business logic, implement dark/void/crimson, or start Phase 2.

Tasks are local Markdown work items. They have no Jira issue key and must not trigger a Jira Done transition.

**Stack disposition:** Backend N/A; FE-mobile N/A. Responsive 320/768/1024/1440 is FE-web + QA. No backend/mobile task is created.

## Execution protocol

- Root coordinator occupies one of four agent slots. Each wave therefore launches at most **three** executors concurrently.
- Every task in a wave launches together. Logical dependencies use the frozen contracts below or temporary local stubs; no executor waits for another implementation.
- Wave boundaries exist because only three executor slots remain. Wave 7 also owns assembled-state evidence files; this is an output/slot boundary, not permission to change another task's implementation.
- Barrier: wait for all executors in a wave, then launch all corresponding reviewers together. Commit a task only after its reviewer returns `STATUS: CLEAN`.
- Revision waves include all `STATUS: NEEDS_REVISION` tasks concurrently, then a reviewer barrier. Stop after five failed revision passes for any task.
- Contract mismatch belongs to the task that diverged from the frozen contract. Dependents that followed the contract are not rewritten to match the divergence.
- File ownership is exclusive. A task needing a change in another owner's path reports it to the coordinator; the owning task receives the revision.

## Frozen shared contracts

### C-01 — Package and entrypoints

Package identity is `@krasnaya/beras-ui`, version `0.1.0`, `private: true`, Node `>=20.9.0`. Exact export map:

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

Runtime direct dependencies are exactly `next@16.0.8`, `react@19.2.1`, and `react-dom@19.2.1`. Dev dependencies are exactly those listed in TRD section 3. No wildcard/private source export.

`./components` export names are frozen to the exact TRD section 6 list: `BrandMark`, `Button`, `IconButton`, `Badge`, `StatusBadge`, `Tag`, `Avatar`, `Card`, `MetricCard`, `StatGrid`, `ProgressMeter`, `Divider`, `CodeBlock`, `SecretField`; the 52 named SVG exports from `GoogleIcon` through `KeyIcon`; `TextField`, `TextAreaField`, `SwitchField`, `CheckboxField`, `SelectField`, `Combobox`, `SearchCombobox`, `MultiSelect`, `DateField`, `MonthField`, `DateRangeField`, `FieldGroup`, `FilterBar`, `SegmentedControl`; `Spinner`, `Skeleton`, `PageSkeleton`, `LoadingOverlay`, `LoadingIllustration`, `StateView`, `Callout`, `Toast`, `ToastViewport`, `MaintenanceState`, `AccessState`, `Dialog`, `ConfirmDialog`, `LegalContentDialog`, `Drawer`, `Popover`, `Tabs`, `Pagination`, `Breadcrumbs`, `NavList`, `AppHeader`, `AppSidebar`, `PageHeader`; `DataTable`, `AuditLogPanel`, `ActivityList`, `TaskList`, `IssueList`, `HolidayList`, `LeaveList`, `TeamMetricsTable`, `LeaveScheduleGrid`, `DefinitionList`, `InstructionSteps`, `Legend`, `DonutChart`, `BarChart`, `AreaChart`, `LineChart`, `BugTrendPanel`, `SprintTrendPanel`, `MonthCalendar`, `HolidayCalendar`, `IssueTree`, `TreeControls`, `AdfContent`, `Stat3DScene`; `MemberTasksDialog`, `MemberFormDialog`, `LeaveFormDialog`, `HolidayFormDialog`, `ConfigFormDialog`, `TicketDetailDialog`, `ApiKeyTable`, `JsonImportPanel`.

`./layouts` exports exactly `AppShell`, `AuthLayout`, `SignInView`, `SignUpView`, `DashboardOverview`, `BugMonitoringView`, `ConfigurationView`, `McpConnectionView`, `ProductivitySummaryView`, `ReportsView`, `EpicExplorerView`, `HolidayManagementView`, `TalentLeaveView`, `TeamMembersView`.

`./foundations` exports exactly `BERAS_BREAKPOINTS`, `BERAS_TOKEN_NAMES`, `berasLightTokenReference`, and semantic variant unions. `./types` exports every public prop/view-model plus the C-02 names. Root `.` re-exports all four TypeScript subpaths.

### C-02 — Shared TypeScript signatures

```ts
export interface BerasCommonProps {
  id?: string;
  className?: string;
}

export type InteractionSource = 'keyboard' | 'pointer' | 'programmatic';

export interface ChangeMeta {
  source: InteractionSource;
}

export type AsyncViewState<T> =
  | { status: 'loading'; label?: string }
  | { status: 'empty'; title: string; description?: string }
  | { status: 'error'; title: string; description?: string }
  | { status: 'ready'; data: T };

export interface BerasOption<Value extends string = string> {
  value: Value;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ActionSpec {
  id: string;
  label: string;
  disabled?: boolean;
  pending?: boolean;
}
```

Callback signatures are exactly `onValueChange(nextValue, meta)`, `onAction(actionId, meta)`, `onOpenChange(open, meta)`, and `onRetry()`. Events contain presentational identity/value only. The public type names `DataColumn`, `ChartSeries`, `CalendarDay`, `IssueTreeNode`, and typed ADF nodes are frozen names; BU-P1-01 owns their concrete structural definitions because the TRD names but does not field-specify them. Other tasks consume those definitions and may not create alternatives.

### C-03 — Manifest, registry, and stable IDs

Exact public JSON/TypeScript schemas are `CatalogCoverageTag`, `CatalogCaseManifestEntry`, `InventoryManifest`, `InventoryLedgerEntry`, and `EvidenceEntry` from FE TRD section 8, without field renames or optionality changes. In particular:

- case ID regex: `^[a-z0-9-]+/[a-z0-9-]+/[a-z0-9-]+$`;
- fixture ID: `fixture:<category>/<slug>/<name>`;
- evidence ID: `evidence:<case-id>:<check>:<viewport-or-mode>`;
- widths: only `320 | 768 | 1024 | 1440`;
- baseline: exact 40-character SHA above;
- physical inventory: 82 unique production TSX paths + 4 unique CSS paths + Tailwind/font/theme foundation inputs; unique physical manifest denominator 87 paths;
- dispositions: only `implemented`, `canonicalized into <Beras export>`, `non-visual business boundary`, `not ported: dead CSS or known defect`, `inventory-only: void/crimson`; `deferred` invalid.

Family case modules expose this exact internal registry signature:

```ts
export interface CatalogRuntimeCase {
  id: CatalogCaseManifestEntry['id'];
  fixtureId: CatalogCaseManifestEntry['fixtureId'];
  render: () => React.ReactNode;
}

export const <family>Cases: readonly CatalogRuntimeCase[];
```

Catalog case modules import components/layouts only from `@krasnaya/beras-ui` public entrypoints. BU-P1-15 owns the single `case-manifest.json` and registry aggregation; family tasks own their runtime case modules and deterministic fixtures.

### C-04 — CSS, tokens, and responsive shell

- The only shipped stylesheet entrypoint is `@krasnaya/beras-ui/styles.css` -> `src/styles/index.css` -> `tokens.css`, `base.css`, `components.css`.
- Public selectors use `.beras-*` or `data-beras-*`. Reset scope is `[data-beras-root]`. No global `button`, `table`, `dialog`, `*`, `body`, or `html` reset except token declarations in `:root`.
- Required semantic token groups and names are the exact FE TRD section 5 contract: color (`page`, `surface`, `surface-subtle`, `text`, `text-muted`, `border`, `brand`, `brand-hover`, `focus`, `overlay`), status foreground/background/border for `success|warning|danger|info|neutral`, data `--beras-data-1`…`--beras-data-8` plus grid/axis/tooltip, typography, 4px spacing/sizing, border/radius/elevation, motion, layers, and breakpoint metadata `320|768|1024|1440`.
- `className?: string` is appended once to the outermost element only. No public `style`, `styles`, `classNames`, `slotProps`, or internal-style escape hatch. Internal inline style is limited to computed geometry.
- At `>=1024`, `AppShell` is `var(--beras-sidebar-width) minmax(0, 1fr)`; below 1024 it is one column with a controlled modal drawer and `inset-inline-start: 0`; at 320 drawer is `min(18rem, 88vw)`. Dense content may own a labelled focusable overflow region; the page may not overflow.
- Space Grotesk and IBM Plex Mono weights `400/500/600/700`; light only. No dark/void/crimson selector or emitted token value.

BU-P1-03 exclusively owns all four shared CSS files. Component tasks freeze `.beras-<kebab-export-name>` root classes and `data-beras-state|tone|size|variant` attributes in their task contracts; any CSS correction is routed to BU-P1-03, preventing overlapping file edits.

### C-05 — Verification and isolation

Canonical commands from repository root:

```bash
npm ci
npm run lint --workspace=@krasnaya/beras-ui
npm run typecheck --workspace=@krasnaya/beras-ui
npm test --workspace=@krasnaya/beras-ui
npm run verify:inventory --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
npm run build --workspace=@krasnaya/beras-ui
npm run verify:evidence --workspace=@krasnaya/beras-ui
npm run beras:verify
npm run beras:build
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

The last command must print nothing. Catalog runtime permits only local document, JS, CSS, generated/local font assets, and development source maps. No Tere environment, auth, store, API, analytics, remote asset, or network fixture.

## Dependency and contract table

| Task           | Logical input             | Frozen contract used | Output consumed by               |
| -------------- | ------------------------- | -------------------- | -------------------------------- |
| BU-P1-01       | Root workspace            | C-01, C-02, C-05     | all FE tasks, consumer fixture   |
| BU-P1-02       | Frozen baseline inventory | C-03                 | catalog, validators, evidence    |
| BU-P1-03       | Baseline foundations      | C-04                 | every visual family/catalog      |
| BU-P1-04…14    | Public names/types/cases  | C-01…C-04            | catalog, validators, QA/evidence |
| BU-P1-15       | Family case modules       | C-01, C-03           | validators and evidence          |
| BU-P1-16       | All frozen contracts      | C-01…C-05            | release gate                     |
| BU-P1-17       | Required case matrix      | C-03…C-05            | final Phase 1 exit report        |
| BU-QA-P1-01…04 | TRD QA matrices           | C-01…C-05            | reviewers and BU-P1-17           |

No row requires waiting for another implementation inside its wave. Missing code is represented with a contract-compatible stub until the owning task lands. Stubs cannot survive the final gate.

## Three-slot wave schedule

| Wave | Concurrent executor 1        | Concurrent executor 2         | Concurrent executor 3                     | Barrier checkpoint                                               |
| ---: | ---------------------------- | ----------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
|    1 | BU-P1-01 workspace/contracts | BU-P1-02 inventory ledger     | BU-P1-03 foundations/CSS                  | Three executor results, then three parallel FE reviews           |
|    2 | BU-P1-04 primitives/icons    | BU-P1-06 forms/select/date    | BU-QA-P1-01 static/package cases          | All three finish, then parallel FE/QA reviews                    |
|    3 | BU-P1-05 feedback/loading    | BU-P1-07 overlays             | BU-QA-P1-02 controls/data functional plan | All three finish, then parallel FE/QA reviews                    |
|    4 | BU-P1-08 navigation/shell    | BU-P1-09 data display         | BU-P1-10 SVG charts                       | Three executor results, then three parallel FE reviews           |
|    5 | BU-P1-11 calendars           | BU-P1-12 tree + ADF           | BU-P1-13 3D + auth                        | Three executor results, then three parallel FE reviews           |
|    6 | BU-P1-14 page compositions   | BU-P1-15 catalog/docs         | BU-QA-P1-03 complex/composition plan      | All three finish, then parallel FE/QA reviews                    |
|    7 | BU-P1-16 consumer/validators | BU-P1-17 evidence integration | BU-QA-P1-04 release evidence/exit plan    | All three finish, then parallel FE/QA reviews; full Phase 1 gate |

The seven waves are a hard three-slot capacity schedule: 21 tasks / 3 available executor slots. Their numbering prioritizes high-risk native interactions and gives final evidence exclusive assembled-state output ownership; it does not encode permission for sequential dependency implementation.

## Traceability

| TRD area                                                                                            | Task               |
| --------------------------------------------------------------------------------------------------- | ------------------ |
| FE-01                                                                                               | BU-P1-01           |
| FE-02                                                                                               | BU-P1-02           |
| FE-03                                                                                               | BU-P1-03           |
| FE-04                                                                                               | BU-P1-04           |
| FE-05                                                                                               | BU-P1-06           |
| FE-06                                                                                               | BU-P1-05, BU-P1-07 |
| FE-07                                                                                               | BU-P1-05           |
| FE-08                                                                                               | BU-P1-08           |
| FE-09                                                                                               | BU-P1-09           |
| FE-10                                                                                               | BU-P1-10           |
| FE-11                                                                                               | BU-P1-11           |
| FE-12, FE-13                                                                                        | BU-P1-12           |
| FE-14                                                                                               | BU-P1-13           |
| FE-15                                                                                               | BU-P1-07, BU-P1-14 |
| FE-16                                                                                               | BU-P1-15           |
| FE-17                                                                                               | BU-P1-16           |
| FE-18                                                                                               | BU-P1-03, BU-P1-17 |
| QA-S01…QA-S12                                                                                       | BU-QA-P1-01        |
| QA-F01…QA-F08                                                                                       | BU-QA-P1-02        |
| QA-F09…QA-F15                                                                                       | BU-QA-P1-03        |
| Four viewports, keyboard/focus, contrast, motion, offline, resilience, parity evidence, exit report | BU-QA-P1-04        |

No FE or QA matrix item is deferred. Inventory closure remains exactly `82/82`, stylesheets `4/4`, unexplained `0`, deferred `0`.

## Standing Definition of Done

Every task must meet its own acceptance criteria plus:

- runtime behavior checked where the task introduces behavior; relevant new logic has a runnable check;
- lint/typecheck and scoped tests pass, with no debug/dead code or unrelated refactor;
- only owned paths changed; no `apps/tere-project/**` file changed;
- public contracts and backward compatibility match C-01…C-05;
- docs/evidence current for public behavior; security/a11y implications reviewed;
- assigned reviewer returns `STATUS: CLEAN`;
- one atomic commit uses the exact task commit message; no bulk commit.

## Risks and mitigations

| Risk                                                | Mitigation / failure rule                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| An 82-row count hides an artifact omission          | Artifact-level case/evidence graph; unexplained artifact fails BU-P1-02/16               |
| Parallel task renames a shared export/type/case     | C-01…C-04 frozen before execution; mismatch charged to diverging owner                   |
| Shared CSS creates file conflicts                   | BU-P1-03 is sole CSS owner; component tasks use fixed root/data-attribute contract       |
| Native chart/calendar/tree/3D behavior loses parity | Pure logic checks plus exhaustive QA visual+interaction evidence; screenshot alone fails |
| Evidence volume becomes partial sampling            | Case manifest drives exhaustive matrix; missing entry makes `verify:evidence` fail       |
| Tere scope leaks into Phase 1                       | Per-task read-only guard plus final baseline diff must be empty                          |

## Open questions

None. PRD/TRDs declare intent final and Phase 1 scope frozen. Any later scope ambiguity or baseline drift blocks execution for explicit reconciliation; executors must not infer a new requirement.

## Phase checkpoint

Phase 1 is complete only when all 21 tasks are CLEAN and individually committed, `npm run beras:verify` and `npm run beras:build` pass after `npm ci`, coverage reports `82/82` and `4/4`, all required evidence is present/pass, and the Tere diff command is empty. Phase 2 remains blocked until then.
