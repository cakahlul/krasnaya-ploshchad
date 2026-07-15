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
  - `config_audit_log_entity_supported` — `entity_type = 'wp_weight_config'` **ONLY** (single-entity today; generalizing to other config types = schema migration + constraint change)
  - `config_audit_log_action_supported` — action in `('create','delete')` only (no `update`, because WP weight configs are immutable — future configs get replaced via delete+create, not update)
  - `config_audit_log_snapshot_shape` — shape check on snapshot column
- Migrations: `apps/tere-project/drizzle/0005_config_audit_log.sql` (Phase 2, atomic create/delete snapshots, no backfill), `apps/tere-project/drizzle/0006_wp_weight_audit_cursor_index.sql` (Phase 3, partial index `(changed_at DESC, id DESC)` scoped to `wp_weight_config` rows, powers keyset pagination).

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
- Target WP tab remains `ComingSoon` stub — outside this rollout, no audit log for it.

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
