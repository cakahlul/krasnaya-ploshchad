# WP Weight Config — MVP QA Matrix

Run the safe live subset with:

```sh
BASE_URL=http://localhost:3000 LEAD_TOKEN='…' MEMBER_TOKEN='…' node scripts/wp-weight-config.contract.mjs
```

The script never prints tokens, chooses an unoccupied future date, and deletes only the exact valid ID returned by its `201` response. If that response lacks an ID, it reports a possible orphan for manual cleanup rather than inferring a record from the list. Today/past deletion stays manual because the future-only create rule makes a disposable immutable fixture unsafe.

Run the Phase 2 atomic audit contract only against an isolated test database:

```sh
ALLOW_DB_CONTRACT_TEST=1 DATABASE_URL='postgresql://…test…' \
  npx tsx src/server/modules/wp-weight-config/wp-weight-config-audit.contract.test.ts
```

The check aborts before opening a database connection unless both variables are present, never prints credentials, allocates unused far-future dates, and cleans up only the exact config and audit IDs it observed.

## Phase 2 atomic audit trail

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| AUD-01 | Two concurrent identical creates for one unused future date | One config winner; one `create` event total with exact actor, entity, persisted `new_value`, null `old_value`, and DB timestamp | DB contract |
| AUD-02 | Replay the identical create after success | Existing config with `created:false`; audit count remains one | DB contract |
| AUD-03 | Two concurrent deletes of the created future config | One delete winner and one rejection; one `delete` event with exact persisted `old_value` and null `new_value` | DB contract |
| AUD-04 | Blank trusted actor violates the audit constraint | Repository rejects; config and audit writes both roll back | DB contract |
| AUD-05 | Invalid input, date conflict, immutable delete, unknown delete, or auth failure | No audit event; existing Phase 1 status and error shape remain unchanged | Existing live/service checks + manual immutable fixture |
| AUD-06 | Audit insert/database failure reaches HTTP boundary | Mutation rolls back; generic `500 INTERNAL_SERVER_ERROR` without database details | Service/HTTP check + DB contract rollback proof |
| AUD-07 | Phase 2 deployment starts with existing WP configs | No historical events synthesized; auditing begins only for new successful mutations | Migration inspection |

## API and authorization

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| API-01 | Lead GET management list | `200`; configs use exact `{id,effective_date,weights}` shape; dates descending | Live |
| API-02 | Member / unauthenticated GET management list | `403` / `401`; `{code,message,fields?}` | Live |
| API-03 | Lead POST valid decimal weights | `201`; exact four weight keys and submitted values | Live |
| API-04 | Member / unauthenticated POST | `403` / `401`; no record created | Live |
| API-05 | Retry identical POST | `200`; same ID and values; no duplicate | Live |
| API-06 | Same date, different weights | `409 EFFECTIVE_DATE_CONFLICT` | Live |
| API-07 | Two simultaneous identical POSTs for one unused date | One `201`, one `200`; both return same ID; one DB row | Manual concurrency |
| API-08 | Two simultaneous different POSTs for one unused date | One `201`, one `409 EFFECTIVE_DATE_CONFLICT`; winner persists intact | Manual concurrency |
| API-09 | Lead DELETE future config | `204`, empty body; repeat returns `404 CONFIG_NOT_FOUND` | Live |
| API-10 | Member / unauthenticated DELETE future config | `403` / `401`; config remains available | Live |
| API-11 | Lead DELETE config effective today or in past | `409 IMMUTABLE_CONFIG`; row and reports unchanged | Manual with approved immutable fixture |
| API-12 | GET list with zero rows | `200 []`; UI empty state, not an error | Manual isolated DB |
| API-13 | GET list DB failure | `5xx` error shape; UI error with retry, not empty state | Manual fault injection |
| API-14 | Every non-2xx response | Exact required `code` and non-empty `message`; `fields`, when present, is an object | Live + manual |

## Validation and dates

Use exact keys `Very Low`, `Low`, `Medium`, `High` for every row below.

| ID | Input | Expected | Coverage |
| --- | --- | --- | --- |
| VAL-01 | `0.0000001`, decimal with many digits, `100` | Accepted as JSON numbers; value remains numerically equivalent | Live |
| VAL-02 | `0`, negative, or `100.0000001` | `400 VALIDATION_ERROR`; `fields.weights` present | Manual |
| VAL-03 | Missing key or extra key | `400 VALIDATION_ERROR`; `fields.weights` present | Extra: Live; missing: Manual |
| VAL-04 | Numeric string (`"1.5"`), comma string (`"1,5"`), `null`, boolean, object, array | `400 VALIDATION_ERROR`; `fields.weights` present; API never coerces | Comma: Live; others: Manual |
| VAL-05 | JSON-safe nonfinite equivalents (`"NaN"`, `"Infinity"`, `"-Infinity"`, `null`) | `400 VALIDATION_ERROR`; `fields.weights` present | Manual |
| VAL-06 | UI input `1,5` | UI accepts and submits JSON number `1.5`; rendered value is unambiguous | Manual UI |
| VAL-07 | UI whitespace, pasted mixed separators, empty value | Deterministic validation; no request until four valid numbers exist | Manual UI |
| DATE-01 | Valid leap date `2028-02-29` and ordinary strict `YYYY-MM-DD` | Accepted only when future relative to WIB today | Ordinary future: Live; leap: Manual |
| DATE-02 | `2025-02-29`, `2028-02-30`, `2026-2-01`, timestamp, surrounding spaces | `400 VALIDATION_ERROR`; relevant date field present; no normalization | `2025-02-29`: Live; others: Manual |
| DATE-03 | Yesterday / today / tomorrow around `00:00 Asia/Jakarta` | POST rejects yesterday and today; accepts tomorrow; behavior does not follow server UTC date | Manual boundary |
| DATE-04 | Browser/server clocks straddle UTC/WIB midnight | API decision follows server-side `Asia/Jakarta`; UI agrees after refresh | Manual boundary |

## Effective weights, reports, and Jira regression

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| EFF-01 | Lead and Member GET `/effective?date=YYYY-MM-DD` | Both `200`; body is weights-only with exact four keys | Live |
| EFF-02 | Unauthenticated effective GET / invalid strict date | `401` / `400 VALIDATION_ERROR` with `fields.date` | Live |
| EFF-03 | No config effective at requested date | Contractual default weights returned; Member report still loads | Manual isolated DB |
| EFF-04 | Warm effective cache, create config for date, fetch again | New weights immediately returned; no stale pre-create value | Live |
| EFF-05 | Warm effective cache, delete future config, fetch again | Previous/default effective weights immediately restored | Live |
| EFF-06 | Existing Member report/tooltip using `/effective` | No management permission regression; same weights-only response | Manual UI/report |
| REP-01 | Report receives explicit Jira/sprint date `YYYY-MM-DD` | Date remains byte-for-byte unchanged; no timezone shift | Manual integration |
| JIRA-01 | Jira timestamp before/after UTC→WIB date boundary (for example `16:59Z` / `17:00Z`) | Convert timestamp once to WIB; resulting dates differ as expected | Manual integration |
| JIRA-02 | Jira timestamp already parsed into a date then passed through report/config flow | No second timezone conversion | Manual integration |
| JIRA-03 | Jira API offset timestamp (`+07:00`) | Respect embedded offset, derive WIB date once, do not append/assume another zone | Manual integration |

## UI behavior and accessibility

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| UI-01 | Member opens Configuration URL directly | Access denied/redirected; no management data request or flash of controls | Manual |
| UI-02 | Lead list loading / API error / empty result | Distinct loading, retryable error, and useful empty states | Manual |
| UI-03 | Double-click Create/Delete or slow network | One mutation in flight; controls disabled; idempotency prevents duplicates | Manual |
| UI-04 | Create conflict or validation failure | Dialog stays open, actionable message shown, entered values preserved | Manual |
| UI-05 | Delete today/past row | Control absent/disabled; direct API attempt still returns `IMMUTABLE_CONFIG` | Manual |
| UI-06 | Keyboard-only create, validation, cancel, delete confirmation | Logical focus order, visible focus, Escape/cancel works, focus returns to trigger | Manual |
| UI-07 | Labels, errors, and status messages | Inputs have accessible names; errors associated to fields; async result announced | Manual |
| UI-08 | Decimal/comma input on mobile and desktop | Appropriate decimal keyboard; zoom/reflow and tap targets remain usable | Manual |
