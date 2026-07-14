# Feature Index — Where Things Live

**Purpose**: For any task, find the feature here and you get the exact files to read/modify. No scanning needed.

**Convention**: Each entry maps **frontend page → feature module → API routes → server module → shared types**. Update this file in the same response when you add/remove/move files.

---

## 🧭 Quick Navigation (by user intent)

| Intent | Feature |
|---|---|
| Sprint reports / story-point dashboard | [Dashboard / Reports](#dashboard--reports) |
| Sprint-over-sprint velocity trend | [Dashboard / Reports](#dashboard--reports) |
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
- `GET|POST /api/holidays` → `apps/tere-project/src/app/api/holidays/route.ts`
- `GET|PUT|DELETE /api/holidays/[id]` → `apps/tere-project/src/app/api/holidays/[id]/route.ts`
- `POST /api/holidays/bulk` → `apps/tere-project/src/app/api/holidays/bulk/route.ts`

### Server module
- `apps/tere-project/src/server/modules/holidays/`
  - `holidays.service.ts`, `holidays.repository.ts`

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
- `GET|POST /api/target-wp-config` → `apps/tere-project/src/app/api/target-wp-config/route.ts`
- `GET|PUT|DELETE /api/target-wp-config/[id]` → `[id]/route.ts`
- `GET /api/target-wp-config/effective` → effective config for current board

### API routes — WP Weight
- `GET|POST /api/wp-weight-config` → `apps/tere-project/src/app/api/wp-weight-config/route.ts`
- `DELETE /api/wp-weight-config/[id]` → `apps/tere-project/src/app/api/wp-weight-config/[id]/route.ts`
- `GET /api/wp-weight-config/effective` → `apps/tere-project/src/app/api/wp-weight-config/effective/route.ts`
- `GET /api/wp-weight-config/audit-log` → `apps/tere-project/src/app/api/wp-weight-config/audit-log/route.ts` — Lead-only, 20-row keyset pagination

### Server modules
- `apps/tere-project/src/server/modules/target-wp-config/`
- `apps/tere-project/src/server/modules/wp-weight-config/` — management/effective/audit service, repository, HTTP normalization, and checks

### WP Weight audit storage and index
- `apps/tere-project/drizzle/0005_config_audit_log.sql` — Phase 2 atomic create/delete snapshots; no backfill
- `apps/tere-project/drizzle/0006_wp_weight_audit_cursor_index.sql` — Phase 3 partial `(changed_at DESC, id DESC)` index for `wp_weight_config`
- `apps/tere-project/src/server/db/schema.ts` — audit table and matching cursor index declaration

### Frontend hooks
- `apps/tere-project/src/features/dashboard/hooks/useTargetWpConfig.ts`
- `apps/tere-project/src/features/dashboard/hooks/useWpWeightConfig.ts`

### WP Weight rollout QA
- `apps/tere-project/scripts/wp-weight-config.contract.mjs` — safe live API/auth/shape checks, including Phase 3 audit log
- `apps/tere-project/src/server/modules/wp-weight-config/wp-weight-config-audit.contract.test.ts` — gated isolated-DB atomicity and keyset pagination contract
- `apps/tere-project/src/features/configuration/WP_WEIGHT_CONFIG_QA_MATRIX.md` — Phase 1–3 API/UI/manual accessibility matrix

---

## Configuration

Tab-switcher around `/dashboard/configuration?tab={id}`. Holiday reuses Holiday Management, WP Weight management shipped in Phase 1, its atomic audit trail shipped in Phase 2, and the read-only Audit Log UI is the final Phase 3. Target WP remains a stub and is outside this rollout.

### Page
- `apps/tere-project/src/app/dashboard/configuration/page.tsx` — `RoleBasedRoute allowedRoles={['Lead']}` + `Suspense` wrapping `ConfigurationTabs` (required since it reads `useSearchParams`)

### Feature module
- `apps/tere-project/src/features/configuration/`
  - `components/ConfigurationTabs.tsx` — resolves `?tab=`, renders Holiday, WP Weight management, or WP Weight Audit Log; Target WP alone remains `ComingSoon`.
  - `components/WpWeightConfigPanel.tsx` + `WpWeightConfigPanel.api.ts` — Phase 1 Lead-only create/list/delete UI and query/mutation hooks.
  - `components/WpWeightAuditLogPanel.tsx` — Phase 3 read-only table; server order, WIB `<time>`, loading/error/empty/load-more states.
  - `components/WpWeightAuditLogPanel.api.ts` — infinite query using `['wp-weight-config','audit-log']` and opaque server cursor.
  - `components/ComingSoon.tsx` — generic "coming soon" stub, no API call.

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
