# BU-P1-09 — Data tables, lists, metrics, and dense display

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 4, slot 2/3
**TRD coverage:** FE-09; R-08, R-10–R-11, R-13–R-14
**Estimated scope:** M

## Description

Implement the controlled native table/list/stat display family and canonical audit/issue/team compositions. Domain calculations and data shaping stay with consumers; fixtures supply ready-to-display values.

**Wave 1 compile contract:** BU-P1-01 seeds a throwing `src/components/data-display/index.ts` scaffold. This task owns that path now and must replace the scaffold completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/data-display/**` except `LeaveScheduleGrid` (BU-P1-11)
- `/apps/beras-ui/src/catalog/cases/data-display.tsx`
- `/apps/beras-ui/src/fixtures/data-display.ts`
- `/apps/beras-ui/tests/data-display.test.mjs`

BU-P1-03 owns CSS; BU-P1-07 owns dialogs used by cases.

## Contract

Exact exports owned here: `DataTable`, `AuditLogPanel`, `ActivityList`, `TaskList`, `IssueList`, `HolidayList`, `LeaveList`, `TeamMetricsTable`, `DefinitionList`, `InstructionSteps`. `MetricCard`, `StatGrid`, and `ProgressMeter` are owned by BU-P1-04; `LeaveScheduleGrid` by BU-P1-11.

`DataTable<Row>` consumes public `DataColumn<Row>`, controlled sort/selection/page callbacks with `ChangeMeta`, and `AsyncViewState<Row[]>`. Native `<table>` only: sortable header button, `aria-sort` on `<th>`, labelled checkboxes, controlled pagination. Wide/dense table is inside a labelled focusable overflow region; no virtualization.

Required case IDs:

- `data-display/bug-list/[loading,empty,error,populated,filtered,long-content]`;
- `data-display/bug-table/[loading,empty,error,populated,sort,selection,overflow]`;
- `data-display/audit-log/[loading,empty,error,populated,load-more,long-content]`;
- `data-display/holiday-audit/[loading,empty,error,populated,long-content]`;
- `data-display/target-wp-audit/[loading,empty,error,populated,long-content]`;
- `data-display/wp-weight-audit/[loading,empty,error,populated,long-content]`;
- `data-display/team-metrics-table/[loading,empty,error,populated,sort,selection,overflow,tasks-open]`;
- `data-display/team-performance/[empty,populated,long-labels,narrow]`;
- `data-display/holiday-list/[loading,empty,error,populated,long-content,narrow]`;
- `data-display/leave-list/[loading,empty,error,populated,confirm,pending,long-content,narrow]`;
- `data-display/issue-detail/[empty,populated,long-content,overflow]`;
- `data-display/epic-info/[empty,populated,long-content]`;
- `data-display/epic-metrics/[empty,populated,optional,long-content,narrow]`;
- one default and all relevant async/overflow states for remaining direct exports.

Export `dataDisplayCases: readonly CatalogRuntimeCase[]`. No Jira URL/status/formula/timezone/domain calculation inside components.

## Acceptance criteria

- [ ] Every owned export has a live public-import case and typed controlled contract.
- [ ] Tables implement both sort directions, selection, controlled page, optional/long fields, loading/empty/error/ready, and keyboard-reachable row actions.
- [ ] Dense/wide content has a labelled focusable owned scroll region reaching final content/action; page does not overflow.
- [ ] Audit/load-more, task/activity/issue/holiday/leave lists, metrics/progress, and definitions preserve non-color meaning.
- [ ] Large visible-set fixture works without virtualization; no domain aggregation or side effect.
- [ ] No Tere/env/network/import and no Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/data-display.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser: keyboard sort/select/page/overflow at 320 and 1440; last command empty.

## Definition of Done

All mapped async/sort/select/page/overflow cases pass with semantic native tables, reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-09 add data displays (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
