# BU-P1-10 — Native accessible SVG chart family

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 4, slot 3/3
**TRD coverage:** FE-10; R-08–R-11, R-13–R-14
**Estimated scope:** M; high-risk native visualization slice

## Description

Implement deterministic native SVG line/area/bar/donut charts, legends, and trend panels with pure geometry functions and a semantic data equivalent. No Recharts or chart dependency.

**Wave 1 compile contract:** BU-P1-01 seeds a throwing `src/components/charts/index.ts` scaffold. This task owns that path now and must replace the scaffold completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/charts/**`
- `/apps/beras-ui/src/catalog/cases/charts.tsx`
- `/apps/beras-ui/src/fixtures/charts.ts`
- `/apps/beras-ui/tests/charts.test.mjs`

BU-P1-03 owns CSS; BU-P1-04 owns primitive metrics/actions.

## Contract

Exact exports: `Legend`, `DonutChart`, `BarChart`, `AreaChart`, `LineChart`, `BugTrendPanel`, `SprintTrendPanel`. Public `ChartSeries` comes from C-02. Geometry consumes normalized display series only; scale/tick/path/hit-region helpers are pure.

Each chart renders labelled `<figure>`, visible summary, legend with marker/line shape plus color, responsive SVG, and a semantic table/list equivalent. Interactive points expose identical focus/pointer tooltip content; non-interactive points do not add tab stops. Empty state uses `StateView`, never a zero-size placeholder.

Required cases:

- `visualization/bug-statistics/empty|single|multiple|long-labels|reduced-motion`;
- `visualization/bug-trend/loading|empty|error|single|multiple|custom-range|reduced-motion`;
- `visualization/sprint-trend/loading|empty|error|single|multiple|metric-selection|long-labels`;
- direct `visualization/line-chart`, `area-chart`, `bar-chart`, `donut-chart`, and `legend` default/edge cases so every export is live.

Pure tests cover zero/single/multiple, negative/flat/missing values, long labels, and deterministic tooltip/paths. Export `chartCases: readonly CatalogRuntimeCase[]`.

## Acceptance criteria

- [ ] Every exact export is native SVG/HTML, publicly live, deterministic, and uses no chart/UI/animation dependency.
- [ ] Scale/path helpers handle zero, flat, negative, missing, single, multi, and long-label datasets without NaN/invalid SVG.
- [ ] Summary, shape+text legend, semantic data equivalent, and focus/pointer tooltip parity are present; no color-only meaning.
- [ ] Loading/empty/error/data and reduced-motion cases match IDs; no static screenshot/placeholder substitutes.
- [ ] SVG responds at 320/768/1024/1440; if labels require scroll, region is named/focusable and page remains bounded.
- [ ] No Tere/domain bucketing/calculation/network; no Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/charts.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser: pointer then keyboard each interactive chart at 320/1440 and reduced motion; last command empty.

## Definition of Done

Geometry and semantic-equivalent tests pass for all edge sets, live evidence is possible, reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-10 add native charts (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
