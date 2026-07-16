# TRD — PRD-04 Config Audit Log — Phase 2: Target WP Config Audit Trail

Status: Draft for task-breaker
Phase: Phase 2 (Phase 1 — Holiday audit trail — is DONE; see `feature-index.md`)
Stacks in scope: **Backend, QA**. No FE Web / FE Mobile / Mobile work in this phase.

## 1. Objective

Extend the existing generic Config Audit Log (built in Phase 1 for Holiday, reusing the
WP Weight pattern) to cover `target_wp_config`. Every create/delete of a Target WP config row
must produce an immutable audit row, readable by Lead users via a paginated read endpoint.
No FE consumption is wired in this phase — backend contract only.

## 2. Locked decisions (do not re-litigate — confirmed by user/PRD)

- Snapshot-only audit: actions are `create` / `delete` only. No `update` action, no old/new diff.
  "Edit" in the product sense is delete + create at the DB layer, same as WP Weight/Holiday.
- Old-value capture is atomic: single DB transaction, audit row insert happens in the same tx as
  the mutating DML (the DML itself takes the row lock — same pattern as
  `WpWeightConfigRepository.createWithAudit` / `deleteFutureWithAudit`).
- Delete guard: **do not add** a future-only / immutability guard for Target WP. Target WP's
  existing `delete(id)` is unconditional (deletes by id, no date check, no not-found error). Phase
  2 wires audit around this exact existing behavior — do not port Holiday's/WP Weight's
  future-date guard.
- Read endpoint (`GET /api/target-wp-config/audit-log`) is Lead-only (`withRole('Lead', ...)`
  equivalent to `withLead` in the sibling modules).
- Write-side RBAC/validation is OUT OF SCOPE. Target WP's mutation routes
  (`POST /api/target-wp-config`, `DELETE /api/target-wp-config/[id]`) stay on plain `withAuth`
  (any signed-in user). `changed_by` is whichever authenticated user called the route — do not
  add role checks to these two routes.
- No new DB migration. Verified below (§3) that migration `0007_config_audit_log_widen_entity_types.sql`
  already widened both the `config_audit_log_entity_supported` CHECK constraint and the cursor
  index to be generic across entity types — `target_wp_config` is already a legal value and
  already covered by the existing composite index.
- Canonical `entityType` string: **`target_wp_config`** — matches the DB CHECK constraint value
  verbatim, and the route path `/api/target-wp-config/audit-log` uses the same noun (no
  singular/plural mismatch). This deliberately avoids the Phase 1 Holiday defect where
  `entityType: 'holiday'` (singular) didn't match route `/api/holidays/audit-log` (plural),
  which had to be patched around in `ConfigAuditLogPanel.api.ts` on the FE. Since this phase ships
  no FE mount, there is nothing to patch — but any future FE work for Target WP audit must map
  `entityType: 'target_wp_config'` directly to route `target-wp-config/audit-log`, no alias table
  needed.

## 3. DB verification — no migration needed

Checked `apps/tere-project/src/server/db/schema.ts` and `drizzle/0007_config_audit_log_widen_entity_types.sql`:

- `configAuditLog` CHECK `config_audit_log_entity_supported` already is
  `entity_type in ('wp_weight_config', 'holiday', 'target_wp_config')` — `target_wp_config` is
  already a legal value. No ALTER needed.
- Index `config_audit_log_cursor_idx` is already the **generic composite**
  `(entity_type, changed_at DESC, id DESC)` (this replaced the old `wp_weight`-only partial index
  in migration 0006 → 0007). This covers keyset pagination for `target_wp_config` the same way it
  covers `wp_weight_config` and `holiday` — confirmed by reading the index definition directly,
  not assumed. **No new index required.**
- `targetWpConfig` table (`target_wp_config`) is unchanged and unaffected — Phase 2 only adds rows
  to `configAuditLog`, it does not alter `target_wp_config`'s own columns.

Conclusion: `schema.ts` needs **zero edits**. Do not create a new migration file for this phase.

## 4. Backend tasks

### BE-1: Wire audit into `TargetWpConfigRepository`

**Why**: PRD-04 requires every create/delete of Target WP config to produce an audit snapshot
row, captured atomically in the same transaction as the mutating DML (locked decision, §2).

**File**: `apps/tere-project/src/server/modules/target-wp-config/target-wp-config.repository.ts`

**Changes**:

1. Add a read method delegating to the shared module (same one-liner pattern as
   `WpWeightConfigRepository.fetchAuditLog` / `HolidaysRepository.fetchAuditLog`):

   ```ts
   import {
     fetchConfigAuditLog,
     type AuditCursor,
     type AuditLogEntry,
   } from '@server/modules/config-audit-log';

   export type TargetWpAuditCursor = AuditCursor;
   export type TargetWpAuditEntry = AuditLogEntry<TargetWpConfig>;

   // inside class TargetWpConfigRepository
   fetchAuditLog(cursor: TargetWpAuditCursor | null): Promise<TargetWpAuditEntry[]> {
     return fetchConfigAuditLog<TargetWpConfig>('target_wp_config', cursor);
   }
   ```

2. Replace `create(effective_date, rates)` with `createWithAudit`, mirroring
   `WpWeightConfigRepository.createWithAudit` exactly (tx: insert row, insert audit row with
   `action: 'create'`, `oldValue: null`, `newValue: config`):

   ```ts
   async createWithAudit(
     effective_date: string,
     rates: TargetWpRates,
     changedBy: string,
   ): Promise<TargetWpConfig> {
     return db.transaction(async tx => {
       const [row] = await tx
         .insert(targetWpConfig)
         .values({ effectiveDate: effective_date, rates })
         .returning();
       const config = rowToConfig(row);
       await tx.insert(configAuditLog).values({
         entityType: 'target_wp_config',
         entityId: config.id!,
         action: 'create',
         changedBy,
         oldValue: null,
         newValue: config,
       });
       return config;
     });
   }
   ```

   Do NOT add a `findByEffectiveDate` duplicate-resolution step — Target WP's `effective_date`
   column has no unique constraint (unlike `wp_weight_config`) and the current behavior allows
   multiple rows per date. Do not change that; out of scope.

3. Replace `delete(id)` with `deleteWithAudit`, preserving the **exact current unconditional
   semantics** (no date guard, no not-found error) — only add the audit wiring:

   ```ts
   async deleteWithAudit(id: string, changedBy: string): Promise<TargetWpConfig | null> {
     return db.transaction(async tx => {
       const [row] = await tx
         .delete(targetWpConfig)
         .where(eq(targetWpConfig.id, id))
         .returning();
       if (!row) return null; // id didn't exist — silently no-op, matches current behavior

       const config = rowToConfig(row);
       await tx.insert(configAuditLog).values({
         entityType: 'target_wp_config',
         entityId: config.id!,
         action: 'delete',
         changedBy,
         oldValue: config,
         newValue: null,
       });
       return config;
     });
   }
   ```

   The `DELETE ... RETURNING` inside the transaction is the row lock — same mechanism WP
   Weight/Holiday rely on. If `id` doesn't exist, no audit row is written (nothing was deleted),
   and the caller gets `null` back — no thrown error, matching Target WP's current behavior of
   never surfacing a not-found error on delete.

**Contract** (consumed by BE-2, BE-3):
- `createWithAudit(effective_date: string, rates: TargetWpRates, changedBy: string): Promise<TargetWpConfig>`
- `deleteWithAudit(id: string, changedBy: string): Promise<TargetWpConfig | null>`
- `fetchAuditLog(cursor: TargetWpAuditCursor | null): Promise<TargetWpAuditEntry[]>`

**Done when**: `TargetWpConfigRepository` no longer has bare `create`/`delete`; both mutating
paths write to `configAuditLog` in the same transaction; `fetchAuditLog` reuses
`fetchConfigAuditLog` (no reimplementation of keyset pagination SQL).

---

### BE-2: Thread `changedBy` through `TargetWpConfigService`, add audit cursor decode/paginate

**Why**: Service layer is where `changedBy` (the authenticated actor) and cursor
validation belong — mirrors `WpWeightConfigService` / `HolidaysService` exactly.

**File**: `apps/tere-project/src/server/modules/target-wp-config/target-wp-config.service.ts`

**Changes**:

```ts
import {
  decodeAuditCursor as decodeSharedAuditCursor,
  paginate,
  InvalidAuditCursorError,
} from '@server/modules/config-audit-log';

export type TargetWpConfigErrorCode = 'VALIDATION_ERROR';

export class TargetWpConfigError extends Error {
  constructor(
    readonly code: TargetWpConfigErrorCode,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

function decodeAuditCursor(cursor: string) {
  try {
    return decodeSharedAuditCursor(cursor);
  } catch (error) {
    if (error instanceof InvalidAuditCursorError) {
      throw new TargetWpConfigError('VALIDATION_ERROR', 'Invalid audit cursor', 400, { cursor: 'Invalid cursor' });
    }
    throw error;
  }
}
```

- `create(effective_date, rates, changedBy: string)`: cache-invalidate, delegate to
  `repo.createWithAudit(effective_date, rates, changedBy)`. Signature gains the `changedBy`
  param — no other behavior change (still no input validation, matching current scope).
- `delete(id, changedBy: string): Promise<void>`: cache-invalidate, call
  `repo.deleteWithAudit(id, changedBy)`, ignore the return value (keep the current `void`
  contract — caller never learns whether a row existed, same as today).
- New method:
  ```ts
  async fetchAuditLog(cursor: string | null): Promise<{ items: TargetWpAuditEntry[]; next_cursor: string | null }> {
    const rows = await this.repo.fetchAuditLog(cursor === null ? null : decodeAuditCursor(cursor));
    return paginate(rows);
  }
  ```

`TargetWpConfigError` is intentionally minimal — **only** `VALIDATION_ERROR` for the cursor case.
Do not port `CONFIG_NOT_FOUND` / `EFFECTIVE_DATE_CONFLICT` / `IMMUTABLE_CONFIG` from WP Weight;
none of those apply here since create/delete keep their current unguarded behavior.

**Contract** (consumed by BE-3):
- `create(effective_date: string, rates: TargetWpRates, changedBy: string): Promise<TargetWpConfig>`
- `delete(id: string, changedBy: string): Promise<void>`
- `fetchAuditLog(cursor: string | null): Promise<{ items: TargetWpAuditEntry[]; next_cursor: string | null }>`
- Throws `TargetWpConfigError` with `code: 'VALIDATION_ERROR'`, `status: 400`, on a malformed/oversized cursor.

**Done when**: service methods match the contract above; `wpWeightConfigService`-style singleton
export (`export const targetWpConfigService = new TargetWpConfigService(new TargetWpConfigRepository())`)
still works unchanged for existing callers of `fetchAll` / `getEffectiveRates`.

---

### BE-3: Plumb `changedBy` in existing mutation routes + new audit-log route

**Why**: `changed_by` must reflect the actual authenticated caller (Firebase `DecodedIdToken`),
not a hardcoded value — same as Holiday's `changed_by` tracks whichever user (Lead or Member)
performed the action.

**Files**:
- `apps/tere-project/src/app/api/target-wp-config/route.ts` (edit)
- `apps/tere-project/src/app/api/target-wp-config/[id]/route.ts` (edit)
- `apps/tere-project/src/app/api/target-wp-config/audit-log/route.ts` (new)
- `apps/tere-project/src/server/modules/target-wp-config/target-wp-config-http.ts` (new — mirrors
  `wp-weight-config-http.ts` / `holidays-http.ts` 1:1, swapping in `TargetWpConfigError`)

**`target-wp-config-http.ts`** (new file, same shape as the two sibling `-http.ts` files):

```ts
import { withAuth, type AuthedHandler } from '@server/auth/with-auth';
import { withRole } from '@server/auth/with-role';
import { TargetWpConfigError } from './target-wp-config.service';

export type TargetWpConfigApiErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_SERVER_ERROR';

type RouteContext = { params: Promise<Record<string, string>> };

function fixedError(code: TargetWpConfigApiErrorCode, message: string, status: number): Response {
  return Response.json({ code, message }, { status });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof TargetWpConfigError) {
    return Response.json(
      { code: error.code, message: error.message, ...(error.fields && { fields: error.fields }) },
      { status: error.status },
    );
  }
  return fixedError('INTERNAL_SERVER_ERROR', 'Internal Server Error', 500);
}

export function normalizeTargetWpResponse(response: Response): Response {
  if (response.status === 401) return fixedError('UNAUTHORIZED', 'Unauthorized', 401);
  if (response.status === 403) return fixedError('FORBIDDEN', 'Forbidden', 403);
  if (response.status >= 500) return fixedError('INTERNAL_SERVER_ERROR', 'Internal Server Error', 500);
  return response;
}

function safely(handler: AuthedHandler): AuthedHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function withLead(handler: AuthedHandler) {
  const guarded = withRole('Lead', safely(handler));
  return async (req: Request, context: RouteContext): Promise<Response> =>
    normalizeTargetWpResponse(await guarded(req, context));
}
```

Only `withLead` is exported/used this phase (mutation routes below keep plain `withAuth`, no
normalization change to their current bare `{ error: '...' }` 400 body — that shape is
pre-existing and out of scope to change).

**`route.ts` (edit)** — POST gains `changedBy`:

```ts
export const POST = withAuth(async (req, { user }) => {
  const body = await req.json();
  const { effective_date, rates } = body;
  if (!effective_date || !rates) {
    return Response.json({ error: 'effective_date and rates are required' }, { status: 400 });
  }
  const config = await targetWpConfigService.create(effective_date, rates, user.email!);
  return Response.json(config, { status: 201 });
});
```

(`GET` unchanged.)

**`[id]/route.ts` (edit)** — DELETE gains `changedBy`:

```ts
export const DELETE = withAuth(async (_req, { params, user }) => {
  const { id } = await params!;
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
  await targetWpConfigService.delete(id, user.email!);
  return new Response(null, { status: 204 });
});
```

**`audit-log/route.ts` (new)** — thin wrapper, identical shape to
`holidays/audit-log/route.ts` / `wp-weight-config/audit-log/route.ts`:

```ts
import { targetWpConfigService } from '@server/modules/target-wp-config/target-wp-config.service';
import { withLead } from '@server/modules/target-wp-config/target-wp-config-http';

export const dynamic = 'force-dynamic';

export const GET = withLead(async req => {
  const cursor = new URL(req.url).searchParams.get('cursor');
  return Response.json(await targetWpConfigService.fetchAuditLog(cursor));
});
```

**Response shapes**:
- `GET /api/target-wp-config/audit-log` → `200 { items: TargetWpAuditEntry[], next_cursor: string | null }`
  (item shape: `{ id, entity_id, action: 'create'|'delete', changed_by, old_value, new_value, changed_at }`,
  `old_value`/`new_value` are `{ id, effective_date, rates }` or `null` per the snapshot rule in §2).
  - `401` unauthenticated → `{ code: 'UNAUTHORIZED', message: 'Unauthorized' }`
  - `403` non-Lead → `{ code: 'FORBIDDEN', message: 'Forbidden' }`
  - `400` malformed/oversized cursor → `{ code: 'VALIDATION_ERROR', message: 'Invalid audit cursor', fields: { cursor: 'Invalid cursor' } }`

**Done when**: `changed_by` on new audit rows reflects `user.email` of whoever called
POST/DELETE (Lead or Member, no restriction); `GET .../audit-log` 403s for non-Lead and paginates
20/page with the shared cursor contract; POST/DELETE response bodies/status codes are unchanged
from today except for the new audit side-effect.

---

## 5. QA task

### QA-1: Live API contract test — Target WP audit trail

**Why**: Phase 1 shipped equivalent contract scripts for Holiday and WP Weight
(`scripts/wp-weight-config.contract.mjs`, `scripts/holidays-audit.contract.mjs`). Phase 2 needs
the same coverage for Target WP, run directly against the API (no UI).

**File (new)**: `apps/tere-project/scripts/target-wp-config-audit.contract.mjs`

**Pattern to mirror**: `scripts/wp-weight-config.contract.mjs` is the closer template (single-actor
create/delete, not bulk) — reuse its structure (`request`, `status`, `exactKeys`, `auditCursor`,
`auditPage`, `findAudit`, `expectError` helpers) verbatim, adapted to:

- `configPath = '/api/target-wp-config'`, `auditPath = '/api/target-wp-config/audit-log'`
- Config shape: `{ id, effective_date, rates }` where `rates: Record<string, number>` (not the
  fixed 4-key `WEIGHT_KEYS` shape — Target WP rates keys are open, e.g.
  `{ junior, medior, senior, 'individual contributor' }`, so the shape-checker must NOT assert an
  exact key set for `rates`, only that it's a plain object of numbers)
- Both `LEAD_TOKEN` and `MEMBER_TOKEN` required (same env var contract as the other two scripts)

**Required assertions** (env: `BASE_URL`, `LEAD_TOKEN`, `MEMBER_TOKEN`):

1. `GET /api/target-wp-config/audit-log`:
   - `401` unauthenticated, `403` for `MEMBER_TOKEN` (Lead-only)
   - `400 VALIDATION_ERROR` / `fields.cursor` for a malformed cursor (`?cursor=not-a-cursor`) and
     an oversized cursor (513 chars)
   - `200` for `LEAD_TOKEN`, page shape `{ items, next_cursor }`, ≤20 items,
     `changed_at DESC, id DESC` ordering, `next_cursor` present iff exactly 20 items returned
2. `POST /api/target-wp-config` (create, **not** Lead-gated):
   - Both `LEAD_TOKEN` and `MEMBER_TOKEN` can create (asserts routes stayed on `withAuth`, not
     `withRole`)
   - After create, find the matching `action: 'create'` audit entry by `entity_id`; assert
     `changed_by` equals the creating actor's email, `old_value === null`,
     `new_value` matches the created config exactly (`id`, `effective_date`, `rates`)
3. `DELETE /api/target-wp-config/[id]` (delete, **not** Lead-gated, **no** immutability guard):
   - Both actors can delete (do NOT assert a 409/IMMUTABLE_CONFIG case here — Target WP delete has
     no such guard; this is the key behavioral difference from the Holiday/WP Weight scripts,
     confirm this by testing that deleting a **past-dated** config succeeds with `204`, unlike
     Holiday's past-holiday 409 probe)
   - After delete, find the matching `action: 'delete'` audit entry by `entity_id`; assert
     `changed_by` equals the deleting actor's email (not necessarily the creator — cross-actor
     delete, same check as the Holiday script), `old_value` matches the pre-delete config,
     `new_value === null`
   - Deleting a non-existent id: assert it still returns whatever Target WP's current DELETE
     route returns for a no-op id (confirm actual current status — the existing route has no
     not-found branch, so expect the same `204`/empty-body behavior as a normal delete, since
     `deleteWithAudit` returning `null` doesn't change the route's response). **Flag as an
     executor open question if the observed status differs from 204** — do not silently assume.

**Done when**: script runs standalone via
`BASE_URL=... LEAD_TOKEN=... MEMBER_TOKEN=... node scripts/target-wp-config-audit.contract.mjs`
and exits 0 with `console.log('Target WP config audit live contract: PASS')`; cleans up any
created rows in a `finally` block (same pattern as the two existing scripts).

## 6. Explicit non-goals (do not implement in this phase)

- No FE Web/Mobile mount of the audit log (no `ConfigAuditLogPanel` wiring for Target WP).
- No new DB migration, no schema.ts edit (verified already correct, §3).
- No validation hardening on `POST /api/target-wp-config` (`effective_date`/`rates` shape) beyond
  what exists today.
- No delete guard / immutability rule for Target WP (explicitly rejected in §2).
- No RBAC change to the two existing mutation routes.

## Task List

Epic: SLS-16468 ("POC Workflow AI")

| Task | Issue | Stack |
|---|---|---|
| BE-1: Wire audit into TargetWpConfigRepository | [SLS-16637](https://amarbank.atlassian.net/browse/SLS-16637) | Backend |
| BE-2: Thread changedBy through TargetWpConfigService + audit cursor pagination | [SLS-16638](https://amarbank.atlassian.net/browse/SLS-16638) | Backend |
| BE-3: Plumb changedBy in mutation routes + new audit-log route | [SLS-16639](https://amarbank.atlassian.net/browse/SLS-16639) | Backend |
| QA-1: Live API contract test — Target WP audit trail | [SLS-16640](https://amarbank.atlassian.net/browse/SLS-16640) | QA |

Dependency chain: BE-2 depends on BE-1's repository contract → BE-3 depends on BE-2's service contract → QA-1 depends on BE-3's route contract being live.
