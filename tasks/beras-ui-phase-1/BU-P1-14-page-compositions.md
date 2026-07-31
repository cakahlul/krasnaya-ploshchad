# BU-P1-14 — Fixture-driven page compositions

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 6, slot 1/3
**TRD coverage:** FE-15; R-04–R-12; app/page/layout and feature artifact coverage
**Estimated scope:** M; composition-only slice

## Description

Compose the canonical family exports into all remaining Tere page-level presentational views. Use typed view models/events and deterministic fixtures only; no API/auth/RBAC/store/router/repository/domain orchestration.

**Wave 1 compile contract:** BU-P1-01 seeds a throwing `src/layouts/compositions/index.ts` scaffold. This task owns that path now and must replace the scaffold completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/layouts/compositions/**`
- `/apps/beras-ui/src/catalog/cases/compositions.tsx`
- `/apps/beras-ui/src/fixtures/compositions.ts`
- `/apps/beras-ui/tests/compositions.test.mjs`

Auth layouts belong to BU-P1-13; shell to BU-P1-08; CSS to BU-P1-03.

## Contract

Exact layout exports owned: `DashboardOverview`, `BugMonitoringView`, `ConfigurationView`, `McpConnectionView`, `ProductivitySummaryView`, `ReportsView`, `EpicExplorerView`, `HolidayManagementView`, `TalentLeaveView`, `TeamMembersView`.

Each view accepts a typed local view model containing ready-to-display values and `AsyncViewState` where data-bearing. Events are only C-02 `onValueChange`, `onAction`, `onOpenChange`, `onRetry`; no endpoint, mutation, permission evaluator, router, Jira category, export/window, time/date aggregation, or clipboard implementation.

Required cases:

- `composition/dashboard-overview/loading|empty|error|populated|overflow`;
- `composition/bug-monitoring/loading|empty|error|populated`;
- `composition/configuration/loading|error|populated`;
- `composition/target-wp-config/loading|empty|error|populated|create|edit|validation|confirm|pending`;
- `composition/wp-weight-config/loading|empty|error|populated|create|edit|validation|confirm|pending`;
- `composition/mcp-connection/loading|empty|error|populated|create-open|secret-open`;
- `composition/productivity-summary/loading|empty|error|populated|filtered|overflow`;
- `composition/reports/loading|empty|error|populated|overflow`;
- `composition/epic-explorer/loading|empty|error|populated`;
- `composition/holiday-management/loading|empty|error|populated|dialog-open|success|failure`;
- `composition/talent-leave/loading|empty|error|list|calendar|dialog-open|success|failure`;
- `composition/team-members/loading|empty|error|populated|create|edit|confirm|dialog-open|overflow`.

The expanded case set may unify duplicate source states but cannot drop a state. Export `compositionCases: readonly CatalogRuntimeCase[]`. Every case maps all relevant ledger source rows and uses only public package imports.

## Acceptance criteria

- [ ] Every exact layout export is live/discoverable and composes public family components; no copied private implementation or privileged import.
- [ ] Every data-bearing view has loading/empty/error/populated; all listed dialog/filter/overflow/success/failure states are deterministic.
- [ ] All app/page/layout artifacts rows 1–11 and relevant feature rows 30–80 map to reachable composition/family cases; redirect-only rows retain non-visual ledger rationale.
- [ ] Callbacks emit only presentational IDs/values and `ChangeMeta`; fixtures contain no Tere types/services/env/network/current clock/random.
- [ ] Dense actions/headers reflow at 320 and layouts remain usable at 768/1024/1440.
- [ ] No product behavior duplicated and no Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/compositions.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser smoke every composition loading/error/primary-ready route at 320 and 1440; last command empty.

## Definition of Done

Every exact composition/state is reachable, fixture-only, responsive, and mapped; reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-14 add page compositions (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
