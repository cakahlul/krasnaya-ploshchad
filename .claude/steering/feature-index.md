# Feature Index — Where Things Live

**Purpose**: For any task, find the feature here and you get the exact files to read/modify. No scanning needed.

**Convention**: Each entry maps **frontend page → feature module → API routes → server module → shared types**. Update this file in the same response when you add/remove/move files.

---

## 🧭 Quick Navigation (by user intent)

| Intent | Feature |
|---|---|
| Sprint reports / story-point dashboard | [Dashboard / Reports](#dashboard--reports) |
| Sprint-over-sprint velocity trend | [Dashboard / Reports](#dashboard--reports) |
| Pick an Epic, view its child/subtask hierarchy + rolled-up WP/SP | [Epic Explorer](#epic-explorer) |
| Productivity Summary export | [Reports](#reports) |
| Bug tracking and charts | [Bug Monitoring](#bug-monitoring) |
| Public-holiday CRUD | [Holiday Management](#holiday-management) |
| Leave records, calendar, Google Sheets export | [Talent Leave](#talent-leave) |
| Team roster CRUD | [Team Members](#team-members) |
| API key issuance / management | [API Keys](#api-keys) |
| RBAC checks, role gating | [User Access (RBAC)](#user-access-rbac) |
| WP weights and targets config | [WP Configs](#wp-configs) |
| Configuration tabs (Holiday/WP Weight/Target WP/Audit Log shell) | [Configuration](#configuration) |
| Jira board listing | [Boards](#boards) |
| Sprint listing / sprint data | [Sprint](#sprint) |
| Global search (tickets) | [Search](#search) |
| Sign-in / sign-up / session | [Auth](#auth) |
| Beras UI package, catalog, and public component contracts | [Beras UI](#beras-ui) |
| MCP server tools | [MCP Server](#mcp-server) |

---

## Dashboard / Reports

**Combined section because the dashboard page renders Reports and Productivity Summary; they share filters/hooks.**

### Pages
- `apps/tere-project/src/app/dashboard/page.tsx` — root dashboard
- `apps/tere-project/src/app/dashboard/reports/page.tsx` — sprint reports
- `apps/tere-project/src/app/dashboard/productivity-summary/page.tsx` — productivity summary

### Feature module (frontend)
- `apps/tere-project/src/features/dashboard/`
  - `components/` — `ProductivitySummary.tsx`, `GlobalSearch.tsx`, `ProductivitySummaryExportButton.tsx`, `filterReport.tsx`, `epicSelect.tsx`, `DateRangeSelect.tsx`, `SprintSelect.tsx`, `TeamSelect.tsx`, `MultiSelectSprint.tsx`, `MultiSelectTeam.tsx`, `SprintTrendChart.tsx`
  - `hooks/` — 18 hooks including `useSprintFetch.ts`, `useMultiTeamSprintFetch.ts`, `useSprintDataTransform.ts`, `useMultiSprintDataTransform.ts`, `useBoards.ts`, `useGlobalSearch.ts`, `useMemberIssues.ts`, `useMemberProfile.ts`, `useTargetWpConfig.ts`, `useWpWeightConfig.ts`, `useTeamReportAutoDefaults.ts`, `useSprintTrend.ts`
  - `repositories/jiraRepository.ts` — client-side Jira data fetcher
  - `store/sprintFilterStore.ts`, `store/teamReportFilterStore.ts` — Zustand
  - `types/dashboard.ts`

### API routes
- `POST /api/dashboard/summary` → `apps/tere-project/src/app/api/dashboard/summary/route.ts`
- `GET /api/report` → `apps/tere-project/src/app/api/report/route.ts`
- `GET /api/report/all` → `apps/tere-project/src/app/api/report/all/route.ts`
- `GET /api/report/epics` → `apps/tere-project/src/app/api/report/epics/route.ts`
- `GET /api/report/stories` → `apps/tere-project/src/app/api/report/stories/route.ts`
- `GET /api/report/productivity-summary` → `apps/tere-project/src/app/api/report/productivity-summary/route.ts`
- `POST /api/report/productivity-summary/export` → `apps/tere-project/src/app/api/report/productivity-summary/export/route.ts`
- `GET /api/report/sprint-trend` → `apps/tere-project/src/app/api/report/sprint-trend/route.ts`
- `GET /api/report/productivity-summary/auth/google` → OAuth callback for export to Google Sheets

### Server modules
- `apps/tere-project/src/server/modules/dashboard/dashboard.service.ts`
- `apps/tere-project/src/server/modules/reports/`
  - `reports.service.ts`, `reports.repository.ts`, `report-filter.ts`, `productivity-summary.service.ts`
  - `strategies/` — issue categorizers + complexity-weight strategies (legacy/new/v3)

### Shared types
- `apps/tere-project/src/shared/types/dashboard.types.ts`
- `apps/tere-project/src/shared/types/report.types.ts`

### Notes
- **Feature flag** `isShowPlannedWP` — Team Reporting only (NOT dashboard, NOT productivity summary).
- **Sprint Trend** (`SprintTrendChart`): rendered below `TeamTable` on reports page. Activates when 2+ sprints selected. Calls `/api/report/sprint-trend` which loops `generateReport` per sprint and aggregates per-team via `aggregateReportByTeam`. Metrics: velocity (WP), wpAttainment (%), spVelocity (raw SP). Slowdown alerts flag teams with 2+ consecutive declines totaling ≥ 20%.
- **Team Reporting auto-defaults**: on first mount, `useTeamReportAutoDefaults` (called from `app/dashboard/reports/page.tsx`) auto-selects (a) the user's teams (from `member.teams` via `useMemberProfile`; non-Leads also have non-member teams hidden in `filterReport.tsx`), then (b) the active sprint(s) for non-kanban teams OR the 2-week kanban cycle range for kanban-only teams. The hook returns `isInitializing` which the page ORs with `useTeamReportTransform().isLoading` to keep `LoadingBar` visible across the auto-init handoff (prevents the brief empty-state glitch).
- Reports fetch from Jira via `src/server/lib/jira.client.ts`.
- Epic/Story filter (`components/epicSelect.tsx`) uses **staged multi-select** (local draft) and commits only on **Apply**.
- Do **not** refetch `/api/report` per epic: `useTeamReportFetch.ts` excludes epic IDs from the query key/API call.
- Do **not** row-filter member aggregates for epic filtering: `reports.service.ts` populates per-member `epicBreakdown`, and `useTeamReportTransform.ts` rebuilds member rows from selected epic buckets before recalculating every displayed summary metric.
- Bulk commit API: `store/teamReportFilterStore.ts → setEpicFilters(epicIds?: string[])`. Per-click toggle `setEpicFilter` retained for legacy callers.

---

## Reports

See [Dashboard / Reports](#dashboard--reports) — Reports lives in the dashboard feature module.

---

## Epic Explorer

**Read-only page (Phase 1/MVP) to pick one Jira Epic and view its metadata + full child/subtask hierarchy + rolled-up WP/SP metrics. Reuses the existing reports complexity/WP strategies — no new metric logic.**

### Page
- `apps/tere-project/src/app/dashboard/epic-explorer/page.tsx` — `RoleBasedRoute`-gated (Lead + Member); route `/dashboard/epic-explorer`

### Feature module (frontend)
- `apps/tere-project/src/features/epic-explorer/`
  - `components/` — `ProjectSelect.tsx`, `EpicSearch.tsx`, `EpicInfoCard.tsx` (gradient type-accent header), `HierarchyTree.tsx` (**colorful card tree — NOT an antd Table**: type-colored accent cards, glyph chips, WP/SP pills, expand carets, connector guides; windowed via PAGE-sized slice + Load-more, no `react-responsive`/virtual Table; clicking a card opens the detail antd `Modal`), `DescendantDetail.tsx` (rendered inside the Modal, type-accent header), `MetricsPanel.tsx` (per-metric colored stat tiles), `StatusBadge.tsx`, `StateViews.tsx`
  - `hooks/useEpicExplorer.ts`
  - `store/explorerStore.ts` — Zustand (selected project/epic/descendant)
  - `api/epic-explorer.api.ts` — client API wrapper; `api/explorerError.ts` — error mapping
  - `types/epic-explorer.types.ts`
  - `utils/buildTree.ts` (+ `buildTree.test.ts`), `utils/flattenTree.ts` (+ `flattenTree.test.ts`) — pre-order DFS flatten of the tree into visible rows for the antd virtual Table (SLS-16901), `utils/format.ts`, `utils/explorerParams.ts` (+ `explorerParams.test.ts`) — deep-link URL⇄state param mapping (SLS-16894), `utils/adfToReact.tsx` — Jira ADF (Atlassian Document Format) → React renderer for descriptions (`AdfDescription`, `hasDescription`); walks the ADF tree into React elements, NEVER `dangerouslySetInnerHTML` (link hrefs scheme-checked); used by `EpicInfoCard`/`DescendantDetail`. `utils/issueTypeStyle.ts` — maps Jira issue type → `{accent,bg,glyph,label}` from the theme status palette (Epic/Story/Task/Sub-task/Bug); drives the colorful hierarchy cards + detail header
  - `components/FrSelect.tsx` — generic single-select on the shared `.fr-select` CSS (dashboard `FilterReport.css`); replaced all antd `Select`/`Input.Search` in the filter controls for visual parity with Team Reporting

### API routes
- `GET /api/report/epics` → `apps/tere-project/src/app/api/report/epics/route.ts` — **shared with Dashboard/Reports; MODIFIED**: added a project-wide epic-list branch (returns `ExplorerEpicListItem[]`) when called with no sprint/date params
- `GET /api/report/epics/[key]` → `apps/tere-project/src/app/api/report/epics/[key]/route.ts` — epic detail + hierarchy + metrics (`EpicDetailResponse`)

### Server module
- `apps/tere-project/src/server/modules/reports/` (shares the reports module — no separate module)
  - `epic-explorer.service.ts` — detail assembly + project-level authz (via `members.teams`) + `EpicExplorerError`. Fetches `wpWeightConfigService` weights AND `targetWpConfigService.getEffectiveRates(todayInWib())` (`dailyTargetWPByLevel`), builds an `accountId → dailyRate` map from `members` (level → rate), passes each descendant's assignee rate into `buildDescendant` for the SP fallback. `description` (epic + descendant) passed through RAW (ADF object/string) — no longer server-flattened.
  - `epic-explorer.metrics.ts` (+ `epic-explorer.metrics.test.ts`) — descendant build + WP/SP roll-up via `strategies/` `issueProcessingStrategyFactory` + `wpWeightConfigService`. **SP**: prefers raw `customfield_10005`; when absent, falls back to Team Reporting's WP→SP conversion `round2(weightPoint * (8 / dailyRate))` (spBase, mirrors `reports.service.ts`), guarded on `weightPoint > 0` so no-data tickets stay N/A. `adfToPlainText` REMOVED (description now rendered client-side, not flattened).
  - `reports.repository.ts` — **MODIFIED**: added `fetchProjectEpics`, `fetchIssueByKey`, `fetchEpicWithDescendants` (BFS). `DESCENDANT_FIELDS` + `EPIC_FIELDS` += `description` and `customfield_10007` (**sprint field on this Jira instance — verified live; `customfield_10020` is always undefined here**).

### Shared types
- `apps/tere-project/src/shared/types/report.types.ts` — **MODIFIED**: Explorer contract types (`ExplorerEpicListItem`, `EpicDetailResponse`, `ExplorerDescendant`, `ExplorerMetrics`, etc.). `ExplorerEpicInfo` += `sprint: string | null`; `description` on both `ExplorerEpicInfo` + `ExplorerDescendant` is now `unknown` (raw ADF/string passthrough, rendered client-side) — was `string | null` (server-flattened plain text).

### Sidebar
- `apps/tere-project/src/components/sidebar.tsx` — **MODIFIED**: added Epic Explorer `menuItems` entry + `IconEpicExplorer`

### Notes
- **RBAC**: Lead + Member. Project-level scope enforced server-side in `epic-explorer.service.ts` against the caller's `members.teams`.
- **No new server module**: Epic Explorer lives inside the existing `reports` module and reuses its complexity/WP strategies (`strategies/`) and `wpWeightConfigService` — do not duplicate metric logic.

---

## Bug Monitoring

### Page
- `apps/tere-project/src/app/dashboard/bug-monitoring/page.tsx`
- Styling: `apps/tere-project/src/app/bug-monitoring.css`

### Feature module
- `apps/tere-project/src/features/bug-monitoring/`
  - `components/` — `BugTable.tsx`, `BugListView.tsx`, `BugStatistics.tsx`, `BugTrendChart.tsx`
  - `hooks/useBugMonitoring.ts`
  - `api/bug-monitoring.api.ts` — client API wrapper
  - `types/bug-monitoring.types.ts`

### API routes
- `GET /api/bug-monitoring/bugs` → `apps/tere-project/src/app/api/bug-monitoring/bugs/route.ts`
- `GET /api/bug-monitoring/summary` → `apps/tere-project/src/app/api/bug-monitoring/summary/route.ts`

### Server module
- `apps/tere-project/src/server/modules/bug-monitoring/`
  - `bug-monitoring.service.ts`, `bug-monitoring.repository.ts`

### Shared types
- `apps/tere-project/src/shared/types/bug-monitoring.types.ts`

---

## Holiday Management

### Page
- `apps/tere-project/src/app/dashboard/holiday-management/page.tsx`

### Feature module
- `apps/tere-project/src/features/holiday-management/`
  - `components/` — `HolidayCalendar.tsx`, `HolidayListView.tsx`, `HolidayFormModal.tsx`, `BulkInsert.tsx`
  - `hooks/useHolidayQueries.ts`
  - `api/holiday.api.ts`
  - `types/holiday-management.types.ts`

### API routes
- `GET|POST /api/holidays` → `apps/tere-project/src/app/api/holidays/route.ts` (`withHolidayAuth`; POST plumbs `user.email` as `changedBy`)
- `DELETE /api/holidays/[id]` → `apps/tere-project/src/app/api/holidays/[id]/route.ts` (no GET/PUT — config is create/delete only, no in-place update; `withHolidayAuth`, plumbs `changedBy`, can 409 IMMUTABLE_CONFIG / 404 HOLIDAY_NOT_FOUND)
- `POST /api/holidays/bulk` → `apps/tere-project/src/app/api/holidays/bulk/route.ts` (`withHolidayAuth`, plumbs `changedBy`)
- `GET /api/holidays/audit-log` → `apps/tere-project/src/app/api/holidays/audit-log/route.ts` — thin wrapper, `withLead` guard (SLS-16614)

### Server module
- `apps/tere-project/src/server/modules/holidays/`
  - `holidays.service.ts`, `holidays.repository.ts`
  - `holidays-http.ts` — `withHolidayAuth` (any signed-in user, wraps `withAuth`) and `withLead` (reuses `withRole('Lead', ...)`), mirrors `wp-weight-config-http.ts` pattern (SLS-16614)

### Holiday audit QA
- `apps/tere-project/scripts/holidays-audit.contract.mjs` — live API/auth contract: audit-log shape/pagination/RBAC, changed_by plumb on create/bulk/delete, 409 IMMUTABLE_CONFIG / 404 HOLIDAY_NOT_FOUND (SLS-16618), mirrors `wp-weight-config.contract.mjs`
- `apps/tere-project/src/server/modules/holidays/holidays-audit.contract.test.ts` — isolated-DB contract (SLS-16617): `createWithAudit`/`createManyWithAudit`/`deleteFutureWithAudit` atomicity (rollback on `23514` audit-insert failure), exact snapshot shape `{id,holiday_date,holiday_name,is_national_holiday}`, no-dedup on `holidays.date` (no unique constraint, unlike `wp_weight_config.effective_date`), `config_audit_log` constraint checks (`entity_supported`/`action_supported`/`snapshot_shape`/`actor_nonblank`) for `entity_type='holiday'`. Run via `ALLOW_DB_CONTRACT_TEST=1 npx tsx src/server/modules/holidays/holidays-audit.contract.test.ts`; mirrors `wp-weight-config-audit.contract.test.ts`.

---

## Talent Leave

### Page
- `apps/tere-project/src/app/dashboard/talent-leave/page.tsx`

### Feature module
- `apps/tere-project/src/features/talent-leave/`
  - `components/` — `LeaveCalendar.tsx`, `LeaveModal.tsx`, `LeaveListView.tsx`, `MonthSelector.tsx`, `DateRangePicker.tsx`, `ExportButton.tsx`, `ExportToast.tsx`
  - `hooks/` — `useTalentLeave.ts`, `useLeaveCreate.ts`, `useLeaveUpdate.ts`, `useLeaveDelete.ts`, `useExportTalentLeave.ts`, `useHolidays.ts`
  - `repositories/talentLeaveRepository.ts`
  - `store/talentLeaveStore.ts`
  - `types/talent-leave.types.ts`
  - `utils/dateUtils.ts`, `utils/sprintUtils.ts`, `utils/calendarUtils.ts`
  - Tests colocated: `*.test.ts(x)`, `accessibility.test.tsx`, `integration.test.tsx`
  - Docs: `ACCESSIBILITY.md`, `INTEGRATION_CHECKLIST.md`, `TESTING_GUIDE.md`

### API routes
- `GET|POST /api/talent-leave` → `apps/tere-project/src/app/api/talent-leave/route.ts`
- `GET|PUT|DELETE /api/talent-leave/[id]` → `apps/tere-project/src/app/api/talent-leave/[id]/route.ts`
- `GET /api/talent-leave/talents` → talent roster for dropdown
- `POST /api/talent-leave/export` → Google Sheets export
- `GET /api/talent-leave/auth/google` + `/callback` → OAuth flow for export

### Server module
- `apps/tere-project/src/server/modules/talent-leave/`
  - `talent-leave.service.ts`, `talent-leave.repository.ts`, `talent-leave-export.service.ts`
  - `clients/google-sheets.client.ts`
  - `utils/calendar-data-transformer.ts`, `date-utilities.ts`, `spreadsheet-style-builder.ts`, `sprint-utilities.ts`

### Shared types
- `apps/tere-project/src/shared/types/talent-leave.types.ts`

### Data store
- Table: `talent_leave` (Postgres, Drizzle) — see `src/server/db/schema.ts`. `memberId` is the natural key (1:1 with member). `leaveDate` is `jsonb` array of `{dateFrom, dateTo, status}`.
- Talent dropdown sources from `members` table (no separate `talent` table).

---

## Team Members

### Page
- `apps/tere-project/src/app/dashboard/team-members/page.tsx`

### Feature module
- `apps/tere-project/src/features/team-members/`
  - `components/` — `TeamMembersPage.tsx`, `MemberFormModal.tsx`
  - `hooks/useMembers.ts`

### API routes
- `GET|POST /api/members` → `apps/tere-project/src/app/api/members/route.ts`
- `GET|PUT|DELETE /api/members/[id]` → `apps/tere-project/src/app/api/members/[id]/route.ts`
- `GET /api/members/me` → current user's member profile
- `POST /api/members/seed` → seed data (admin)

### Server module
- `apps/tere-project/src/server/modules/members/`
  - `members.service.ts`, `members.repository.ts`

### Shared types
- `apps/tere-project/src/shared/types/member.types.ts`
- `apps/tere-project/src/shared/constants/team-members.ts`
- `apps/tere-project/src/shared/constants/levels.ts`

---

## API Keys

### Page
- `apps/tere-project/src/app/dashboard/mcp-connection/page.tsx` — surfaces API keys for MCP connection setup

### Feature module
- `apps/tere-project/src/features/api-keys/`
  - `components/McpConnectionPage.tsx`
  - `hooks/useApiKeys.ts`

### API routes
- `GET|POST /api/api-keys` → `apps/tere-project/src/app/api/api-keys/route.ts`
- `GET|DELETE /api/api-keys/[id]` → `apps/tere-project/src/app/api/api-keys/[id]/route.ts`

### Server module
- `apps/tere-project/src/server/modules/api-keys/`
  - `api-keys.service.ts`, `api-keys.repository.ts`

### Shared types
- `apps/tere-project/src/shared/types/api-key.types.ts`

### Auth HOFs that consume API keys
- `apps/tere-project/src/server/auth/with-api-key.ts`
- `apps/tere-project/src/server/auth/with-auth-or-api-key.ts`

---

## User Access (RBAC)

No dashboard page — used by other features via HOFs/hooks.

### Frontend
- `apps/tere-project/src/hooks/useUserAccess.ts`
- `apps/tere-project/src/lib/user-access.client.ts`
- `apps/tere-project/src/components/RoleBasedRoute.tsx`
- `apps/tere-project/src/types/user-access.types.ts`

### API route
- `GET /api/user-access/[email]` → `apps/tere-project/src/app/api/user-access/[email]/route.ts`

### Server module
- `apps/tere-project/src/server/modules/user-access/user-access.service.ts`

### Auth HOFs
- `apps/tere-project/src/server/auth/with-role.ts`

### Notes
- **Lead vs non-Lead gating**: when a feature needs to behave differently for Leads, gate on `member.isLead` (from the `members` table, exposed via `useMemberProfile()` / `members.me` API), **NOT** on `UserAccess.role`. `isLead` is the canonical source of truth for this distinction in product features; `UserAccess.role` is a separate concept and must not be overloaded for it.

---

## WP Configs

Two parallel modules: **Target WP** and **WP Weight**.

### API routes — Target WP
- `GET|POST /api/target-wp-config` → `apps/tere-project/src/app/api/target-wp-config/route.ts` (GET `withAuth`; POST `withLead` — Lead-only, SLS-16645; POST plumbs `user.email` as `changedBy`, SLS-16639; service rejects any rate ≤ 0, SLS-16646)
- `DELETE|PUT /api/target-wp-config/[id]` → `[id]/route.ts` (`withLead` — Lead-only, SLS-16645; plumbs `changedBy`. DELETE: unconditional, no server-side immutability guard, client-side only. PUT (Phase 2, SLS-16680): body mirrors POST `{effective_date, rates}`, 200 on success, 404 `NOT_FOUND` if id missing, 400 `VALIDATION_ERROR` if any rate ≤ 0, pre-check 400 if fields missing — audited as `action='update'` with old+new snapshot)
- `GET /api/target-wp-config/effective` → effective config for current board
- `GET /api/target-wp-config/audit-log` → `apps/tere-project/src/app/api/target-wp-config/audit-log/route.ts` — thin wrapper, `withLead` guard (SLS-16639)

### API routes — WP Weight
- `GET|POST /api/wp-weight-config` → `apps/tere-project/src/app/api/wp-weight-config/route.ts`
- `DELETE /api/wp-weight-config/[id]` → `apps/tere-project/src/app/api/wp-weight-config/[id]/route.ts`
- `GET /api/wp-weight-config/effective` → `apps/tere-project/src/app/api/wp-weight-config/effective/route.ts`
- `GET /api/wp-weight-config/audit-log` → `apps/tere-project/src/app/api/wp-weight-config/audit-log/route.ts` — Lead-only, 20-row keyset pagination

### Server modules
- `apps/tere-project/src/server/modules/target-wp-config/`
  - `target-wp-config.service.ts`, `target-wp-config.repository.ts`
  - `target-wp-config-http.ts` — `withLead` (reuses `withRole('Lead', ...)`), mirrors `holidays-http.ts`/`wp-weight-config-http.ts` pattern; `withLead` now guards all mutation routes (POST/DELETE/PUT, SLS-16645/16680) as well as the audit-log route (SLS-16639)
  - Phase 2 (SLS-16678..16680): `repository.updateWithAudit(id, effective_date, rates, changedBy)` — audit-aware, mirrors create/deleteWithAudit (1 `db.transaction`: read pre-update row for old snapshot, update, insert 1 `config_audit_log` row `action='update'` with old+new snapshot); returns `null` if id not found (no write/audit). `service.update(id, effective_date, rates, changedBy)` reuses create's rate>0 validation (shared `assertPositiveRates`), throws `NOT_FOUND` (404) if repo returns null. `TargetWpConfigErrorCode` union now includes `'NOT_FOUND'`.
- `apps/tere-project/src/server/modules/wp-weight-config/` — management/effective/audit service, repository, HTTP normalization, and checks
- `apps/tere-project/src/server/modules/config-audit-log/` — SLS-16620: entity-agnostic shared audit-log module (`fetchConfigAuditLog<T>(entityType, cursor)`, `decodeAuditCursor`, `InvalidAuditCursorError`, `paginate` — page size 20, `{v,changed_at,id}` base64url cursor). `wp-weight-config.repository.ts`/`.service.ts` delegate to it; future audit-log consumers (holiday/target-wp, PRD-04) should reuse this instead of re-implementing cursor/pagination logic.

### RBAC note
- Target WP mutation routes (POST/DELETE) are `withLead` (Lead-only, SLS-16645), matching WP Weight. Holiday mutation routes still use `withAuth` (any signed-in user) — its `changed_by` can be any authenticated user, not Lead-only.

### WP Weight audit storage and index
- `apps/tere-project/drizzle/0005_config_audit_log.sql` — Phase 2 atomic create/delete snapshots; no backfill
- `apps/tere-project/drizzle/0006_wp_weight_audit_cursor_index.sql` — Phase 3 partial `(changed_at DESC, id DESC)` index for `wp_weight_config`
- `apps/tere-project/drizzle/0007_config_audit_log_widen_entity_types.sql` — widens `config_audit_log_entity_supported` check to `wp_weight_config`/`holiday`/`target_wp_config`; replaces the partial cursor index with composite `config_audit_log_cursor_idx (entity_type, changed_at DESC, id DESC)` valid for all entity types. Still create/delete snapshot only — no update/diff semantics added.
- `apps/tere-project/drizzle/0008_config_audit_log_allow_update.sql` — SLS-16678: widens `config_audit_log_action_supported` to include `'update'`; widens `config_audit_log_snapshot_shape` with an `update` branch (old_value AND new_value both NOT NULL). Shared table — only Target WP's Phase 2 PUT uses `action='update'` so far; holiday/wp_weight_config unaffected (still create/delete only).
- `apps/tere-project/src/server/db/schema.ts` — audit table and matching cursor index declaration, check constraints (`config_audit_log_action_supported`/`config_audit_log_snapshot_shape`) kept in sync with 0008

### Frontend hooks
- `apps/tere-project/src/features/dashboard/hooks/useTargetWpConfig.ts`
- `apps/tere-project/src/features/dashboard/hooks/useWpWeightConfig.ts`

### Target WP rollout QA (Phase 1 UI SLS-16673..16677 + Phase 2 Edit/PUT SLS-16685/16686, both authored ahead of/alongside implementation)
- `apps/tere-project/scripts/target-wp-config-ui.contract.mjs` — non-audit live API checks. Phase 1: server-side `rate > 0` rejection (defense-in-depth vs client bypass), list `effective_date` DESC ordering, dynamic/disjoint rate-key rendering, POST/DELETE RBAC (`withLead`, resolved — no longer `withAuth`). Phase 2: PUT happy path, PUT rate<=0 rejection, PUT unknown-id 404, PUT non-Lead 403. Complements `target-wp-config-audit.contract.mjs` (audit-entry assertions only) without duplicating it.
- `apps/tere-project/src/features/configuration/TARGET_WP_CONFIG_QA_MATRIX.md` — Phase 1 table/badges/create/delete/error-handling/audit-integration matrix, plus a Phase 2 "Edit / PUT support" section (EDIT-00..EDIT-AUDIT-08). `TargetWpConfigPanel.tsx` has a working edit `<Modal>` (open/submit wired to `editingRecord`/`editForm`/`handleEdit`) — EDIT-00 passes. Phase 2 section flags: (a) EDIT-03 disjoint-rate-key bug (edit form derived fields from the global-union `rateKeys` instead of `editingRecord.rates`' own keys) found and fixed in the same round; (b) malformed `action='update'` audit-insert rejection (`config_audit_log_snapshot_shape`) needs an isolated-DB test mirroring `wp-weight-config-audit.contract.test.ts`/`holidays-audit.contract.test.ts`, flagged as BE-owned (not created by this QA pass, out of the given script-only scope); (c) shared `AuditLogEntry<T>['action']` type still `'create' | 'delete'`, missing `'update'`.

### WP Weight rollout QA
- `apps/tere-project/scripts/wp-weight-config.contract.mjs` — safe live API/auth/shape checks, including Phase 3 audit log
- `apps/tere-project/src/server/modules/wp-weight-config/wp-weight-config-audit.contract.test.ts` — gated isolated-DB atomicity and keyset pagination contract
- `apps/tere-project/src/features/configuration/WP_WEIGHT_CONFIG_QA_MATRIX.md` — Phase 1–3 API/UI/manual accessibility matrix

---

## Configuration

Tab-switcher around `/dashboard/configuration?tab={id}`. Holiday reuses Holiday Management, WP Weight management shipped in Phase 1, its atomic audit trail shipped in Phase 2, the read-only Audit Log UI shipped Phase 3, and Target WP Config Management UI shipped Phase 1 (SLS-16647..16672, Epic SLS-16468) — folded into the same shared Audit Log tab, no sub-tab.

### Page
- `apps/tere-project/src/app/dashboard/configuration/page.tsx` — `RoleBasedRoute allowedRoles={['Lead']}` + `Suspense` wrapping `ConfigurationTabs` (required since it reads `useSearchParams`)

### Feature module
- `apps/tere-project/src/features/configuration/`
  - `components/ConfigurationTabs.tsx` — resolves `?tab=`, renders Holiday, WP Weight management, Target WP management, or the shared Audit Log tab (WP Weight + Target WP audit panels stacked).
  - `components/WpWeightConfigPanel.tsx` + `WpWeightConfigPanel.api.ts` — Phase 1 Lead-only create/list/delete UI and query/mutation hooks. Static `WEIGHT_KEYS`.
  - `components/TargetWpConfigPanel.tsx` + `TargetWpConfigPanel.api.ts` — Phase 1 (SLS-16647..16672) create/list/delete + Phase 2 (SLS-16681..16684) edit, over `GET|POST /api/target-wp-config`, `PUT|DELETE /api/target-wp-config/[id]`, `GET /api/target-wp-config/effective?date=`. `rates` keys are **dynamic** (from API, no hardcoded key list like WP Weight's `WEIGHT_KEYS`) — table columns and create/edit-modal fields derived via `rateKeysFrom()`. Row badges: "Aktif" (`findActiveConfig()` — pure client-side derivation from already-fetched sorted list, greatest `effective_date <= today`, mirrors `target-wp-config.repository.ts` `getEffectiveRates()`; no second endpoint/value-match) and "Sudah lewat" (`isPastDate()` — independent, `effective_date < today`). Delete disabled/non-actionable on the active row (no immutability guard server-side — client-only rule); extra warning shown when deleting a past-dated non-active row (historical usage). Edit button available on every row (including active) via `useUpdateTargetWpConfig()` (mirrors create/delete mutation structure, same `QUERY_KEY` invalidation); edit modal pre-fills `effective_date`/rates, shows a non-blocking warning (reuses `isPastDate()`) when editing a past-dated row, and has NO future-date guard (that guard is create-only). Lead-only via `member.isLead` (not `UserAccess.role`), mirrors `WpWeightConfigPanel` create/delete pending + error-retention (no reset) pattern, extended to edit.
  - `components/ConfigAuditLogPanel.tsx` — SLS-16621 generic `<T>` audit-log table (base columns: Changed at/Action/Changed by + caller-supplied `snapshotColumns`); server order, WIB `<time>`, loading/error/empty/load-more states. Props: `{ entityType: 'wp-weight-config'|'holiday'|'target-wp-config', label, snapshotColumns }`.
  - `components/ConfigAuditLogPanel.api.ts` — generic `useConfigAuditLog<T>(entityType)` infinite query, key `[entityType,'audit-log']`, API path `/${entityType}/audit-log` (via `API_PATH` map — `target-wp-config` is 1:1, unlike `holiday`→`holidays`), opaque server cursor. Exports `ConfigAuditEntry<T>`, `snapshot()`, `configAuditErrorMessage()`.
  - `components/WpWeightAuditLogPanel.tsx` — Phase 3 thin wrapper: calls `ConfigAuditLogPanel` with `entityType="wp-weight-config"`, `label="WP Weight"`, WP-weight `snapshotColumns` (Effective date + weight keys). No own API file anymore (folded into `ConfigAuditLogPanel.api.ts`).
  - `components/TargetWpAuditLogPanel.tsx` — SLS-16672 wrapper: calls own `useConfigAuditLog<TargetWpConfig>('target-wp-config')` (same query key as the `ConfigAuditLogPanel` it renders, so no duplicate fetch) only to derive dynamic rate-key columns from loaded snapshots, then renders `ConfigAuditLogPanel` with `entityType="target-wp-config"`, `label="Target WP"`. Rendered stacked with `WpWeightAuditLogPanel` inside `ConfigurationTabs.tsx`'s `audit-log` tab — no separate sub-tab.
  - `components/HolidayAuditLogPanel.tsx` — SLS-16619/16621 thin wrapper: calls `ConfigAuditLogPanel` with `entityType="holiday"`, `label="Holiday"`, Holiday `snapshotColumns` (Date/Name/National holiday from `holiday_date`/`holiday_name`/`is_national_holiday`). Rendered inside `ConfigurationTabs.tsx` under the List/Calendar toggle for `activeTab === 'holiday'` (both modes). **Known defect**: `entityType="holiday"` (singular) drives the request URL `/${entityType}/audit-log` → `/api/holiday/audit-log`, but the real route folder is plural `/api/holidays/audit-log` — see `HOLIDAY_AUDIT_QA_MATRIX.md`.
  - `components/ComingSoon.tsx` — generic "coming soon" stub, no API call. No longer used by any `ConfigurationTabs.tsx` tab (Target WP shipped) — kept for future stub tabs.

### Holiday audit QA
- `apps/tere-project/src/features/configuration/HOLIDAY_AUDIT_QA_MATRIX.md` — SLS-16619 Phase 1 UI/a11y matrix adapted from `WP_WEIGHT_CONFIG_QA_MATRIX.md`'s `P3-UI-01..08`/`P3-A11Y-01`; documents the `entityType` singular/plural route mismatch above and a WP Weight regression check.

### Shared constants
- `apps/tere-project/src/shared/constants/configuration-tabs.ts` — `CONFIG_TABS`, `ConfigTabId`, `DEFAULT_CONFIG_TAB` ('holiday'). Contract shared with the `/dashboard/holiday-management` → `/dashboard/configuration?tab=holiday` redirect.

### Notes
- `/dashboard/holiday-management` is now a server-side redirect to `/dashboard/configuration?tab=holiday` (done in SLS-16500).

---

## Boards

### API routes
- `GET /api/boards` → `apps/tere-project/src/app/api/boards/route.ts`
- `POST /api/boards/seed` → `apps/tere-project/src/app/api/boards/seed/route.ts`

### Server module
- `apps/tere-project/src/server/modules/boards/`
  - `boards.service.ts`, `boards.repository.ts`

### Frontend hook
- `apps/tere-project/src/features/dashboard/hooks/useBoards.ts`

### Shared types
- `apps/tere-project/src/shared/types/board.types.ts`

---

## Sprint

### API routes
- `GET /api/project` → project metadata
- `GET /api/project/sprint` → single sprint
- `GET /api/project/sprint/batch` → multiple sprints

### Server module
- `apps/tere-project/src/server/modules/sprint/`
  - `sprint.service.ts`, `sprint.repository.ts`

### Frontend hooks
- `apps/tere-project/src/features/dashboard/hooks/useSprintFetch.ts`
- `apps/tere-project/src/features/dashboard/hooks/useMultiTeamSprintFetch.ts`
- `apps/tere-project/src/features/dashboard/hooks/useSprintDataTransform.ts`
- `apps/tere-project/src/features/dashboard/hooks/useMultiSprintDataTransform.ts`

### Shared types
- `apps/tere-project/src/shared/types/sprint.types.ts`

---

## Search

### API routes
- `GET /api/search/tickets` → `apps/tere-project/src/app/api/search/tickets/route.ts`
- `GET /api/search/tickets/[key]` → single ticket lookup

### Server module
- `apps/tere-project/src/server/modules/search/`
  - `search.service.ts`, `search.repository.ts`

### Frontend
- `apps/tere-project/src/features/dashboard/components/GlobalSearch.tsx`
- `apps/tere-project/src/features/dashboard/hooks/useGlobalSearch.ts`

### Shared types
- `apps/tere-project/src/shared/types/search.types.ts`

---

## Auth

### Pages
- `apps/tere-project/src/app/sign-in/page.tsx`
- `apps/tere-project/src/app/sign-in/Stat3DScene.tsx` — interactive R3F scene on sign-in left panel (hover bars/sphere, parallax on mouse)
- `apps/tere-project/src/app/sign-up/page.tsx`

### Middleware (session enforcement)
- `apps/tere-project/src/middleware.ts`

### Frontend
- `apps/tere-project/src/lib/auth.ts`
- `apps/tere-project/src/lib/firebase.ts` (client SDK init)
- `apps/tere-project/src/hooks/useUser.ts`
- `apps/tere-project/src/store/userStore.ts` (Zustand)
- `apps/tere-project/src/components/buttonLoginGoogle.tsx`

### API routes
- `POST /api/auth/session` → set/clear session cookie
- `GET /api/auth/is-admin` → admin check

### Server / admin SDK
- `apps/tere-project/src/lib/firebaseAdmin.ts`
- `apps/tere-project/src/server/lib/firebase-admin.ts`
- `apps/tere-project/src/server/auth/with-auth.ts`

---

## Beras UI

**Private presentational package and internal catalog. Phase 1 is isolated from Tere: no file under `apps/tere-project/**` is an implementation target, and no Phase 2 consumer adoption is implied.**

### Workspace and package boundary
- `apps/beras-ui/package.json` — `@krasnaya/beras-ui@0.1.0`, private workspace, exact dependency allowlist and verification scripts
- `apps/beras-ui/next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts` — Next 16 catalog/tooling configuration
- `apps/beras-ui/src/public/index.ts` — explicit convenience entrypoint
- `apps/beras-ui/src/public/components.ts` — explicit component exports grouped by implementation family
- `apps/beras-ui/src/public/layouts.ts` — explicit shell/auth/composition exports
- `apps/beras-ui/src/public/foundations.ts` — token metadata, breakpoints, semantic variant types
- `apps/beras-ui/src/public/types.ts` — public props, view models, shared callbacks, data/chart/calendar/tree/ADF contracts
- `apps/beras-ui/src/styles/index.css` — only shipped stylesheet entrypoint (`@krasnaya/beras-ui/styles.css`)

### Phase 1 feature paths
- `apps/beras-ui/src/components/` — presentational family implementations; no Tere runtime/business objects
- `apps/beras-ui/src/layouts/` — responsive shell, auth, and fixture-driven page compositions
- `apps/beras-ui/src/foundations/` and `src/styles/` — light-only semantic tokens and scoped `.beras-*` CSS
- `apps/beras-ui/src/catalog/` and `src/app/` — internal catalog registry and routes, consuming public package entrypoints only
- `apps/beras-ui/src/fixtures/` — deterministic local display data
- `apps/beras-ui/src/inventory/` — frozen baseline manifest/ledger and stable schemas
- `apps/beras-ui/scripts/`, `tests/`, `evidence/phase-1/` — validators, native Node checks, and assembled browser evidence

### Commands
- Root convenience: `npm run beras:dev`, `npm run beras:build`, `npm run beras:verify`
- Workspace checks: `lint`, `typecheck`, `test`, `verify:inventory`, `verify:catalog`, `verify:boundaries`, `verify:isolation`, `verify:evidence`

---

## MCP Server

### Package
- `apps/mcp-server/` — published as `@esjn/mcp-tere-report`

### Entrypoint
- `apps/mcp-server/src/index.ts` — registers tools with MCP SDK

### Tools
- `apps/mcp-server/src/tools/list-sprints.ts`
- `apps/mcp-server/src/tools/get-sprint-report.ts`
- `apps/mcp-server/src/tools/get-open-sprint-report.ts`
- `apps/mcp-server/src/tools/get-productivity-summary.ts`
- `apps/mcp-server/src/tools/get-talent-leave.ts`
- `apps/mcp-server/src/tools/get-talent-date-leave.ts`
- `apps/mcp-server/src/tools/get-epics.ts`

### Shared
- `apps/mcp-server/src/lib/api-client.ts` — calls Tere API (uses API key)
- `apps/mcp-server/src/lib/config.ts`
- `apps/mcp-server/src/lib/date-range-resolver.ts`
- `apps/mcp-server/src/lib/sprint-resolver.ts`
- `apps/mcp-server/src/types/report.types.ts`

### Build / release
- `npm run mcp:build` / `mcp:start` / `mcp:release[:minor|:major]`

---

## 🔌 Cross-cutting / Shared Layer

### Auth HOFs (`apps/tere-project/src/server/auth/`)
| File | Purpose |
|---|---|
| `with-auth.ts` | Require signed-in user |
| `with-api-key.ts` | Require valid API key |
| `with-auth-or-api-key.ts` | Either accepted |
| `with-role.ts` | Require specific role (RBAC) |

### Server libs (`apps/tere-project/src/server/lib/`)
| File | Purpose |
|---|---|
| `firebase-admin.ts` | Firebase Admin SDK init (Auth only — Firestore removed) |
| `db.ts` | Drizzle/Postgres client (Supabase) — singleton |
| `jira.client.ts` | Jira REST client |
| `google-oauth.client.ts` | Google OAuth (for Sheets export) |
| `cache.ts` | Cache wrapper |

### Database
- Schema: `apps/tere-project/src/server/db/schema.ts`
- Migrations: `apps/tere-project/drizzle/`
- Config: `apps/tere-project/drizzle.config.ts`
- Generate: `cd apps/tere-project && npx drizzle-kit generate`
- Apply: `cd apps/tere-project && npx drizzle-kit migrate`

### Server infrastructure
- `apps/tere-project/src/server/cache/server-cache.ts`
- `apps/tere-project/src/server/rate-limit/rate-limiter.ts`

### Shared frontend libs (`apps/tere-project/src/lib/`)
| File | Purpose |
|---|---|
| `auth.ts` | Auth helpers |
| `axiosClient.ts` | Configured axios |
| `firebase.ts` | Firebase client SDK |
| `firebaseAdmin.ts` | Firebase Admin (server-only callers) |
| `user-access.client.ts` | RBAC client helpers |
| `utils.ts` | `cn()` and general helpers |

### Shared types (`apps/tere-project/src/shared/types/`)
`api-key.types.ts`, `board.types.ts`, `bug-monitoring.types.ts`, `common.types.ts`, `dashboard.types.ts`, `member.types.ts`, `report.types.ts`, `search.types.ts`, `sprint.types.ts`, `talent-leave.types.ts`

### Shared utils
- `apps/tere-project/src/shared/utils/working-days.util.ts`
- `apps/tere-project/src/shared/utils/appendix-level.ts`
- `apps/tere-project/src/shared/utils/kanban-cycle.util.ts`

### App-wide UI components (`apps/tere-project/src/components/`)
`sidebar.tsx`, `topbar.tsx`, `LoadingScreen.tsx`, `PageSkeleton.tsx`, `loadingBar.tsx`, `loadingBounce.tsx`, `ThemeToggle.tsx`, `AxiosErrorInterceptor.tsx`, `LegalModal.tsx`, `RoleBasedRoute.tsx`, `buttonLoginGoogle.tsx`, `maintenancePage.tsx`

### Shared hooks (`apps/tere-project/src/hooks/`)
`useTheme.tsx`, `useUser.ts`, `useUserAccess.ts`

---

## 🛠 Maintenance Rules for this Index

**Update this file in the SAME response when you:**
- Add a new `app/api/<x>/route.ts` → add it to the matching feature's "API routes" list
- Add a new file under `src/server/modules/<x>/` → add to "Server module"
- Add/move files under `src/features/<x>/` → update the feature's "Feature module" list
- Add a new page under `src/app/dashboard/<x>/` → update "Pages"
- Add a new shared type / util / lib / hook / component → update the matching cross-cutting section
- Add a new MCP tool → update [MCP Server](#mcp-server)
- Introduce a brand-new feature → add a new top-level section AND add it to "Quick Navigation"
- Delete / rename anything above → remove or update the entry

**Do NOT update for:**
- Edits inside an already-listed file (the path didn't change)
- Test file additions colocated with already-listed source files (unless the feature has no entries yet)

If a path here doesn't exist anymore, **delete the line first**, then proceed with the task. Stale pointers are worse than no pointers.
