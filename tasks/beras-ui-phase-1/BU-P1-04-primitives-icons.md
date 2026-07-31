# BU-P1-04 — Primitives, actions, and named SVG icons

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 2, slot 1/3
**TRD coverage:** FE-04; R-08, R-10–R-11, R-14
**Estimated scope:** M; one coherent presentational family

## Description

Implement the finite primitive/action surface and all evidenced named icons with native semantic HTML/SVG. Preserve typed variants, accessible names, pending-action protection, deterministic cases, and outer-only `className`.

**Wave 1 compile contract:** BU-P1-01 seeds a throwing `src/components/primitives/index.ts` scaffold. This task owns that path now and must replace the scaffold completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/primitives/**`
- `/apps/beras-ui/src/catalog/cases/primitives.tsx`
- `/apps/beras-ui/src/fixtures/primitives.ts`
- `/apps/beras-ui/tests/primitives.test.mjs`

Shared CSS stays owned by BU-P1-03.

**Wave 2 revision contract:** the primitives revision may also carry the explicitly delegated
BU-P1-03 patch limited to `.beras-code-block`/`.beras-secret-field` narrow overflow rules and their
foundation regression assertion. Those shared-style paths remain a separate BU-P1-03 review/commit.

## Contract

Exact exports:

`BrandMark`, `Button`, `IconButton`, `Badge`, `StatusBadge`, `Tag`, `Avatar`, `Card`, `MetricCard`, `StatGrid`, `ProgressMeter`, `Divider`, `CodeBlock`, `SecretField`.

Named icons only: `GoogleIcon`, `SearchIcon`, `CloseIcon`, `MenuIcon`, `ChevronDownIcon`, `ChevronLeftIcon`, `ChevronRightIcon`, `ArrowRightIcon`, `CalendarIcon`, `ClockIcon`, `UserIcon`, `UsersIcon`, `UserAddIcon`, `LogoutIcon`, `LockIcon`, `EyeIcon`, `EyeOffIcon`, `CopyIcon`, `ExternalLinkIcon`, `EditIcon`, `DeleteIcon`, `AddIcon`, `RemoveIcon`, `MinusCircleIcon`, `ReloadIcon`, `SyncIcon`, `LoadingIcon`, `DownloadIcon`, `SpreadsheetIcon`, `BugIcon`, `CheckIcon`, `CheckCircleIcon`, `WarningIcon`, `ErrorIcon`, `InfoIcon`, `DatabaseIcon`, `CodeIcon`, `JsonIcon`, `LinkIcon`, `TagIcon`, `TrendUpIcon`, `ChartIcon`, `FilterIcon`, `TeamIcon`, `ExperimentIcon`, `MoreIcon`, `HomeIcon`, `ReportIcon`, `SettingsIcon`, `HolidayIcon`, `TreeIcon`, `KeyIcon`.

No string icon registry/factory or UI dependency. A private SVG wrapper may normalize only `size`, `label`, and `currentColor`. Decorative SVG is `aria-hidden="true"`; informative SVG requires `label` and renders `<title>`. `IconButton` requires visible text or `aria-label`.

All roots follow `.beras-<kebab-export>` and C-02 callbacks. Pending action emits at most once until `pending` clears.

Required mapped case IDs:

- `primitive/brand-mark/default|compact`;
- `primitive/oauth-button/default|focus|disabled|pending`;
- `primitive/export-button/disabled|default|pending|success|failure|reduced-motion`;
- `primitive/status-badge/neutral|info|success|warning|danger|long-label`;
- one `primitive/<export-slug>/default` live case for every remaining public primitive/icon export, with informative/decorative icon naming variants where applicable.

Each module exports `primitiveCases: readonly CatalogRuntimeCase[]` using C-03; fixtures are fixed literals.

## Acceptance criteria

- [ ] Every exact export exists, has a stable live case, uses only native HTML/SVG/CSS classes, and is reachable from `./components`.
- [ ] Button variants/tone/size, disabled/pending/success/failure, keyboard/pointer metadata, and repeat activation behavior are deterministic.
- [ ] Every icon is statically imported/tree-shakeable; decorative and informative naming rules pass; no emoji-only meaning or color-only status.
- [ ] `StatusBadge`, metrics, progress, secret/code content, and long labels retain semantic text and overflow safely.
- [ ] Sentinel `className` appears once on the outer root; no public raw style/internal slot prop.
- [ ] Cases import `@krasnaya/beras-ui/components`, use fixed fixture IDs, and never touch Tere/network/env.
- [ ] No Tere edits.

## Verification

```bash
node --test apps/beras-ui/tests/primitives.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser: exercise primitive cases with keyboard and reduced motion at 320 and 1440; last command empty.

## Definition of Done

All exports/cases and behavior checks pass, no inaccessible SVG/button or duplicate event, reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-04 add primitives icons (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
