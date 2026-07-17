# Project Context Knowledge

## Config Audit Log / Configuration Menu Audit — feature already SHIPPED (WP Weight only)

**Status: existing, done, not greenfield.** JIRA Epic SLS-16468, "Configuration Menu" rollout.
Phase 1 (WP Weight mgmt CRUD) → Phase 2 (atomic audit trail on create/delete) → Phase 3
(read-only Audit Log UI) all shipped. Recent commits: `2537c32` feat Phase 2 audit trail,
`ca279d4` feat Phase 3 audit API, `cb78331` feat Phase 3 audit UI, `970983a` test Phase 3
audit flow.

If a new task says "build Config Audit Log", check FIRST whether it means:
(a) extend audit to a config type beyond WP Weight (Target WP, Holiday, etc.) — schema currently
    HARD-LOCKS to wp_weight_config only (see check constraint below), so this is real new work, or
(b) tweak/fix the existing WP Weight audit log — then it's a bug-fix/enhancement, not new build.
Ask the user which, don't assume.

### Data model
- Table `config_audit_log` in `apps/tere-project/src/server/db/schema.ts` (line ~117), Postgres via Drizzle.
- Columns include `changed_by`, `entity_type`, `action`, `changed_at`, snapshot payload.
- CHECK constraints (DB-enforced, not just app-level):
  - `config_audit_log_actor_nonblank` — changed_by non-blank
  - `config_audit_log_entity_supported` — widened by migration `0007_config_audit_log_widen_entity_types.sql` to `entity_type IN ('wp_weight_config','holiday','target_wp_config')`. Generalizing to a 4th entity = new migration + constraint change again.
  - `config_audit_log_action_supported` — action in `('create','delete')` only (no `update`, because WP weight configs are immutable — future configs get replaced via delete+create, not update)
  - `config_audit_log_snapshot_shape` — shape check on snapshot column
- Migrations: `apps/tere-project/drizzle/0005_config_audit_log.sql` (Phase 2, atomic create/delete snapshots, no backfill), `apps/tere-project/drizzle/0006_wp_weight_audit_cursor_index.sql` (Phase 3, partial index scoped to `wp_weight_config`, superseded), `apps/tere-project/drizzle/0007_config_audit_log_widen_entity_types.sql` (widens entity check + replaces partial index with composite `config_audit_log_cursor_idx (entity_type, changed_at DESC, id DESC)` valid for all 3 entity types).
- Shared audit module (SLS-16620): `apps/tere-project/src/server/modules/config-audit-log/` — `fetchConfigAuditLog<T>(entityType, cursor)`, `decodeAuditCursor`, `paginate` (page size 20), `InvalidAuditCursorError`. Both `wp-weight-config` and `target-wp-config` repos/services now delegate to this instead of reimplementing cursor logic. Holiday module (`holidays.repository.ts`) does NOT yet delegate — has its own audit writes, but entity is DB-supported.

### Backend
- `apps/tere-project/src/server/modules/wp-weight-config/wp-weight-config.repository.ts` — `fetchAuditLog`, `createWithAudit`, `deleteFutureWithAudit` (atomic write of config + audit row in same transaction).
- `apps/tere-project/src/server/modules/wp-weight-config/wp-weight-config.service.ts`:
  - `fetchAuditLog(cursor)` — cursor is opaque base64url-encoded JSON `{v:1, changed_at, id}`, strictly validated (regex charset, length ≤512, JSON shape exact-keys, RFC3339 microsecond timestamp pattern, UUID pattern for id). Invalid cursor → `WpWeightConfigError('VALIDATION_ERROR', ..., 400)`.
  - Page size hardcoded to 20 (`rows.slice(0, 20)`); `next_cursor` built from 20th item when more rows exist, else `null`.
  - Delete is soft-blocked: only *future* (not-yet-effective) configs can be deleted (`deleteFutureWithAudit`); active/historical configs throw `IMMUTABLE_CONFIG` (409).
- Auth: `withLead` HOF from `apps/tere-project/src/server/modules/wp-weight-config/wp-weight-config-http.ts` — audit log endpoint is **Lead-only** (RBAC via `member.isLead`, per project convention — NOT `UserAccess.role`, see feature-index.md "User Access (RBAC)" notes).
- Route: `GET /api/wp-weight-config/audit-log` → `apps/tere-project/src/app/api/wp-weight-config/audit-log/route.ts` (2-line thin wrapper, `dynamic = 'force-dynamic'`, reads `cursor` query param, calls service, `Response.json`).

### Frontend
- `apps/tere-project/src/features/configuration/components/WpWeightAuditLogPanel.tsx` — read-only table, server-determined order (no client sort), timestamps rendered in WIB via `<time>`, loading/error/empty/load-more states.
- `apps/tere-project/src/features/configuration/components/WpWeightAuditLogPanel.api.ts` — TanStack Query `useInfiniteQuery`, query key `['wp-weight-config','audit-log']`, treats cursor as opaque (never decodes/inspects client-side).
- Rendered inside `apps/tere-project/src/features/configuration/components/ConfigurationTabs.tsx`, tab-switched via `/dashboard/configuration?tab={id}` (constants: `apps/tere-project/src/shared/constants/configuration-tabs.ts` — `CONFIG_TABS`, `ConfigTabId`, `DEFAULT_CONFIG_TAB='holiday'`).
- Page: `apps/tere-project/src/app/dashboard/configuration/page.tsx` — `RoleBasedRoute allowedRoles={['Lead']}` + `Suspense` (required because `ConfigurationTabs` calls `useSearchParams`).
- Target WP tab remains `ComingSoon` stub in the UI — **backend audit is DONE** (SLS-16637/16638/16639, see new section below), only the UI panel is missing. This is exactly the gap `Target WP Config Management UI` task fills.

### QA / test artifacts already in repo
- `apps/tere-project/scripts/wp-weight-config.contract.mjs` — live API/auth/shape contract checks incl. Phase 3 audit log.
- `apps/tere-project/src/server/modules/wp-weight-config/wp-weight-config-audit.contract.test.ts` — gated isolated-DB atomicity + keyset pagination test.
- `apps/tere-project/src/features/configuration/WP_WEIGHT_CONFIG_QA_MATRIX.md` — Phase 1–3 API/UI/manual accessibility matrix.

## Codebase conventions (general, apply to any new TRD in this repo)
- Monorepo, npm workspaces, no Turborepo/NestJS/packages dir.
- Stack: Next.js 16 (App Router) + React 19 + TS 5, Tailwind + antd, Zustand (client state) + TanStack Query (server state), Drizzle ORM over Supabase Postgres, Firebase Auth (Google sign-in only, no Firestore).
- New API endpoint pattern: thin `src/app/api/<resource>/route.ts` wrapping `src/server/modules/<feature>/<feature>.service.ts`, auth via HOF (`with-auth` / `with-api-key` / `with-auth-or-api-key` / `with-role`) or feature-specific HOF (e.g. `withLead`).
- New feature module pattern: `src/server/modules/<feature>/` (`.service.ts` always, `.repository.ts` if persisted, `clients/`, `utils/`) + `src/features/<feature>/` (`components/`, `hooks/`, `store/`, `types/`, `api/` client wrapper) + shared types in `src/shared/types/`.
- Naming: components PascalCase.tsx, hooks useFoo.ts, services/repos kebab-case.ts, feature dirs kebab-case.
- feature-index.md is the authoritative map — MUST be updated in same response as any file add/move/delete under the tracked directories.

## Target WP Config Management UI — task scope (backend done, UI is the gap)

**What exists (backend, SLS-16637..16640, all on `development`, not pushed):**
- Table `target_wp_config` (`apps/tere-project/src/server/db/schema.ts` ~line 103): `id uuid`, `effective_date date` (NOT unique — unlike `wp_weight_config.effective_date`, no dedupe/conflict check), `rates jsonb` — `rates` is `Record<string, number>`, dynamic keys (not a fixed enum like WP Weight's `WEIGHT_KEYS`). Default rate keys seen in code: `junior`, `medior`, `senior`, `individual contributor` (`DEFAULT_RATES` in both repository.ts and useTargetWpConfig.ts — kept in sync manually, no shared const).
- Repository `apps/tere-project/src/server/modules/target-wp-config/target-wp-config.repository.ts`: `fetchAll`, `getEffectiveRates(sprintStartDate)` (picks latest config with `effective_date <= sprintStartDate`, falls back to `DEFAULT_RATES`), `createWithAudit`, `deleteWithAudit` (delegates audit read to shared `fetchConfigAuditLog<TargetWpConfig>('target_wp_config', cursor)`).
- Service `target-wp-config.service.ts`: in-process `MemoryCache` (60 min TTL, key `'all'` / `rates_<date>`), invalidated on create/delete. `TargetWpConfigError` class (`code: 'VALIDATION_ERROR'`, used only for bad audit cursor today). `fetchAuditLog(cursor)` reuses shared `decodeAuditCursor`/`paginate` from `config-audit-log` module.
- HTTP guard `target-wp-config-http.ts`: exports only `withLead` (mirrors `holidays-http.ts`/`wp-weight-config-http.ts`), used ONLY by the audit-log route. **Mutation routes (`POST`, `DELETE`) stay on plain `withAuth`** — any signed-in user can create/delete Target WP config, not Lead-gated. This differs from WP Weight's `POST` which IS Lead-gated. Confirmed intentional per feature-index.md RBAC note.
- Routes:
  - `GET|POST /api/target-wp-config` → `route.ts` — `withAuth`; POST validates only `effective_date && rates` truthy (no per-rate-key numeric validation, no future-date requirement unlike WP Weight's `isFutureWibDate` check); plumbs `user.email!` as `changedBy`.
  - `DELETE /api/target-wp-config/[id]` → `[id]/route.ts` — `withAuth`; **unconditional delete, no immutability guard** (WP Weight blocks deleting active/historical configs with 409 `IMMUTABLE_CONFIG`; Target WP does not — can delete a config that's currently in effect).
  - `GET /api/target-wp-config/effective?date=` → `effective/route.ts` — `withAuth`; returns `TargetWpRates` for given date, used by `useTargetWpConfig.ts` hook (dashboard-side consumer, unrelated to the config-management UI itself).
  - `GET /api/target-wp-config/audit-log?cursor=` → `audit-log/route.ts` — `withLead`, thin wrapper.
- No dedicated frontend `api/` wrapper file exists yet for Target WP CRUD (only the read-only `useTargetWpConfig.ts` hook for `effective` endpoint, used elsewhere in dashboard — NOT part of this config-management task).

**What's missing (this task's actual scope):**
- `ConfigurationTabs.tsx` line `activeTab === 'target-wp' && <ComingSoon label="Target WP Config" />` — needs to become a real management panel, same shape as `WpWeightConfigPanel.tsx`.
- No `TargetWpConfigPanel.tsx` / `TargetWpConfigPanel.api.ts` — build mirroring `WpWeightConfigPanel.tsx` + `WpWeightConfigPanel.api.ts` 1:1 in structure (React Query `useQuery`/`useMutation`, antd `Table`/`Modal`/`Form`, `errorMessage()` helper mapping status codes to copy). Key differences to encode: dynamic rate-key columns (not fixed `WEIGHT_KEYS`), no future-date-only create rule (unless product wants to add one — not currently enforced server-side, ASK if UI should still enforce it for parity/UX), no immutability guard on delete (server allows deleting any row — UI should decide whether to still show a confirm-only Popconfirm for ALL rows, not just future ones, since there's no "Immutable" branch possible server-side).
- No `TargetWpAuditLogPanel.tsx` wrapper — trivial thin wrapper like `HolidayAuditLogPanel.tsx`/`WpWeightAuditLogPanel.tsx` once `ConfigAuditEntityType` (in `ConfigAuditLogPanel.api.ts`) is widened from `'wp-weight-config' | 'holiday'` to include `'target-wp-config'`, and `API_PATH` map gets `'target-wp-config': 'target-wp-config'` entry (route folder is already singular/matches, no plural mismatch like the holiday bug noted in feature-index.md).
- Where to render the new audit panel: current `audit-log` tab renders only `<WpWeightAuditLogPanel />` (`ConfigurationTabs.tsx` line ~187) — ASK whether Target WP audit should get its own sub-tab/section, or stack under the same `audit-log` tab alongside WP Weight (product decision, not inferable from code).
- Type export gap: `target-wp-config.repository.ts` exports `TargetWpConfig { id?, effective_date, rates }` and `TargetWpRates = Record<string,number>` — no shared type in `apps/tere-project/src/shared/types/` yet (WP Weight also keeps its types local to `WpWeightConfigPanel.api.ts`, so this matches existing convention — no shared-types violation).

**Reuse checklist for trd-writer / task-breaker:**
- Generic `ConfigAuditLogPanel.tsx` + `.api.ts` (SLS-16621) already handles ANY entity via props — do not build a new audit table component, only a thin wrapper + type widening.
- `config-audit-log` shared server module already handles cursor/pagination for `target_wp_config` — no backend audit work needed, this task is FRONTEND-ONLY (panel UI + tab wiring + entityType widening).
- Follow `WpWeightConfigPanel.tsx` almost verbatim for CRUD panel — only real divergence is dynamic rate keys instead of `WEIGHT_KEYS` constant, and whichever immutability/future-date UX decisions get answered above.
