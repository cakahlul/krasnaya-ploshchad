# TRD Phase 1 — Beras UI Frontend Web

## Status dan sumber

| Field | Value |
|---|---|
| Status | Draft implementable — Phase 1/MVP only |
| Product | `apps/beras-ui`, sibling workspace dari `apps/tere-project` |
| Package | `@krasnaya/beras-ui`, `private: true`, version awal `0.1.0` |
| Baseline | Tere commit `79927540a3c27d2c29b42d84c42b7e9abcb51800` |
| Requirement source | [`prd.md`](./prd.md), [`rollout-phases.md`](./rollout-phases.md) |
| Inventory contract | [`inventory-baseline.md`](./inventory-baseline.md) |
| QA contract | [`trd-phase-1-qa.md`](./trd-phase-1-qa.md) |

TRD ini hanya untuk Phase 1: membuat package dan catalog Beras lengkap tanpa mengubah file apa pun di `apps/tere-project/**`. Backend dan Frontend Mobile tidak punya deliverable pada phase ini. Phase 2 migration dan Phase 3 cleanup tidak boleh dimulai sebelum semua gate Phase 1 lulus.

## 1. Outcome dan batas sistem

Beras menjadi dua hal dalam satu workspace:

1. package presentational privat yang diekspor lewat entrypoint stabil; dan
2. aplikasi Next.js internal untuk mencari, menjalankan, dan memverifikasi semua kasus package yang sama.

```text
deterministic fixtures ──> public Beras exports ──> catalog routes
                              │
inventory manifest ──> case manifest ──> evidence manifest
                              │
                       coverage validators
```

Catalog tidak punya jalur istimewa ke implementasi privat. Catalog, fixture consumer, dan kelak Tere hanya boleh import dari `@krasnaya/beras-ui`, subpath publik, serta `@krasnaya/beras-ui/styles.css`.

### In scope

- 100% mapping 82 source, empat stylesheet, Tailwind config, font, dan theme behavior dari baseline.
- Foundations light-only, public presentational components/layouts, native interactive equivalents, deterministic fixtures, catalog, docs, validators, evidence contract.
- Workspace integration minimum: register app melalui glob workspace yang sudah ada; menambah root convenience scripts; menaikkan root Node engine ke `>=20.9.0` agar sesuai minimum Next.js 16.
- Perbaikan geometry mobile shell dilakukan di Beras saja.

### Out of scope

- Edit/import/adaptor/migration di `apps/tere-project/**`.
- API, auth, RBAC, store, query, mutation, repository, secret, atau domain orchestration Tere.
- Dark, void, crimson, Storybook, npm publication, remote docs, UI runtime library tambahan.
- Meniru API AntD/Recharts/Lucide/Framer/Three atau mempertahankan dead CSS/known defect.

## 2. Requirement traceability

| Contract area | PRD link | Completion signal |
|---|---|---|
| Workspace/package/public API | R-01, R-02, R-03 | clean consumer dan catalog import public subpaths + stylesheet; build/typecheck lulus |
| Inventory/canonicalization | R-04, R-05 | validator `82/82`, 4/4 CSS, zero unexplained, zero `deferred` |
| Foundations/customization | R-06, R-07 | semantic `--beras-*` tokens, typed variants, outer-only `className` tests |
| Native presentational surface | R-08, R-09 | live native components; no Tere runtime/prohibited dependency |
| Catalog/fixtures/docs | R-10, R-11, R-12 | each public export discoverable; mapped states/cases deterministic |
| Responsive/a11y | R-13, R-14 | evidence at 320/768/1024/1440; keyboard/focus/contrast/motion gates |
| Dependency/offline/isolation | R-15, R-16, R-17 | allowlist/boundary/offline/isolation validators lulus |

## 3. Teknologi dan dependency contract

### Runtime allowlist — exact direct dependencies

```json
{
  "next": "16.0.8",
  "react": "19.2.1",
  "react-dom": "19.2.1"
}
```

Tidak ada dependency runtime lain. Native HTML/CSS/SVG/Canvas/Web APIs menangani seluruh visual dan interaction. Peer dependency tidak dipakai karena workspace ini sekaligus runnable Next app; satu set React di-hoist oleh npm workspace.

### Dev/build allowlist — exact direct dev dependencies

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

Lockfile menentukan versi resolusi. AntD, `@ant-design/icons`, Recharts, Lucide, Framer Motion, Three ecosystem, Radix, shadcn, TanStack Table, class/style helper, chart/icon/UI package, dan remote font/runtime asset dilarang. Test logic memakai `node:test`; browser evidence memakai browser nyata/Chrome DevTools, jadi Playwright/Storybook/Vitest tidak ditambah.

### Platform

- Root `engines.node` dan Beras `engines.node`: `>=20.9.0`. Ini minimum resmi Next.js 16; nilai root `>=18` saat baseline tidak cukup.
- npm `10.9.2`, mengikuti root `packageManager`.
- Next 16 memakai Turbopack default dan lint dijalankan eksplisit sebagai `eslint .`, bukan `next lint`.
- `next.config.ts`: `transpilePackages: ['@krasnaya/beras-ui']` supaya self-consumption TS source melewati pipeline Next yang sama dengan consumer workspace.
- Tailwind v3 content: `{ relative: true, files: ['./src/**/*.{ts,tsx,mdx}'] }`; tidak scan `apps/tere-project` atau seluruh monorepo.

## 4. Struktur package dan ownership

```text
apps/beras-ui/
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
├── src/
│   ├── app/                         # catalog/docs routes only
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # redirect /catalog
│   │   ├── catalog/page.tsx
│   │   ├── catalog/[category]/[slug]/page.tsx
│   │   ├── inventory/page.tsx
│   │   └── docs/{getting-started,customization,accessibility,boundaries}/page.tsx
│   ├── public/                      # only JS/TS package entrypoint implementation
│   │   ├── index.ts
│   │   ├── components.ts
│   │   ├── layouts.ts
│   │   ├── foundations.ts
│   │   └── types.ts
│   ├── components/                  # presentational implementation by family
│   ├── layouts/                     # responsive shell and page compositions
│   ├── foundations/                 # token metadata and public variant types
│   ├── styles/                      # shipped plain prefixed CSS
│   │   ├── index.css
│   │   ├── tokens.css
│   │   ├── base.css
│   │   └── components.css
│   ├── catalog/                     # registry, navigation, search, case presenters
│   ├── fixtures/                    # deterministic local data only
│   ├── inventory/                   # manifest/ledger/case/evidence schemas + JSON data
│   └── internal/                    # non-public helpers; never imported by catalog routes
├── scripts/
│   ├── verify-inventory.mjs
│   ├── verify-catalog.mjs
│   ├── verify-boundaries.mjs
│   ├── verify-isolation.mjs
│   └── verify-evidence.mjs
├── tests/
│   ├── consumer/consumer.tsx
│   └── *.test.mjs
└── evidence/phase-1/
    ├── evidence-manifest.json
    └── screenshots/
```

Public components use prefixed authored CSS from `styles.css`; catalog-only layout may use Tailwind utilities. Consumer tidak perlu menambah Beras source ke Tailwind `content`, dan style package tidak bergantung pada consumer class generation. CSS internal tetap empat file sederhana, bukan CSS-in-JS atau per-component framework.

### Package export map

```json
{
  "name": "@krasnaya/beras-ui",
  "version": "0.1.0",
  "private": true,
  "sideEffects": ["./src/styles/index.css"],
  "exports": {
    ".": "./src/public/index.ts",
    "./components": "./src/public/components.ts",
    "./layouts": "./src/public/layouts.ts",
    "./foundations": "./src/public/foundations.ts",
    "./types": "./src/public/types.ts",
    "./styles.css": "./src/styles/index.css"
  }
}
```

`src/public/index.ts` re-export convenience surface yang sama; subpaths memberi boundary eksplisit dan tree-shaking. Tidak ada wildcard export. Consumer fixture wajib mengimpor minimal satu export dari tiap category melalui map di atas dan mengimpor stylesheet satu kali.

## 5. Foundations dan stylesheet contract

`src/styles/index.css` hanya mengimpor `tokens.css`, `base.css`, dan `components.css`. Semua selector public memakai prefix `.beras-` atau attribute `data-beras-*`; reset dibatasi ke `[data-beras-root]`. Tidak boleh ada global `button`, `table`, `dialog`, `*`, `body`, atau `html` reset selain token declarations di `:root`.

### Token groups

| Group | Required semantic tokens |
|---|---|
| Color | `--beras-color-page`, `surface`, `surface-subtle`, `text`, `text-muted`, `border`, `brand`, `brand-hover`, `focus`, `overlay` |
| Status | `success`, `warning`, `danger`, `info`, `neutral`, masing-masing foreground/background/border; chart meaning selalu label/shape juga |
| Data visualization | ordered `--beras-data-1`…`--beras-data-8`, grid, axis, tooltip |
| Typography | Space Grotesk sans + IBM Plex Mono mono; size/line-height/weight 400/500/600/700 |
| Spacing/sizing | 4px base scale, control heights, content/max widths, sidebar/topbar dimensions |
| Border/radius/elevation | border widths, radius sm/md/lg/full, shadow sm/md/lg/overlay |
| Motion | duration fast/base/slow, standard/emphasized easing; reduced-motion duration `1ms` and no parallax/loop |
| Layer | base, sticky, dropdown, drawer, dialog, toast |
| Breakpoint metadata | `320`, `768`, `1024`, `1440`; CSS media boundaries documented in foundations export |

Light values consolidate the intended Tere baseline: navy `#011d4d`, secondary `#034078`, accent `#1282a2`, accent-light `#22b8d4`, page `#f2f4f9`, surface `#ffffff`, and evidenced status/data colors. Exact contrast-adjusted values are frozen only after QA measurement; any adjustment is recorded as intentional accessibility consolidation. Void/crimson values appear only in inventory records, never emitted in shipped CSS. Dark selectors are not emitted.

Fonts use `next/font/google` at catalog build time with exact families/weights from baseline and expose `--beras-font-sans` / `--beras-font-mono`. Catalog build must not fetch fonts at runtime; browser network-offline evidence must show no request after build. Public CSS includes system fallbacks so a non-Next consumer remains readable.

### Customization boundary

- Supported: semantic `--beras-*` override on a consumer-owned outer scope; typed `variant`, `size`, `tone`, and behavior props documented per export.
- `className?: string` is appended to the single outermost rendered element only, after the package outer class. It is for consumer layout (`margin`, `grid-area`, width placement), not internal slot styling.
- Not supported: `style`, `styles`, `classNames`, `slotProps`, arbitrary color/padding props, CSS selector contracts for internal descendants.
- Dynamic inline style is internal-only for data geometry (SVG coordinates, Canvas size, progress percentage) and never accepts raw consumer CSS.

## 6. Public TypeScript contracts

### Common contracts

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

Callback bentuk baku: `onValueChange(nextValue, meta)`, `onAction(actionId, meta)`, `onOpenChange(open, meta)`, `onRetry()`. Events membawa presentational identity/value saja; tidak membawa endpoint, mutation object, router, permission evaluator, atau store.

`AsyncViewState<T>` dipakai data-bearing surface agar loading/empty/error/ready eksplisit dan fixture lengkap. Form field error tetap prop terpisah (`error?: string`) karena validation bukan fetch state.

### Family contracts

| Family | Canonical exports/compositions | Required typed differences |
|---|---|---|
| Primitives | `Button`, `IconButton`, named SVG icon exports, `Badge`, `Tag`, `Avatar`, `Card`, `MetricCard`, `Divider` | `variant`, `tone`, `size`, disabled/pending; accessible name rules |
| Forms | `TextField`, `TextAreaField`, `SwitchField`, `CheckboxField`, `SelectField`, `Combobox`, `MultiSelect`, `DateField`, `MonthField`, `DateRangeField`, `FieldGroup` | label/helper/error/required/readOnly; controlled value/events; simple cases use native controls |
| Feedback | `Spinner`, `Skeleton`, `LoadingScene`, `StateView`, `Toast`, `InlineAlert`, `MaintenancePanel`, `PermissionPanel` | status/tone/action, live-region policy, deterministic reduced motion |
| Overlay | `Dialog`, `ConfirmDialog`, `LegalDialog`, `Drawer`, `Popover` | controlled open/close, labelled title/description, initial focus, close reason |
| Navigation | `AppShell`, `SidebarNav`, `Topbar`, `Tabs`, `SegmentedControl`, `Pagination`, `Breadcrumbs` | active item, mobile drawer state, long labels, keyboard |
| Data display | `DataTable`, `KeyValueCard`, `ActivityList`, `MemberList`, `TaskList`, `StatGrid`, `ProgressMeter` | typed rows/columns, sort/select/page, dense/wide overflow |
| Visualization | `LineChart`, `AreaChart`, `BarChart`, `DonutChart`, `TrendChart`, `Legend`, `Stat3DScene` | series/axes/labels; accessible data equivalent; no static substitute |
| Calendar/date | `MonthCalendar`, `RangeCalendar`, `LeaveCalendar`, `HolidayCalendar` | selected/range/boundary/dense/holiday states and keyboard navigation |
| Tree/content | `HierarchyTree`, `TreeControls`, `AdfContent` | expanded/selected/load-more; safe link/mark/node policy |
| Compositions | auth screen, dashboard, productivity/reports, bug monitor, configuration, MCP setup, epic explorer, holiday management, talent leave, team members | local presentational view models and events only |

### Exact Phase 1 export surface

`./components` exports only these evidenced families:

- primitives/data atoms: `BrandMark`, `Button`, `IconButton`, `Badge`, `StatusBadge`, `Tag`, `Avatar`, `Card`, `MetricCard`, `StatGrid`, `ProgressMeter`, `Divider`, `CodeBlock`, `SecretField`;
- named icons: `GoogleIcon`, `SearchIcon`, `CloseIcon`, `MenuIcon`, `ChevronDownIcon`, `ChevronLeftIcon`, `ChevronRightIcon`, `ArrowRightIcon`, `CalendarIcon`, `ClockIcon`, `UserIcon`, `UsersIcon`, `UserAddIcon`, `LogoutIcon`, `LockIcon`, `EyeIcon`, `EyeOffIcon`, `CopyIcon`, `ExternalLinkIcon`, `EditIcon`, `DeleteIcon`, `AddIcon`, `RemoveIcon`, `MinusCircleIcon`, `ReloadIcon`, `SyncIcon`, `LoadingIcon`, `DownloadIcon`, `SpreadsheetIcon`, `BugIcon`, `CheckIcon`, `CheckCircleIcon`, `WarningIcon`, `ErrorIcon`, `InfoIcon`, `DatabaseIcon`, `CodeIcon`, `JsonIcon`, `LinkIcon`, `TagIcon`, `TrendUpIcon`, `ChartIcon`, `FilterIcon`, `TeamIcon`, `ExperimentIcon`, `MoreIcon`, `HomeIcon`, `ReportIcon`, `SettingsIcon`, `HolidayIcon`, `TreeIcon`, `KeyIcon`;
- forms/selection: `TextField`, `TextAreaField`, `SwitchField`, `CheckboxField`, `SelectField`, `Combobox`, `SearchCombobox`, `MultiSelect`, `DateField`, `MonthField`, `DateRangeField`, `FieldGroup`, `FilterBar`, `SegmentedControl`;
- feedback/overlay/navigation: `Spinner`, `Skeleton`, `PageSkeleton`, `LoadingOverlay`, `LoadingIllustration`, `StateView`, `Callout`, `Toast`, `ToastViewport`, `MaintenanceState`, `AccessState`, `Dialog`, `ConfirmDialog`, `LegalContentDialog`, `Drawer`, `Popover`, `Tabs`, `Pagination`, `Breadcrumbs`, `NavList`, `AppHeader`, `AppSidebar`, `PageHeader`;
- data/visual/content: `DataTable`, `AuditLogPanel`, `ActivityList`, `TaskList`, `IssueList`, `HolidayList`, `LeaveList`, `TeamMetricsTable`, `LeaveScheduleGrid`, `DefinitionList`, `InstructionSteps`, `Legend`, `DonutChart`, `BarChart`, `AreaChart`, `LineChart`, `BugTrendPanel`, `SprintTrendPanel`, `MonthCalendar`, `HolidayCalendar`, `IssueTree`, `TreeControls`, `AdfContent`, `Stat3DScene`;
- specialized presentational overlays/panels: `MemberTasksDialog`, `MemberFormDialog`, `LeaveFormDialog`, `HolidayFormDialog`, `ConfigFormDialog`, `TicketDetailDialog`, `ApiKeyTable`, `JsonImportPanel`.

`./layouts` exports `AppShell`, `AuthLayout`, `SignInView`, `SignUpView`, `DashboardOverview`, `BugMonitoringView`, `ConfigurationView`, `McpConnectionView`, `ProductivitySummaryView`, `ReportsView`, `EpicExplorerView`, `HolidayManagementView`, `TalentLeaveView`, and `TeamMembersView`.

`./foundations` exports `BERAS_BREAKPOINTS`, `BERAS_TOKEN_NAMES`, `berasLightTokenReference`, and the semantic variant unions. `./types` exports all public prop/view-model contracts, `BerasCommonProps`, `ChangeMeta`, `AsyncViewState`, `BerasOption`, `ActionSpec`, `DataColumn`, `ChartSeries`, `CalendarDay`, `IssueTreeNode`, and typed ADF nodes. Root `.` re-exports all four TS subpaths for convenience.

These names are the parallel-execution contract. A task may prove two proposed exports equivalent and collapse one only before executor wave, with ledger/case/task contracts updated together. After freeze, removing/renaming an export requires ledger, case IDs, fixtures, docs, consumer fixture, and evidence updates in the same reviewed task.

## 7. Native implementation strategies

### Icon

Finite named inline-SVG exports (`SearchIcon`, `CloseIcon`, `CalendarIcon`, dan set inventory lainnya), no icon package and no runtime string registry/factory. A tiny private SVG wrapper normalizes `size`, `label`, and `currentColor`; every glyph remains statically imported/tree-shakeable. Decorative icon: `aria-hidden="true"`, no title. Informative standalone icon: caller supplies `label`, rendered as `<title>` and accessible name. `IconButton` always requires `aria-label` or visible label. Emoji present in baseline is replaced by the closest SVG only where meaning/style must be consistent; retained emoji has adjacent text and is hidden from AT.

### Charts

SVG handles line/area/bar/donut charts. Pure functions compute scales, ticks, paths, and hit regions; `node:test` covers zero/single/multi, negative/flat values, long labels, missing points. Each chart renders:

- labelled `<figure>` plus summary;
- visible legend with line/marker shape as well as color;
- focusable data-point controls only when interaction exists;
- a semantic table/list equivalent reachable next to the SVG;
- deterministic tooltip content on focus and pointer hover.

Empty state renders `StateView`; no zero-dimension fake chart. Narrow widths use responsive SVG and horizontal operability only when labels cannot fit.

### Tables

Native `<table>` with typed `DataColumn<Row>`. Sort is controlled and header uses a `<button>` with `aria-sort` on `<th>`. Selection uses labelled checkboxes. Pagination is controlled. Wide tables live in a focusable labelled overflow region; sticky columns only when explicitly selected by a composition. No DOM virtualization in Phase 1 because inventory only requires large visible-set fixture, not unbounded data.

### Calendar and date controls

Simple date/month entry uses `<input type="date">` / `<input type="month">`. Range entry composes two date inputs plus presets. Visual month/calendar grids use native buttons with roving focus: Arrow keys move day, Home/End move week boundary, PageUp/PageDown change month, Enter/Space select. Date math is pure ISO `YYYY-MM-DD` helpers with explicit local-calendar semantics; no `dayjs`. Dense leave calendars use a semantic table in a labelled horizontal overflow region and expose edit actions as buttons.

### Tree

`HierarchyTree` follows `role="tree"`, `treeitem`, `group`, `aria-level`, `aria-expanded`, `aria-selected`, one roving `tabIndex=0`. Arrow Right expands/enters, Arrow Left collapses/parents, Up/Down move visible items, Home/End jump, Enter/Space activates/selects. `Load more` remains a normal named button and never auto-fetches in catalog.

### Dialog, drawer, popover

Dialog/confirm/legal use native `<dialog>` and `showModal()`. Escape/cancel maps to typed close reason; focus starts at explicit `initialFocusRef` or first control and returns to invoker. Backdrop click behavior is explicit per variant. Drawer/popover use normal DOM with focus management only when modal; escape/outside close is tested. At 320px dialog uses bounded viewport height and internal scroll so actions remain visible.

### Select

Simple single choice stays native `<select>`. Searchable/multi choice uses a button + listbox contract: labelled trigger, `aria-expanded/controls`, active descendant, Arrow/Home/End, Enter/Space, Escape, type/search input, clear, disabled options, long-label truncation with full accessible name. Multiselect keeps selected values explicit and uses checkboxes/listbox semantics without nested interactive controls.

### ADF

`AdfContent` recursively renders supported ADF document, paragraph, heading, text marks, bullet/ordered list, list item, blockquote, code block, rule, table, link, and panel nodes to React elements. Unknown nodes render safe child content or a labelled unsupported block; they never throw away the full document. Links allow only `https:`, `http:`, and `mailto:`; external links get `rel="noopener noreferrer"`. `dangerouslySetInnerHTML` is forbidden.

### `Stat3DScene`

Native semantic DOM + CSS 3D preserves perspective, raised statistic bars, grid/depth, sparkles, pointer parallax, hover/focus detail, and responsive scaling. Each bar is a named focusable element backed by visible label/value text, so the visual is its own accessible equivalent rather than a duplicate Canvas tree. Pointer position only updates scoped CSS custom properties; no render loop or hit-testing engine. Seeded fixture positions replace randomness. With `prefers-reduced-motion: reduce`, transitions/sparkles/parallax freeze while all values/actions remain visible. Canvas is unnecessary unless implementation evidence proves a missing inventory behavior; if added, it is decorative only and the semantic DOM remains authoritative.

### Loading/animation

Loading scene uses inline SVG/CSS and deterministic characters/stages from baseline; no remote images. Repeated action while `pending` is ignored at component level. All loop/parallax/transform-heavy effects stop or collapse under reduced motion; state meaning remains visible in text.

## 8. Catalog, fixture, manifest, dan evidence contracts

### Stable identifiers

- Export name: PascalCase and unique across public surface.
- Slug: lowercase kebab-case.
- Case ID: `<category>/<slug>/<state-or-variant>`, regex `^[a-z0-9-]+/[a-z0-9-]+/[a-z0-9-]+$`; immutable after Phase 1 unless documented breaking change.
- Fixture ID: `fixture:<category>/<slug>/<name>`.
- Evidence ID: `evidence:<case-id>:<check>:<viewport-or-mode>`.

### Machine-readable schemas

```ts
export type CatalogCoverageTag =
  | 'default' | 'loading' | 'empty' | 'error' | 'populated'
  | 'disabled' | 'validation' | 'focus' | 'overflow'
  | 'selection' | 'expanded' | 'pending' | 'success'
  | 'failure' | 'reduced-motion';

export interface CatalogCaseManifestEntry {
  id: `${string}/${string}/${string}`;
  category: string;
  slug: string;
  title: string;
  exportNames: string[];
  fixtureId: `fixture:${string}`;
  sourcePaths: string[];
  variant: string; // exact third segment of id; kebab-case
  coverage: CatalogCoverageTag[];
  widths: Array<320 | 768 | 1024 | 1440>;
  docsHref: string;
  interactive: boolean;
}

export interface InventoryManifest {
  schemaVersion: 1;
  baselineCommit: '79927540a3c27d2c29b42d84c42b7e9abcb51800';
  productionSources: string[];
  stylesheets: string[];
  foundationInputs: string[];
}

export interface InventoryLedgerEntry {
  sourcePath: string;
  currentDependencies: string[];
  removedRuntimeCoupling: string[];
  responsiveConcerns: string[];
  accessibilityConcerns: string[];
  artifacts: Array<{
    id: string;
    description: string;
    disposition:
      | 'implemented'
      | `canonicalized into ${string}`
      | 'non-visual business boundary'
      | 'not ported: dead CSS or known defect'
      | 'inventory-only: void/crimson';
    canonicalExports: string[];
    caseIds: string[];
    requiredStates: string[];
    rationale: string;
    evidenceIds: string[];
  }>;
}

export interface EvidenceEntry {
  id: string;
  caseId: string;
  check: 'visual' | 'responsive' | 'keyboard' | 'focus' | 'contrast' | 'motion' | 'offline';
  viewport?: 320 | 768 | 1024 | 1440;
  artifactPath: string;
  result: 'pass' | 'fail';
  note?: string;
}
```

`inventory-manifest.json`, `inventory-ledger.json`, `case-manifest.json`, dan `evidence-manifest.json` are stable JSON so Node validators need no TS runner. Runtime `catalog/registry.tsx` maps each manifest ID to a render function and imports public Beras entrypoints only. Fixtures are typed TS data; no Date-now/random/network dependence. Dates, identities, and values are fixed literals.

### Coverage invariants

`verify-inventory.mjs` fails unless:

- baseline commit exact; production list exactly equals normative 82 unique paths; stylesheet list exactly 4; required foundation inputs present;
- ledger has one and only one row per source, allowed disposition only, non-empty artifacts/rationale/case/evidence links where visual;
- every ledger `caseId` exists; every case has fixture/docs/runtime renderer; every evidence ID resolves;
- every public component/layout export has at least one case and every case uses public imports;
- every data-bearing case family contains loading/empty/error/populated; mapped extra states are present;
- report prints exact `82/82`, `4/4`, `unexplained=0`, `deferred=0`.

### Catalog routes and discovery

| Route | Contract |
|---|---|
| `/` | server redirect to `/catalog` |
| `/catalog` | grouped export/case index, coverage summary, local search |
| `/catalog/[category]/[slug]` | live cases, props/events, import, composition, tokens, states, responsive/a11y notes, source mappings |
| `/inventory` | read-only ledger filters and case/evidence links |
| `/docs/getting-started` | install/import/style/build usage |
| `/docs/customization` | tokens, typed variants, outer-only `className` |
| `/docs/accessibility` | keyboard, focus, contrast, motion, visual equivalents |
| `/docs/boundaries` | package boundary and Tere business/runtime exclusions |

Navigation and search are generated from `case-manifest.json`, never duplicated by hand. Search is local, case-insensitive, and matches title, export, category, case ID, and Tere source basename; query persists in `?q=`. All routes render with network blocked.

### Catalog self-consumption rule

ESLint restricted imports + `verify-boundaries.mjs` reject catalog/fixture imports matching `../components`, `../layouts`, `/internal/`, or `apps/tere-project`. Allowed catalog imports are package subpaths, catalog-local helpers, JSON manifests, and fixture data. Consumer compile fixture imports every export category and stylesheet via package map only.

## 9. Responsive dan accessibility contracts

### Responsive shell

- `>=1024`: CSS grid columns `var(--beras-sidebar-width) minmax(0, 1fr)`; topbar belongs to content column; no duplicated fixed `left` math.
- `<1024`: one content column, sidebar becomes controlled modal drawer, main/topbar `inset-inline-start: 0`, page uses `min-width: 0`.
- `320`: drawer max width `min(18rem, 88vw)`; primary action wraps/stacks; dialog/footer remains visible; no page-level horizontal scroll.
- Dense table/calendar/tree/chart may own a labelled horizontal scroll region. This is not page-shell overflow.

### Accessibility minimum

- Landmark/heading order, labels/names, native elements first, logical DOM/focus order.
- `:focus-visible` ring uses `--beras-color-focus`, not removed by hover/variant CSS.
- Keyboard patterns defined in section 7 are acceptance behavior.
- Normal text >=4.5:1; large text and essential UI/focus >=3:1. Status/chart meaning has text/shape/pattern, not color only.
- Toast uses `role=status` for success/info and `role=alert` only for urgent error; close control named.
- Loading updates use `aria-busy`; skeleton decorative regions hidden.
- Reduced motion is a first-class case and OS-media behavior, not a catalog toggle only.

## 10. Commands dan gates

### Package scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "node --test tests/*.test.mjs",
  "verify:inventory": "node scripts/verify-inventory.mjs",
  "verify:catalog": "node scripts/verify-catalog.mjs",
  "verify:boundaries": "node scripts/verify-boundaries.mjs",
  "verify:isolation": "node scripts/verify-isolation.mjs",
  "verify:evidence": "node scripts/verify-evidence.mjs",
  "verify": "npm run lint && npm run typecheck && npm test && npm run verify:inventory && npm run verify:catalog && npm run verify:boundaries && npm run verify:isolation && npm run verify:evidence && npm run build"
}
```

Root convenience scripts: `beras:dev`, `beras:build`, `beras:verify`, each using `--workspace=@krasnaya/beras-ui`. Existing root default Tere scripts remain unchanged except Node engine compatibility.

### Exact operator commands

```bash
# clean install, repo root, Node >=20.9.0
npm ci

# run catalog
npm run beras:dev

# individual checks
npm run lint --workspace=@krasnaya/beras-ui
npm run typecheck --workspace=@krasnaya/beras-ui
npm test --workspace=@krasnaya/beras-ui
npm run verify:inventory --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
npm run verify:evidence --workspace=@krasnaya/beras-ui

# full gate/build
npm run beras:verify
npm run beras:build
```

Browser evidence is produced using the QA procedure, saved under `evidence/phase-1`, then `verify:evidence` validates matrix completeness and pass status. Build alone cannot claim visual/a11y parity.

## 11. Stack delivery breakdown

### Backend

N/A. Phase 1 has no API, persistence, auth, or service change. Deterministic fixture data is frontend test/catalog data, not a backend.

### Frontend Web

Each item below is task-breaker-ready: small ownership, explicit dependency contract, linked requirement, and done boundary. Independent rows should execute in parallel after contracts/public names are frozen.

| ID | Build | Why | Done when |
|---|---|---|---|
| FE-01 | Workspace/config/package exports/root Node+scripts | R-01–R-03, R-15 | clean install; exact dependency allowlist; public/self imports resolve; no Tere edit |
| FE-02 | Inventory JSON schemas, frozen manifest, 82-row machine ledger seed | R-04, Gate 1 | exact baseline/path counts; schema tests; preliminary ledger mirrors inventory document |
| FE-03 | Light tokens, fonts, base/exported stylesheet, foundation metadata | R-06–R-07 | token groups/docs/cases present; no dark/void/crimson output; CSS scoped/prefixed |
| FE-04 | `Icon` registry + primitive display/actions | R-08, R-14 | mapped icons/buttons/cards/badges/tags live; name/focus tests |
| FE-05 | Native form fields, select/multiselect, date/month/range controls | R-08, R-11, R-14 | controlled contracts; keyboard/validation/disabled/long-option cases |
| FE-06 | Dialog/confirm/legal, drawer/popover, toast/alerts | R-08, R-11, R-14 | escape/focus return/overflow/live-region/reduced-motion cases |
| FE-07 | Loading/skeleton/state/maintenance/permission feedback | R-08, R-11 | deterministic loading scene; loading/empty/error/success/failure cases |
| FE-08 | Navigation primitives and corrected `AppShell` | R-08, R-13 | active/long/mobile open/closed; no 320 fixed-offset defect |
| FE-09 | Native `DataTable`, lists, metric/stat/progress compositions | R-08, R-11 | sort/select/page/empty/error/loading/wide overflow cases |
| FE-10 | Native SVG chart family and accessible equivalent | R-08, R-14 | line/area/bar/donut/trend, empty/single/multi/long-label, table equivalents |
| FE-11 | Native calendars and leave/holiday dense compositions | R-08, R-13–R-14 | date/range/month + grid/table keyboard/boundary/dense/320 cases |
| FE-12 | Native hierarchy tree/control/detail composition | R-08, R-14 | empty/deep/collapsed/expanded/selected/load-more + roving keyboard |
| FE-13 | Safe `AdfContent` | R-08–R-09, R-14 | supported/unknown/empty/overflow/safe-link cases; no raw HTML |
| FE-14 | Native DOM/CSS `Stat3DScene` + auth/marketing compositions | R-08, R-14 | live depth/parallax/hover/focus; semantic values; seeded/reduced-motion cases |
| FE-15 | Dashboard/report/bug/config/MCP/epic/holiday/leave/member page compositions | R-04–R-12 | every mapped page artifact reachable using fixtures/events only |
| FE-16 | Catalog shell, dynamic pages, generated nav/search, docs routes | R-03, R-10–R-12 | all exports/cases discoverable; imports public paths only; local search works |
| FE-17 | Consumer fixture and Node validators | Gate 1–3, 5 | allowlist/boundary/isolation/catalog/82-by-82/className checks fail on seeded violations |
| FE-18 | Responsive/a11y polish and evidence integration | R-13–R-14, Gate 4 | QA matrix complete at four widths; evidence validator passes |

### Frontend Mobile

N/A. `apps/beras-ui` is web-only. “Mobile” here means responsive web viewports, owned by FE Web + QA, not Android/iOS code.

### QA

Implement and execute [`trd-phase-1-qa.md`](./trd-phase-1-qa.md). QA artifacts are test cases, evidence manifest, screenshots/notes, and pass/fail reports; QA must not introduce product behavior.

## 12. Parallel dependency contracts

Before executor wave, FE-01/FE-02 freeze these interfaces in task files: package name/export map, common types, export names, case/fixture/evidence IDs and JSON schemas, token names, CSS entrypoint, and catalog registry signature. Then FE-03…FE-15 run in parallel against those contracts. Stubs/fixtures are allowed locally; no executor silently renames a shared contract.

FE-16 consumes only public exports and frozen manifests. FE-17 validators can be built in parallel from schemas. FE-18 begins after all implementation executors in its wave finish, per barrier rule. Contract mismatch is an issue on the task that diverged from the frozen interface, not on dependent tasks that followed it.

## 13. Risks dan mitigations

| Risk | Mitigation / failure rule |
|---|---|
| 100% coverage hides artifact omission | artifact arrays + stable cases/evidence, not path count alone; unexplained fails |
| Native complex widgets regress behavior | small family contracts, pure logic tests, real keyboard/browser evidence |
| Canonicalization erases meaningful variants | inventory rationale + explicit typed variant/state cases |
| Catalog cheats via private implementation import | package self-import, ESLint restriction, static validator |
| CSS leaks into consumer | prefix/scoped reset, one exported stylesheet, consumer fixture |
| CSS-3D/SVG inaccessible | semantic focusable DOM or table equivalent and non-color labels |
| Responsive shell repeats Tere defect | grid/drawer contract; 320 page-overflow assertion and screenshot |
| Baseline drifts | exact commit/path manifest; drift fails rather than mutating denominator |
| Phase 1 pulls business logic | fixture/boundary scan; no Tere/env/network imports/calls |

## 14. Definition of done

Phase 1 FE Web is complete only when:

1. all FE tasks reviewed `STATUS: CLEAN` and committed per task;
2. full `npm run beras:verify` and `npm run beras:build` pass after `npm ci` on Node >=20.9;
3. coverage prints `82/82`, CSS `4/4`, zero unexplained, zero deferred;
4. catalog/consumer use only public entrypoints and exported stylesheet;
5. all native complex interactive cases have functional + visual evidence;
6. four-viewport, keyboard/focus, contrast, reduced-motion, console/network-offline matrix passes;
7. `git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project` is empty.

## 15. Authoritative technical references

- [Next.js `transpilePackages`](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [Next.js 16 upgrade guide and platform minimums](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Tailwind CSS v3 content configuration](https://v3.tailwindcss.com/docs/content-configuration)
- [WAI-ARIA Authoring Practices patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [MDN `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
