# Target WP Config Management UI — Phase 1 QA Matrix

Epic: SLS-16468. Tickets covered: SLS-16673 (table/list), SLS-16674 (create), SLS-16675
(delete), SLS-16676 (error handling/state retention), SLS-16677 (audit log integration).

Scope: Phase 1 MVP = create + delete only. **Out of scope, do not test**: Edit/PUT (Phase 2,
no PUT route exists), rate upper-bound/max validation (PRD open question, server only enforces
`rate > 0`).

Pattern followed: `WP_WEIGHT_CONFIG_QA_MATRIX.md` (sibling module). Live-API helper reuse:
`scripts/wp-weight-config.contract.mjs`, `scripts/target-wp-config-audit.contract.mjs` (existing,
Phase 2 audit-only — do not duplicate its assertions here; see `scripts/target-wp-config-ui.contract.mjs`
for the new UI-adjacent, non-audit API checks this phase needs).

## Table / list (SLS-16673)

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| TBL-01 | Lead opens Target WP tab, GET `/api/target-wp-config` returns N rows | All N rows rendered, no client-side pagination/truncation | Manual + Live |
| TBL-02 | Rows with different `effective_date` | Table order matches API order (`effective_date` DESC); no client re-sort | Manual + Live |
| TBL-03 | Row `rates` has the default 4 keys (`junior`/`medior`/`senior`/`individual contributor`) | All 4 rendered as columns with correct values | Manual + Live |
| TBL-04 | Row `rates` has a DIFFERENT key set than another row (e.g. one row `{junior, medior}`, another `{lead, staff, intern}`) — dynamic-key requirement | Columns render dynamically per row's own keys; a row does not show blank/error for a key another row has that it lacks (either column union with blank cells, or per-row key list — whichever the UI adopts, no crash, no mislabeled value) | Manual (fixture: two rows with disjoint rate key sets) |
| TBL-05 | `rates` value with a decimal / very small number (e.g. `0.0000001`) or large number | Rendered value numerically equivalent to API value, no truncation/rounding in display | Manual |
| TBL-06 | Zero rows (`GET` returns `[]`) | Empty state, not an error | Manual isolated fixture |
| TBL-07 | `GET /api/target-wp-config` fails (5xx) | Error state with retry, not silently empty | Manual fault injection |

## Badge: Aktif

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| BADGE-01 | Row's `effective_date` is the one selected by `GET /effective?date=<today WIB>` (i.e. latest row with `effective_date <= today`) | That row shows "Aktif" badge | Manual + Live |
| BADGE-02 | No config has `effective_date <= today` (all future, or table empty) | No row shows "Aktif"; no badge rendered anywhere | Manual isolated fixture |
| BADGE-03 | **Ambiguity flag**: `GET /effective?date=` returns only a flat `rates` object (`Record<string, number>`), no `id`/`effective_date` — it does NOT identify which row it came from | UI cannot rely on matching the effective response by value; ASK/confirm the intended client-side rule is "row with the latest `effective_date <= today` among the already-fetched list" (replicating `getEffectiveRates`'s own selection logic client-side), not a value-equality match against the `/effective` payload | Flag only — confirm before automating |
| BADGE-04 | Two DIFFERENT rows coincidentally have byte-identical `rates` values, one past/today, one future | Aktif badge lands on the correct (latest applicable, non-future) row by `effective_date`, not on whichever row happens to value-match the `/effective` response | Manual fixture (regression guard for BADGE-03's ambiguity) |
| BADGE-05 | Config effective exactly "today" (WIB) vs one effective yesterday, both present | "Today" row gets Aktif (latest `<=` today wins), not yesterday's | Manual boundary fixture |

## Badge: Sudah lewat

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| BADGE-06 | Row `effective_date` is strictly before today (WIB) | "Sudah lewat" badge shown, independent of whether this row is also the Aktif one | Manual |
| BADGE-07 | Past row that IS the current Aktif row (latest `<=` today, but its own date is in the past, no later past/today row exists) | Both "Aktif" AND "Sudah lewat" may coexist per spec (independent flags) — confirm UI shows both, not mutually exclusive | Manual (this is explicitly called out as independent in the task brief) |
| BADGE-08 | Row `effective_date` is today or future | No "Sudah lewat" badge | Manual |

## Create — happy path (SLS-16674)

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| CREATE-01 | Valid future `effective_date`, all rate values > 0, default 4 rate keys | `201`; new row appears in table (correct sort position); success toast; modal closes; form resets | Manual + Live |
| CREATE-02 | Valid create with a non-default/custom rate key set (dynamic-key requirement) | `201`; row renders with the custom keys, not forced into the 4-key WP-Weight shape | Manual + Live |
| CREATE-03 | Decimal rate input with comma separator (`4,5`) if UI mirrors WP Weight's comma-to-dot normalization | Submitted as JSON number `4.5`; accepted | Manual (confirm UI actually offers this — WP Weight has it, Target WP panel doesn't exist yet; ASK if parity intended) |

## Create — guards (SLS-16674)

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| CREATE-04 | `effective_date` = today (WIB) | Blocked client-side with inline field error; no network request fires | Manual |
| CREATE-05 | `effective_date` = yesterday/any past date | Blocked client-side with inline field error; no network request fires | Manual |
| CREATE-06 | Rate value = `0` | Blocked client-side inline error; no request | Manual |
| CREATE-07 | Rate value = negative (e.g. `-5`) | Blocked client-side inline error; no request | Manual |
| CREATE-08 | Rate value = non-numeric (letters, empty, symbols) | Blocked client-side inline error; no request | Manual |
| CREATE-09 | **Defense-in-depth, API-level**: rate `<= 0` sent directly to `POST /api/target-wp-config`, bypassing the FE entirely (0, negative, and a mix where only one of several dynamic keys is `<= 0`) | `400 VALIDATION_ERROR`, `fields.<level>` = `'rate harus > 0'` (exact server message, confirmed in `target-wp-config.service.ts`); no row created; no audit entry written (create fails before `createWithAudit`) | Live (script) — see `RATE-BYPASS-01..03` in `target-wp-config-ui.contract.mjs` |
| CREATE-10 | Create as non-Lead (Member) | `POST /api/target-wp-config` is `withLead` (final for Phase 1): API returns `403 FORBIDDEN`; no row created; no audit entry. Defense-in-depth: Create button/action also not shown/disabled for Member in UI (client guard, in addition to the server 403, not instead of it) | Manual + Live |

## Delete — happy path (SLS-16675)

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| DELETE-01 | Delete a config that is neither active nor past (future, non-Aktif) | Confirmation modal appears; confirm → `204`; row disappears from table; success toast | Manual + Live |
| DELETE-02 | Cancel the confirmation modal | No request fires; row remains | Manual |

## Delete — guards (SLS-16675)

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| DELETE-03 | Delete action on the currently Aktif row | Delete control disabled or hidden in UI for that row; no request possible via UI | Manual |
| DELETE-04 | Delete action on a past-dated, non-active row (i.e. `effective_date` in the past but not the currently-selected effective config — e.g. superseded by a later past/today row) | Confirmation modal shows an EXTRA warning about affecting historical reports; confirming still proceeds to delete (`204`) — this delete is NOT blocked, only extra-warned | Manual + Live |
| DELETE-05 | **Server-side reality check (informational, not a defect)**: directly `DELETE` the currently-active config's id via API, bypassing UI | `204` succeeds unconditionally — Target WP's `deleteWithAudit` has no date/immutability check (confirmed in `target-wp-config.repository.ts`). Do NOT expect `409`/`423`. This is intentional Phase 1 scope (client-guard-only); the confirm-only Popconfirm pattern is the sole protection | Live (existing coverage in `target-wp-config-audit.contract.mjs`'s past-dated-delete case; re-confirm here as regression note, not new script needed) |
| DELETE-06 | Delete as non-Lead (Member) | `DELETE /api/target-wp-config/[id]` is `withLead` (final for Phase 1): API returns `403 FORBIDDEN`; row remains. Defense-in-depth: Delete action also not shown/disabled for Member in UI | Manual + Live |
| DELETE-07 | Delete a non-existent id (e.g. row deleted in another tab/session just before this delete fires) | Confirm actual observed behavior: repository returns `null`, service ignores it, route still returns `204` (no not-found branch) — UI should not show a false error for this no-op | Live (already covered by `target-wp-config-audit.contract.mjs`'s "Delete unknown id" case) + Manual (stale-row race in UI) |

## Error handling / state retention (SLS-16676)

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| ERR-01 | Create API call fails (simulated `500`) | Error toast shown; modal stays open; all entered form values (date + every rate field) retained exactly as typed | Manual fault injection |
| ERR-02 | Create API call fails with `400 VALIDATION_ERROR` (e.g. a race where two tabs both bypass and rate somehow ends up invalid server-side) | Error toast/inline message using server's `fields` message; modal stays open; values retained | Manual fault injection |
| ERR-03 | Delete API call fails (simulated `500`) | Error toast shown; table unchanged (row NOT optimistically removed, or removal is rolled back) | Manual fault injection |
| ERR-04 | Double-click Create while a create mutation is pending | Only one request in flight; Create button/OK disabled during pending state; no duplicate row created | Manual (mirrors WP Weight UI-03) |
| ERR-05 | Double-click Delete (same row) while a delete mutation is pending | Only one request in flight; delete control disabled during pending; no duplicate delete / no error from a second in-flight call racing the first | Manual |
| ERR-06 | Rapid-fire Delete on TWO DIFFERENT rows in quick succession | Both eventually succeed (or the second is queued/disabled until the first resolves, per whatever the UI's pending-state granularity is — per-row vs global); no crossed-row cancellation or wrong-row removal | Manual |

## Audit log (SLS-16677)

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| AUDIT-01 | After a successful create via UI, open Audit Log tab | New entry visible with `action: 'create'`, `changed_by` = the creating user's email, snapshot = `new_value` matching the created config | Manual + Live (backend already covered by `target-wp-config-audit.contract.mjs`; this row is the UI-consumption check) |
| AUDIT-02 | After a successful delete via UI, open Audit Log tab | New entry with `action: 'delete'`, `changed_by` = deleting user's email, snapshot = `old_value` (pre-delete state) | Manual + Live |
| AUDIT-03 | Audit Log tab shows BOTH WP Weight and Target WP entries in the SAME table/tab (not a sub-tab) | Confirmed per task brief: Target WP audit is "SAMA dengan WP Weight (bukan sub-tab)" — single audit-log view must render entries from both entity types together, or provide a combined/interleaved feed. **Ambiguity**: current `ConfigAuditLogPanel` is generic-per-entityType (`entityType: 'wp-weight-config' \| 'holiday'`) rendering ONE entity at a time via `useConfigAuditLog<T>(entityType)` — "same tab, not sub-tab" could mean (a) one panel instance that merges both entity types' items server-side/client-side into one list, or (b) two `ConfigAuditLogPanel` instances stacked vertically in the same tab (still visually "one tab", but two separate queries/tables). ASK product/FE owner which; test case below assumes interpretation (b) since it requires zero backend/shared-module change, but flag this explicitly as unconfirmed | Ask + Manual once resolved |
| AUDIT-04 | Target WP audit rows render dynamic `rates` columns (not the fixed WP Weight `Very Low/Low/Medium/High` columns) | `TargetWpAuditLogPanel`'s `snapshotColumns` must derive columns from the snapshot's actual `rates` keys per-row (dynamic), not a hardcoded 4-column set copied from `WpWeightAuditLogPanel` | Manual (fixture: audit rows with differing rate key sets, same as TBL-04) |
| AUDIT-05 | Non-Lead attempts to view Target WP audit entries (via the merged/same tab) | `403` at the API level (`GET /api/target-wp-config/audit-log` is `withLead`, same as `POST`/`DELETE`) — regression check that this guard wasn't accidentally loosened when wiring the FE | Live (already covered by `target-wp-config-audit.contract.mjs`'s "Member audit list" 403 case) + Manual UI (no audit tab/section visible to non-Lead) |
| AUDIT-06 | `entityType` widening (`ConfigAuditLogPanel.api.ts`'s `ConfigAuditEntityType`) adds `'target-wp-config'` | `API_PATH['target-wp-config']` must map to `'target-wp-config'` (route folder is singular, already matches — NOT the Holiday singular/plural bug pattern per SLS-16621 lesson); verify actual request URL is `/target-wp-config/audit-log`, not `/target-wp-configs/audit-log` or similar | Manual (inspect network request) — regression class per `.claude/knowledge/review-lessons.md` SLS-16621 entry |
| AUDIT-07 | Pagination/keyset cursor bidirectional check (regression per review-lessons SLS-16640 lesson) | Both directions verified: `next_cursor !== null` ⟺ `items.length === 20` for the Target WP audit page, exercised through the merged/same-tab UI's data fetch, not just the already-existing backend script | Live (already covered at API level by `target-wp-config-audit.contract.mjs`'s `auditPage()` helper — this row is a UI-level regression note, not new script work) |

## Explicit non-goals (do not test)

- Editing an existing config (no PUT route; Edit is Phase 2 per task brief).
- Enforcing a rate upper bound/max (PRD open question — only `rate > 0` lower bound exists server-side).
- Any server-side immutability/date guard on delete (confirmed intentionally absent, §DELETE-05).
- New DB migration / schema changes (none needed this phase, per Phase 2 TRD §3, unaffected by Phase 1 UI work).
