# PRD — Beras UI

## Status

| Field | Value |
|---|---|
| Status | Final; intent confirmed; no open questions |
| Source | Manual user brief and clarifications |
| Product | `apps/beras-ui`, sibling of `apps/tere-project` |
| Active phase | Phase 1 — complete package and internal catalog |
| Audit baseline | Tere commit `79927540a3c27d2c29b42d84c42b7e9abcb51800` |
| Rollout | [`rollout-phases.md`](./rollout-phases.md) |

This is a planning artifact. Export names, internal architecture, verification tooling, and exact commands belong to the TRD.

## Objective

Build Beras UI once, from zero, as:

1. a runnable private/internal component catalog; and
2. a private workspace package ready for Tere to consume.

Beras must represent 100% of Tere's approved visual inventory through canonical presentational components, layouts, foundations, deterministic local fixtures, semantic tokens, and typed variants. Phase 1 builds the complete package/catalog without changing Tere. Phase 2 migrates Tere. Phase 3 removes superseded UI and adds drift governance.

End state: canonical component/style changes originate in Beras. After Phase 2, the normal Tere build/deployment consumes them without duplicate style edits in Tere.

## Problem and why now

Tere UI currently spans 82 production UI sources, four stylesheets/2,045 CSS LOC, 18,894 UI LOC, 954 style properties, and 822 `className` uses. It mixes local CSS, inline styles, Tailwind, and several visual libraries. Similar visuals can diverge, broad style changes require multiple edits, business-bound components hide reusable presentation, and states are hard to review outside real product flows. A known fixed-sidebar mobile geometry/overflow defect also exists.

A small component pilot would leave local UI unmodeled. Confirmed MVP is complete visual coverage, not a partial kit.

## Confirmed decisions

| Topic | Decision |
|---|---|
| Location | `apps/beras-ui` in the existing npm workspace; not a separate Git repository. |
| Product form | Runnable internal catalog plus private workspace package. |
| Phase 1 | Complete, consumer-ready package/catalog; no Tere changes or imports. |
| Phase 2 | Tere imports and migration. |
| Inventory | 100%, including business-bound, unused, and legacy sources. |
| Coverage model | Similar visuals may canonicalize many-to-one; every Tere source/artifact remains mapped. |
| Component boundary | Standalone live cases use local fixtures and presentational props/events; no Tere API/auth/RBAC/store/repository/business duplication. |
| Baseline | Preserve intended current light appearance and interaction. |
| Themes | Do not implement dark, void, or crimson. Void/crimson stay inventory-only. |
| UI basis | Next.js, React, TypeScript, Tailwind, native HTML/CSS/SVG/Canvas/Web APIs only. |
| Prohibited | AntD, Recharts, Lucide, Framer Motion, Three, Radix, shadcn, and any other UI/visual library. |
| Responsive | Verify 320, 768, 1024, and 1440 px. Fix mobile shell in Beras only during Phase 1. |
| Accessibility | WCAG AA basics. |
| Customization | Semantic CSS variables/tokens plus typed variants. |
| `className` | Outer positioning/layout only; never internal visual styling. |
| Visibility | Private/internal; usage and customization docs required. |

## Actors

| Actor | Outcome |
|---|---|
| Beras consumer | Finds and imports canonical UI without recreating its style. |
| Beras maintainer | Changes tokens/variants once and sees affected cases. |
| Tere migration engineer | Maps real Tere data/events into Beras without moving business logic. |
| QA/reviewer | Exercises deterministic states, widths, and accessibility without Tere services. |
| Tere user | In Phase 2, retains intended behavior with corrected responsive shell. |

## User stories

- As a Beras consumer, I can find, exercise, import, and customize canonical UI without recreating internal styles.
- As a maintainer, I can change one semantic token or typed variant and identify every affected catalog case.
- As QA, I can verify every mapped state, viewport, and accessibility behavior using deterministic local data.
- As a Tere migration engineer, I can retain real Tere behavior while replacing only its presentational layer.

## Core flows

### Inventory and canonicalization

1. Read frozen baseline.
2. Record every intended visual artifact and state.
3. Group equivalent visuals into canonical exports/compositions.
4. Separate runtime/business concerns into typed presentational data, state, and events.
5. Link every artifact to a stable live catalog-case ID and evidence.
6. Close only at `82/82`, zero unexplained artifacts, zero deferrals.

### Catalog use

1. Engineer runs catalog without Tere environment or network.
2. Finds a component, layout, or foundation.
3. Reviews live variants/states, props/events, responsive/accessibility behavior, import, and customization guidance.
4. Consumes supported package entrypoints and stylesheet.
5. Customizes only with tokens, typed variants, and outer-layout `className`.

### Style change

1. Maintainer expresses global styling through semantic tokens or supported differences through typed variants.
2. Updates deterministic cases and docs.
3. Verifies affected widths/states/accessibility.
4. After Phase 2 adoption, Tere receives the change through its Beras workspace dependency and normal build/deploy path.

### Tere migration — Phase 2

1. Select mapped route/feature.
2. Keep API, auth, RBAC, stores, queries, mutations, retries, and orchestration in Tere.
3. Use thin adapters for Beras props/events.
4. Replace local visuals with public Beras exports.
5. Verify real flows and keep increment reversible until accepted.

## Fixed inventory denominator

| Group | Count |
|---|---:|
| App/page/layout | 17 |
| Shared UI | 12 |
| Feature UI | 51 |
| ADF renderer | 1 |
| Theme hook | 1 |
| **Total** | **82** |

Additional mandatory inputs: four stylesheet paths, `apps/tere-project/tailwind.config.ts`, Space Grotesk 400/500/600/700, IBM Plex Mono 400/500/600/700, and theme/foundation behavior evidenced by the baseline.

Appendices A–B are normative. Later Tere drift must fail coverage until recorded and explicitly reconciled; it must not silently change Phase 1 scope.

The mapping ledger must record per source: artifacts, canonical export/composition, stable case IDs/states, responsive/a11y concerns, removed runtime coupling, disposition, rationale, and evidence.

Only these dispositions are valid:

- `implemented`;
- `canonicalized into <Beras export>`;
- `non-visual business boundary` for logic only; visual shells still require coverage;
- `not ported: dead CSS or known defect`, with evidence;
- `inventory-only: void/crimson`.

`deferred` is invalid. Unused, legacy, and business-bound sources remain in the denominator.

## Requirements

| ID | Requirement |
|---|---|
| R-01 | `apps/beras-ui` is independently runnable and consumable as a private workspace package. |
| R-02 | Components, layouts, tokens, variants, foundations, and public types are available through deliberate package entrypoints; no consumer source-path import. |
| R-03 | Catalog consumes the same public entrypoints and exported stylesheet as any consumer; no privileged private imports. |
| R-04 | All 82 sources and all foundation inputs are mapped; every intended light visual has an allowed disposition and evidence. |
| R-05 | Similar visuals canonicalize where intent matches, while preserving every source/artifact mapping. Recreate intent, not old component trees, library APIs, dead CSS, accidental behavior, or known defects. |
| R-06 | Foundations cover color, typography, spacing/layout, sizing, border/radius, elevation, motion/reduced motion, layers, breakpoints, status, and data visualization. Conflicting legacy values resolve to one documented semantic contract. |
| R-07 | Semantic CSS tokens and typed variants are the internal visual customization contract. Public `className`, if offered, controls only outer positioning/layout. Arbitrary internal-style props are prohibited. |
| R-08 | Cover all inventory-required primitives, compound controls, navigation, page/layout shells, data display, tables, charts, calendars/date controls, trees, dialogs, selects/menus, feedback/states, icons, ADF content, animations, and `Stat3DScene`. Interactive artifacts cannot use static placeholders. |
| R-09 | Components take typed presentational data/state and emit typed events. No Tere API, auth, RBAC, store, repository, query, mutation, secret, or domain orchestration. |
| R-10 | Every public component/layout has a discoverable standalone live case. Every mapped artifact is reachable through a stable case ID and deterministic local fixture. |
| R-11 | Every data-bearing component/layout has loading, empty, error, and populated cases. Include every inventory-relevant disabled, validation, focus, overflow, selection, expansion, pending, and reduced-motion state. |
| R-12 | Docs state purpose, import, props/events, variants/states, composition, customization, responsive/a11y behavior, and boundaries. |
| R-13 | Required cases are usable at 320/768/1024/1440 px. Primary actions cannot clip; dense intentional overflow remains operable. Beras fixes the known narrow-shell defect. |
| R-14 | Meet WCAG AA basics: semantic structure, keyboard operation, visible/logical focus, names/labels, applicable contrast, non-color meaning, and reduced motion. Informative native visuals need an accessible equivalent; decorative visuals are hidden. |
| R-15 | Enforce a direct dependency allowlist. Runtime visuals use only the confirmed basis; non-runtime tools are separately documented and cannot supply runtime UI. |
| R-16 | Catalog works without Tere environment variables, secrets, services, or network access. |
| R-17 | Phase 1 modifies nothing under `apps/tere-project/**`; Phase 2 cannot start until all Phase 1 gates pass. |

## Edge and human/app behavior

| Area | Required cases/behavior |
|---|---|
| Data | Loading, empty, error, populated, optional/missing fields, long values, large visible sets. |
| Actions | Default, hover, focus, active, disabled, pending, success, failure. Repeated activation must not corrupt component-local visual state; business idempotency remains in Tere. |
| Forms | Required/optional, helper/error text, disabled/read-only, long options, keyboard submit/cancel. |
| Overlays | Keyboard open/close, escape path, sensible focus containment/return, small viewport, overflow content. |
| Select/date | Keyboard navigation, selection, clear/cancel, invalid/empty, disabled, long labels. |
| Tables | Empty/loading/error, dense/wide content, evidenced sort/selection/page states, usable narrow overflow. |
| Charts | Empty, single/multiple series, long labels, accessible equivalent, no color-only meaning. |
| Calendars | Empty/dense periods, boundary dates, selected/range states, keyboard and narrow viewport. |
| Trees | Empty, collapsed/expanded, deep nesting, large visible set/load-more where evidenced, keyboard use. |
| Shell/navigation | Active route, mobile open/closed, long labels, narrow/wide layout, no clipped primary content/action. |
| Feedback | Loading, skeleton, toast, error, maintenance, permission/not-registered, reduced motion. |
| ADF/content | Empty, headings, lists, links, marks, overflow, safe accessible link behavior. |
| Theme | Intended light only; void/crimson inventory-only; no dark implementation. |

## Success definition

- Phase 1 succeeds only when all five Phase 1 gates below pass; partial coverage is not MVP completion.
- Phase 2 succeeds when active Tere visuals consume Beras without behavior/access-control regression or active local forks.
- Phase 3 succeeds when superseded code is removed with evidence and lightweight checks prevent new drift.

## Acceptance gates

### Gate 1 — Coverage

- Manifest pins the Appendix A 82 paths, Appendix B four CSS paths, Tailwind config, and font/foundation inputs to baseline commit.
- Ledger has exactly 82 source rows and all four stylesheets analyzed.
- Report is `82/82`, zero unexplained artifacts, zero `deferred`.
- Business-bound, unused, legacy, void/crimson, dead CSS, and known-defect dispositions are explicit.

### Gate 2 — Consumable package

- Beras is registered private and independently runnable.
- Clean consumer fixture imports every public category and stylesheet through public entrypoints only.
- Catalog uses those same entrypoints.
- Public props/events/types/tokens/variants type-check.
- Direct dependencies match allowlist; source/config scan finds zero prohibited UI/visual dependency.
- `className` is verified as outer-layout-only.

### Gate 3 — Catalog completeness

- Every public component/layout is live and discoverable.
- Every mapped artifact resolves to a stable case ID linking ledger, fixture, docs, and evidence.
- Data-bearing surfaces have loading/empty/error/populated cases; all mapped interaction states have deterministic cases.
- Catalog remains usable with network disabled and no Tere environment.

### Gate 4 — Visual, responsive, accessibility

- Intended light output is compared with baseline evidence; consolidation and defect fixes are documented.
- Required cases pass 320/768/1024/1440 px without clipped primary actions, accidental shell overflow, or unusable dense-content overflow.
- Keyboard/focus, labels/names, applicable 4.5:1 normal-text and 3:1 large-text/essential-UI contrast, non-color meaning, and reduced motion pass.
- Parity matrix links each applicable case ID to visual, viewport, keyboard/focus, contrast, and motion evidence.
- Charts, tables, dialogs, selects/date controls, calendars, trees, toasts, icons, loading animation, and `Stat3DScene` require visual and interaction-equivalent live evidence; mapping labels/screenshots/placeholders alone fail.
- Known Tere mobile-shell defect cannot reproduce in Beras at 320 px.

### Gate 5 — Isolation and phase barrier

- No Phase 1 change exists under `apps/tere-project/**`.
- No fixture imports/calls Tere runtime behavior.
- All Phase 1 tasks are reviewed `STATUS: CLEAN` and committed before Phase 2.

### Phase 2 completion

- Every active mapped Tere visual uses a Beras public export or approved non-visual boundary rationale.
- Real auth, RBAC, API, store, query, mutation, retry, and error behavior remains correct.
- No active duplicate/fork remains for migrated canonical visuals.
- Migrated routes pass relevant build/tests plus visual, responsive, keyboard, and reduced-motion checks.
- Tere shell passes 320 px with regression coverage.

### Phase 3 completion

- Superseded visual code/CSS and unused visual dependencies are removed only with zero-use evidence.
- Checks fail on prohibited Beras dependencies, private imports, or unmapped new Tere visual sources.
- Ledger and private maintainer/package-change guidance match final codebase.

## Required commands

Exact commands and tools are TRD decisions.

| Outcome | Command |
|---|---|
| Clean install | **TBD-by-TRD** |
| Run catalog | **TBD-by-TRD** |
| Build package/catalog | **TBD-by-TRD** |
| Lint | **TBD-by-TRD** |
| Type-check package and consumer fixture | **TBD-by-TRD** |
| Test/check Beras | **TBD-by-TRD** |
| Verify baseline and `82/82` coverage | **TBD-by-TRD** |
| Verify catalog completeness | **TBD-by-TRD** |
| Verify dependency allowlist/import boundary | **TBD-by-TRD** |
| Verify offline/runtime isolation | **TBD-by-TRD** |
| Produce responsive/a11y/parity evidence | **TBD-by-TRD** |
| Verify Tere in Phase 2 | **TBD-by-Phase-2-TRD** |

## Boundaries and non-goals

Phase 1 permits Beras/catalog, planning artifacts, and required workspace integration only. It excludes Tere changes, adapters, migration, production rollout, real Tere runtime logic, public publication/docs, dark/void/crimson implementation, unrelated product UI, and generalized design-system features not evidenced by inventory.

Persistent non-goals:

- reproducing third-party APIs or accidental behavior;
- retaining dead CSS or known defects;
- copying unrelated business architecture;
- unrestricted consumer restyling;
- runtime remote style propagation without normal consumer build/deployment.

## Risks

Completeness is large; native charts, calendars, composite controls, trees, animation, icons, and 3D create parity/a11y risk. Canonicalization can erase meaningful differences, business-bound sources can invite logic duplication, and Tere may drift after the frozen baseline. Required mitigation: fixed ledger, presentational contracts, deterministic cases, native parity evidence, direct-dependency allowlist, and hard phase barriers. Schedule pressure does not authorize silent deferral; scope change requires explicit product renegotiation.

## Appendix A — Normative 82-source denominator

### App/page/layout — 17

1. `apps/tere-project/src/app/dashboard/bug-monitoring/page.tsx`
2. `apps/tere-project/src/app/dashboard/configuration/page.tsx`
3. `apps/tere-project/src/app/dashboard/epic-explorer/page.tsx`
4. `apps/tere-project/src/app/dashboard/holiday-management/page.tsx`
5. `apps/tere-project/src/app/dashboard/layout.tsx`
6. `apps/tere-project/src/app/dashboard/mcp-connection/page.tsx`
7. `apps/tere-project/src/app/dashboard/page.tsx`
8. `apps/tere-project/src/app/dashboard/productivity-summary/page.tsx`
9. `apps/tere-project/src/app/dashboard/reports/page.tsx`
10. `apps/tere-project/src/app/dashboard/talent-leave/page.tsx`
11. `apps/tere-project/src/app/dashboard/team-members/page.tsx`
12. `apps/tere-project/src/app/icon.tsx`
13. `apps/tere-project/src/app/layout.tsx`
14. `apps/tere-project/src/app/page.tsx`
15. `apps/tere-project/src/app/sign-in/Stat3DScene.tsx`
16. `apps/tere-project/src/app/sign-in/page.tsx`
17. `apps/tere-project/src/app/sign-up/page.tsx`

### Shared UI — 12

1. `apps/tere-project/src/components/AxiosErrorInterceptor.tsx`
2. `apps/tere-project/src/components/LegalModal.tsx`
3. `apps/tere-project/src/components/LoadingScreen.tsx`
4. `apps/tere-project/src/components/PageSkeleton.tsx`
5. `apps/tere-project/src/components/RoleBasedRoute.tsx`
6. `apps/tere-project/src/components/ThemeToggle.tsx`
7. `apps/tere-project/src/components/buttonLoginGoogle.tsx`
8. `apps/tere-project/src/components/loadingBar.tsx`
9. `apps/tere-project/src/components/loadingBounce.tsx`
10. `apps/tere-project/src/components/maintenancePage.tsx`
11. `apps/tere-project/src/components/sidebar.tsx`
12. `apps/tere-project/src/components/topbar.tsx`

### Feature UI — 51

1. `apps/tere-project/src/features/api-keys/components/McpConnectionPage.tsx`
2. `apps/tere-project/src/features/bug-monitoring/components/BugListView.tsx`
3. `apps/tere-project/src/features/bug-monitoring/components/BugStatistics.tsx`
4. `apps/tere-project/src/features/bug-monitoring/components/BugTable.tsx`
5. `apps/tere-project/src/features/bug-monitoring/components/BugTrendChart.tsx`
6. `apps/tere-project/src/features/configuration/components/ComingSoon.tsx`
7. `apps/tere-project/src/features/configuration/components/ConfigAuditLogPanel.tsx`
8. `apps/tere-project/src/features/configuration/components/ConfigurationTabs.tsx`
9. `apps/tere-project/src/features/configuration/components/HolidayAuditLogPanel.tsx`
10. `apps/tere-project/src/features/configuration/components/TargetWpAuditLogPanel.tsx`
11. `apps/tere-project/src/features/configuration/components/TargetWpConfigPanel.tsx`
12. `apps/tere-project/src/features/configuration/components/WpWeightAuditLogPanel.tsx`
13. `apps/tere-project/src/features/configuration/components/WpWeightConfigPanel.tsx`
14. `apps/tere-project/src/features/dashboard/components/DateRangeSelect.tsx`
15. `apps/tere-project/src/features/dashboard/components/GlobalSearch.tsx`
16. `apps/tere-project/src/features/dashboard/components/MemberTaskModal.tsx`
17. `apps/tere-project/src/features/dashboard/components/MultiSelectSprint.tsx`
18. `apps/tere-project/src/features/dashboard/components/MultiSelectTeam.tsx`
19. `apps/tere-project/src/features/dashboard/components/ProductivitySummary.tsx`
20. `apps/tere-project/src/features/dashboard/components/ProductivitySummaryExportButton.tsx`
21. `apps/tere-project/src/features/dashboard/components/SprintSelect.tsx`
22. `apps/tere-project/src/features/dashboard/components/SprintTrendChart.tsx`
23. `apps/tere-project/src/features/dashboard/components/TeamSelect.tsx`
24. `apps/tere-project/src/features/dashboard/components/epicSelect.tsx`
25. `apps/tere-project/src/features/dashboard/components/filterReport.tsx`
26. `apps/tere-project/src/features/dashboard/components/teamPerformance.tsx`
27. `apps/tere-project/src/features/dashboard/components/teamTable.tsx`
28. `apps/tere-project/src/features/epic-explorer/components/DescendantControls.tsx`
29. `apps/tere-project/src/features/epic-explorer/components/DescendantDetail.tsx`
30. `apps/tere-project/src/features/epic-explorer/components/EpicInfoCard.tsx`
31. `apps/tere-project/src/features/epic-explorer/components/EpicSearch.tsx`
32. `apps/tere-project/src/features/epic-explorer/components/FrSelect.tsx`
33. `apps/tere-project/src/features/epic-explorer/components/HierarchyTree.tsx`
34. `apps/tere-project/src/features/epic-explorer/components/MetricsPanel.tsx`
35. `apps/tere-project/src/features/epic-explorer/components/ProjectSelect.tsx`
36. `apps/tere-project/src/features/epic-explorer/components/StateViews.tsx`
37. `apps/tere-project/src/features/epic-explorer/components/StatusBadge.tsx`
38. `apps/tere-project/src/features/holiday-management/components/BulkInsert.tsx`
39. `apps/tere-project/src/features/holiday-management/components/HolidayCalendar.tsx`
40. `apps/tere-project/src/features/holiday-management/components/HolidayFormModal.tsx`
41. `apps/tere-project/src/features/holiday-management/components/HolidayListView.tsx`
42. `apps/tere-project/src/features/talent-leave/components/DateRangePicker.tsx`
43. `apps/tere-project/src/features/talent-leave/components/ExportButton.tsx`
44. `apps/tere-project/src/features/talent-leave/components/ExportToast.tsx`
45. `apps/tere-project/src/features/talent-leave/components/LeaveCalendar.tsx`
46. `apps/tere-project/src/features/talent-leave/components/LeaveCalendarSimple.tsx`
47. `apps/tere-project/src/features/talent-leave/components/LeaveListView.tsx`
48. `apps/tere-project/src/features/talent-leave/components/LeaveModal.tsx`
49. `apps/tere-project/src/features/talent-leave/components/MonthSelector.tsx`
50. `apps/tere-project/src/features/team-members/components/MemberFormModal.tsx`
51. `apps/tere-project/src/features/team-members/components/TeamMembersPage.tsx`

### ADF renderer — 1

1. `apps/tere-project/src/features/epic-explorer/utils/adfToReact.tsx`

### Theme hook — 1

1. `apps/tere-project/src/hooks/useTheme.tsx`

## Appendix B — Stylesheet/foundation inputs

Stylesheets:

1. `apps/tere-project/src/app/bug-monitoring.css`
2. `apps/tere-project/src/app/globals.css`
3. `apps/tere-project/src/features/dashboard/components/FilterReport.css`
4. `apps/tere-project/src/features/dashboard/components/SprintSelect.css`

Additional inputs:

1. `apps/tere-project/tailwind.config.ts`
2. Font loading/variables in `apps/tere-project/src/app/layout.tsx`
3. Theme behavior in `apps/tere-project/src/hooks/useTheme.tsx`
