# Target WP Config Management UI — Rollout QA Matrix

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

- ~~Editing an existing config~~ superseded — see "Phase 2 (Edit / PUT support)" section below (SLS-16685/16686).
- Enforcing a rate upper bound/max (PRD open question — only `rate > 0` lower bound exists server-side).
- Any server-side immutability/date guard on delete (confirmed intentionally absent, §DELETE-05).
- New DB migration / schema changes (none needed this phase, per Phase 2 TRD §3, unaffected by Phase 1 UI work).

---

# Phase 2 (Edit / PUT support) — SLS-16685, SLS-16686

Epic: SLS-16468. Ticket split between SLS-16685/SLS-16686 not specified in the task brief handed
to QA — test IDs below are not tagged per-ticket, cover the full Edit/PUT surface as one unit.

Contract (given, not re-derived):
```
PUT /api/target-wp-config/{id}
Body: { effective_date YYYY-MM-DD, rates Record<string,number> }
200: { id, effective_date, rates }
400 field missing: { error:"effective_date and rates are required" }
400 rate<=0: { code:"VALIDATION_ERROR", message:"rate harus > 0", fields }
404: { code:"NOT_FOUND" }   403 non-Lead: { code:"FORBIDDEN" }   401
```

**Working-tree state at authoring time** (read live, not `git show HEAD`, per
`.claude/knowledge/review-lessons.md`'s "git show HEAD doang" lesson — confirmed via `git status`
these files are uncommitted/in-flight):
- No PUT route/service/repository method exists yet (`[id]/route.ts` only exports `DELETE`;
  `TargetWpConfigService`/`TargetWpConfigRepository` have no `update`/`updateWithAudit`). Test
  cases below are authored against the contract, ahead of implementation — same pattern as Phase
  1's `target-wp-config-ui.contract.mjs`.
- DB migration `drizzle/0008_config_audit_log_allow_update.sql` (and matching `schema.ts` check
  constraints) already widen `config_audit_log_action_supported` to include `'update'` and
  `config_audit_log_snapshot_shape` to require `'update'` ⟺ both `old_value` AND `new_value` NOT
  NULL. This migration is DONE, not a Phase 2 open item — remove it from the "no new migration"
  non-goal below.
- `TargetWpConfigPanel.tsx`/`.api.ts` have `openEdit`/`closeEdit`/`handleEdit`,
  `useUpdateTargetWpConfig` (PUT), an Edit button per row, `errorMessage(..., 'update')`, and a
  second `<Modal>` (`open={editingRecord !== null}`, `editForm`, past-date `Alert`,
  `onOk={() => editForm.submit()}`, `onFinish={handleEdit}`) wired end-to-end — the edit modal
  opens and submits (EDIT-00 passes as-is).
- **Bug found and fixed this round** (confirmed by FE reviewer + BE): the edit modal's rate
  fields were driven by `rateKeys` — the GLOBAL union across every row (`rateKeysFrom(data)`,
  same memo the table columns use) — instead of `Object.keys(editingRecord.rates)`. A row whose
  own key set differs from the global union got the wrong fields injected/missing. FE executor
  fixed this by deriving the edit form's field list from `editingRecord.rates` directly. See
  EDIT-03 below for the up-to-date (post-fix) expectation.
- Shared `AuditLogEntry<T>['action']` type in `config-audit-log.repository.ts` is now
  `'create' | 'delete' | 'update'` (widened this phase), and `ConfigAuditLogPanel.api.ts`
  `snapshot()` picks `new_value` for create/update, `old_value` for delete. Type-contract gap
  from EDIT-AUDIT-08 is closed.

## Edit — happy path

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| EDIT-00 | Lead clicks Edit on any row | An edit modal/dialog opens and is visible (`editingRecord !== null` renders the edit `<Modal>`) | Manual |
| EDIT-01 | Edit modal open, valid `effective_date` + all rates > 0, submit | `PUT` → `200`; table refreshes with updated row (correct sort position if date changed); success toast; modal closes | Manual + Live |
| EDIT-02 | Open Edit on a row, before typing anything | Modal fields pre-filled with the row's CURRENT `effective_date` and CURRENT value of every rate key (verify actual displayed values equal `record.effective_date`/`record.rates[key]`, not just "modal opens") | Manual |
| EDIT-03 | Edit a row whose `rates` has an arbitrary/disjoint key set (0, 1, or N keys; keys not in the default 4) | All of that row's own keys pre-filled and editable; submitting keeps exactly those keys (no default-4 keys injected, no keys dropped). **Was failing** (edit form used the global-union `rateKeys` instead of `editingRecord.rates`' own keys — wrong/extra fields on disjoint-key rows); **fixed this round** by deriving the edit form's key list from `editingRecord.rates` — re-verify pass with the disjoint-key fixture below, not just default-4 rows | Manual (fixture: reuse TBL-04's disjoint-key row) |

## Past-date warning (regression: NOT the Create future-only block)

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| EDIT-04 | Open Edit on a row with `effective_date` strictly before today (WIB) | A warning is shown (e.g. inline/alert) BEFORE submit, informing this config has already taken effect; warning does NOT block the OK/submit button | Manual |
| EDIT-05 | Confirm submit on the past-dated row from EDIT-04 | Submit still succeeds (`200`), same as any other valid edit — warning is advisory only | Manual + Live |
| EDIT-06 | Open Edit on a row with `effective_date` = today or a future date | No past-date warning shown | Manual |
| EDIT-07 | **Regression**: Edit form's `effective_date` field/validator | Must NOT reuse Create's `isFutureWibDate` blocking validator (which rejects today/past dates with `min={tomorrowWib()}`) — a past-dated row must remain editable end-to-end (field not disabled, no blocking inline error, submit not prevented). If the Edit modal blocks past dates, this is a FE defect (accidentally-shared validator/component), not an intentional guard — flag as such, don't silently treat as "expected block" | Manual |

## Invalid rate

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| EDIT-08 | Edit rate value = `0` | Blocked client-side inline error; no `PUT` request fires | Manual |
| EDIT-09 | Edit rate value = negative (e.g. `-5`) | Blocked client-side inline error; no request | Manual |
| EDIT-10 | Edit rate value = non-numeric (letters, empty, symbols) | Blocked client-side inline error; no request | Manual |
| EDIT-11 | **Defense-in-depth, API-level**: rate `<= 0` sent directly to `PUT /api/target-wp-config/{id}`, bypassing the FE entirely (0, negative, and a mixed dynamic-key payload where only one of several keys is `<= 0`) | `400 VALIDATION_ERROR`, `fields.<level>` = `'rate harus > 0'`; the target row's `effective_date`/`rates` unchanged in a subsequent `GET`; no audit entry written (update fails before any `updateWithAudit`) | Live (script) — `EDIT-RATE-BYPASS-01..03` in `target-wp-config-ui.contract.mjs` |

## Not found

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| EDIT-12 | `PUT` to an id that doesn't exist (e.g. already deleted, or random UUID) | `404`, `code: 'NOT_FOUND'`; no row created/written anywhere; no audit entry | Live (script) — `EDIT-NOTFOUND-01` |

## API error / state retention

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| EDIT-13 | `PUT` call fails (simulated `500`) | Error toast shown; edit modal stays OPEN; every entered field (date + all rate values) retained exactly as typed — mirrors Create's ERR-01/Delete's ERR-03 pattern | Manual fault injection |
| EDIT-14 | Double-click/rapid-repeat submit on the edit modal while a `PUT` is already pending for the same row | Only one request in flight; OK/submit button disabled during pending state; no duplicate `PUT` fired | Manual (mirrors ERR-04/ERR-05) |

## RBAC

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| EDIT-15 | `PUT /api/target-wp-config/[id]` called by a non-Lead (Member) token | `403`, `code: 'FORBIDDEN'`; target row unchanged | Live (script) — `EDIT-FORBIDDEN-01` |
| EDIT-16 | Non-Lead (Member) views the Target WP table | Edit button/action not shown or disabled for Member — confirm the existing `!isLead` early-return in the Action column (currently gates the whole action cell, including Edit, same as Delete) still holds once the Edit modal is wired in; defense-in-depth alongside the server 403, not instead of it | Manual |

## Audit log

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| EDIT-AUDIT-01 | After a successful edit via UI/API, query `GET /api/target-wp-config/audit-log` | Exactly ONE new entry: `action: 'update'`, `changed_by` = the editing user's email, `old_value` = the config snapshot AS IT WAS BEFORE this edit, `new_value` = the snapshot AFTER this edit | Live + Manual (UI-consumption check in the Audit Log tab) |
| EDIT-AUDIT-02 | Cross-actor: Lead A creates a row, Lead B later edits it | New `update` entry's `changed_by` = B's email, NOT A's — regression per review-lessons "cross-actor audit assertion" lesson (mirrors `holidays-audit.contract.mjs`'s delete-by-different-actor case) | Live (script) |
| EDIT-AUDIT-03 | Edit rejected client-side-bypassed with rate `<= 0` (EDIT-11) | NO new audit entry for that attempt (verify absence: count of audit rows for that `entity_id` unchanged before/after the rejected call) | Live (script) |
| EDIT-AUDIT-04 | Edit rejected with `404` (EDIT-12) | NO new audit entry anywhere (verify absence globally for that made-up/deleted id) | Live (script) |
| EDIT-AUDIT-05 | Regression: existing create/delete audit flows (Phase 1) and their constraints | Still function unaffected by the `0008_config_audit_log_allow_update` migration — re-run/confirm `create`/`delete` snapshot-shape constraints (`old_value IS NULL` for create, `new_value IS NULL` for delete) still reject malformed rows the same way they did pre-migration | Isolated-DB (extend/re-run existing pattern — see EDIT-AUDIT-06) |
| EDIT-AUDIT-06 | Malformed `'update'` audit insert: direct SQL `INSERT ... action='update'` with EITHER `old_value IS NULL` OR `new_value IS NULL` (both variants) | Both INSERTs rejected by Postgres, `constraint_name = 'config_audit_log_snapshot_shape'`; no row persisted | Isolated-DB contract test, mirroring `wp-weight-config-audit.contract.test.ts`'s / `holidays-audit.contract.test.ts`'s rollback-assertion pattern (`ALLOW_DB_CONTRACT_TEST=1` + `postgres` client, direct constraint-violation `assert.rejects`). **Not created by this QA pass** — task instruction scoped script work to `target-wp-config-ui.contract.mjs` only (live-API HTTP, no direct-DB access); a `target-wp-config-audit.contract.test.ts` sibling file, created by the BE task per the precedent that `wp-weight-config-audit.contract.test.ts`/`holidays-audit.contract.test.ts` were BE-authored (`feat(wp-weight)`/`test(holidays)` commits), not QA-authored. Flagging as a required BE-owned artifact, not skippable coverage. |
| EDIT-AUDIT-07 | Successful edit's audit entry consumed via the Audit Log UI tab (`TargetWpAuditLogPanel`) | New `update` row renders in the same stacked tab as create/delete rows, with dynamic `rates` columns per EDIT-03/TBL-04-style disjoint-key fixture; UI does not crash or mislabel on an `action` value it hasn't seen before (`'update'` vs the `'create'`/`'delete'` it already handles) | Manual |
| EDIT-AUDIT-08 | **Resolved (type-contract)**: `AuditLogEntry<T>['action']` in `config-audit-log.repository.ts` is now `'create' \| 'delete' \| 'update'`; `ConfigAuditLogPanel.api.ts` mirror type widened and `snapshot()` returns `new_value` for update | Type contract now matches the DB constraint + runtime; no further BE/FE action needed | Pass — union widened this phase |

## Out of scope for Phase 2 (do not test)

- Rate upper-bound/max (still PRD open question — unchanged from Phase 1).
- Server-side block on editing an active/past-dated config — task brief specifies warn-only,
  not a hard block (see EDIT-04/05); do not write a test expecting a 409/423 on the active row.
- Duplicate `effective_date` across rows on edit — `target_wp_config` has no unique constraint
  on `effective_date` (unlike `wp_weight_config`); not called out in the given contract, so not
  tested unless the contract is clarified to add one.
