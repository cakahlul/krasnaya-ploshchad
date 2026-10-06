# Tasks: Tere UI/UX Revamp

## Task 1: Replace the theme foundation

**Acceptance:** Light, dark, and system preferences persist; crimson/Soviet CSS, copy, and animation are removed; semantic color tokens support readable glass surfaces.

**Verify:** `cd apps/tere-project && npx tsc --noEmit`; manual light/dark/system check.

**Dependencies:** None

**Likely files:** `src/hooks/useTheme.tsx`, `src/app/globals.css`, `src/components/ThemeToggle.tsx`

## Task 2: Rebuild the application shell and navigation

**Acceptance:** Grouped role-aware navigation follows the approved IA; desktop and mobile work; focus/menu behavior is accessible.

**Verify:** Type check; keyboard and mobile-width manual check.

**Dependencies:** Task 1

**Likely files:** `src/app/dashboard/layout.tsx`, `src/components/sidebar.tsx`, `src/components/topbar.tsx`, `src/components/sidebar.test.tsx`

## Task 3: Rebuild Contributor Home

**Acceptance:** Non-Leads land on personal, assigned-board progress with concrete next actions; partial board loading is visible; no teammate metrics appear.

**Verify:** Type check; non-Lead network/UI privacy check.

**Dependencies:** Tasks 1–2

**Likely files:** `src/app/dashboard/page.tsx`, `src/features/dashboard/components/*`, `src/features/dashboard/hooks/useDashboardSummary.ts`

## Task 4: Rebuild Lead and VP Home

**Acceptance:** Leads see assigned-board risks first; VPs see portfolio-level status; completed board cards appear before all board requests finish.

**Verify:** Type check; multi-board loading/manual role check.

**Dependencies:** Tasks 1–3

**Likely files:** `src/app/dashboard/page.tsx`, `src/features/dashboard/components/*`, `src/features/dashboard/hooks/useDashboardSummary.ts`

## Checkpoint: Foundations and Home

- [ ] Theme, navigation, personal home, and multi-board home work in both themes.
- [ ] Assigned-board and non-Lead privacy constraints remain intact.
- [ ] Human review before route-group work.

## Task 5: Rebuild Delivery reports and productivity

**Acceptance:** Reports and productivity make filters, current status, and the next action clear before dense detail.

**Verify:** Type check; manual report/productivity loading, empty, and populated states.

**Dependencies:** Tasks 1–2

**Likely files:** `src/app/dashboard/reports/page.tsx`, `src/app/dashboard/productivity-summary/page.tsx`, `src/features/dashboard/components/FilterReport.css`, `src/features/dashboard/components/ProductivitySummary.tsx`

## Task 6: Rebuild Epic Explorer

**Acceptance:** Project/epic selection and hierarchy drill-down follow the shared glass system without losing explorer behavior.

**Verify:** Type check; manual selection/detail/mobile check.

**Dependencies:** Tasks 1–2

**Likely files:** `src/app/dashboard/epic-explorer/page.tsx`, `src/features/epic-explorer/components/*`

## Task 7: Rebuild Bug Monitoring

**Acceptance:** Current bug status, severity, and drill-down are scannable before the detailed list.

**Verify:** Type check; manual board, table, and chart states.

**Dependencies:** Tasks 1–2

**Likely files:** `src/app/dashboard/bug-monitoring/page.tsx`, `src/app/bug-monitoring.css`, `src/features/bug-monitoring/components/*`

## Task 8: Rebuild Talent Leave

**Acceptance:** Capacity/leave state, month controls, and permitted actions are clear without breaking calendar behavior.

**Verify:** Existing feature tests plus manual desktop/mobile calendar check.

**Dependencies:** Tasks 1–2

**Likely files:** `src/app/dashboard/talent-leave/page.tsx`, `src/features/talent-leave/components/*`

## Task 9: Rebuild Administration

**Acceptance:** Configuration, Team Members, and MCP Connection are visually cohesive and role-appropriate.

**Verify:** Type check; manual role/navigation checks.

**Dependencies:** Tasks 1–2

**Likely files:** `src/app/dashboard/configuration/page.tsx`, `src/app/dashboard/team-members/page.tsx`, `src/app/dashboard/mcp-connection/page.tsx`, corresponding feature components

## Task 10: Rebuild authentication and state feedback

**Acceptance:** Sign-in, loading, empty, error, and unregistered states use the new system and plain, product-specific copy.

**Verify:** Type check; keyboard and reduced-motion check.

**Dependencies:** Tasks 1–2

**Likely files:** `src/app/sign-in/page.tsx`, `src/components/LoadingScreen.tsx`, `src/components/PageSkeleton.tsx`, `src/app/dashboard/layout.tsx`

## Final Checkpoint

- [ ] Every approved route is reachable for its role in light, dark, and system themes.
- [ ] UI copy and visual treatment meet the no-slop rule.
- [ ] Type check and focused lint pass; unrelated global blockers are recorded.
- [ ] Human visual review confirms the redesign before merge.
