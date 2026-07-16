# Holiday Audit Log — Phase 1 QA Matrix

Adapted from `P3-UI-01..08` and `P3-A11Y-01` in
[`WP_WEIGHT_CONFIG_QA_MATRIX.md`](./WP_WEIGHT_CONFIG_QA_MATRIX.md) for the Holiday tab, per
SLS-16619 and TRD Phase 1 (Confluence `4084957244`). Grounded against the current implementation:
`ConfigurationTabs.tsx`, `HolidayAuditLogPanel.tsx`, `ConfigAuditLogPanel.tsx`,
`ConfigAuditLogPanel.api.ts`, `src/app/api/holidays/audit-log/route.ts`.

## Known defect found while grounding this matrix (flag before sign-off)

`HolidayAuditLogPanel.tsx` passes `entityType="holiday"` (singular) into
`ConfigAuditLogPanel`/`useConfigAuditLog`, which builds the request URL as
`` `/${entityType}/audit-log` `` → **`/api/holiday/audit-log`**. The actual Next.js route lives at
`src/app/api/holidays/audit-log/route.ts` → **`/api/holidays/audit-log`** (plural). Query key is
also `['holiday','audit-log']` (singular), unaffected since it's client-cache-only, but the HTTP
request path mismatches the real route. As implemented today this is a 404 on every real
request — HOL-UI-01 below is expected to **fail** until fixed (either rename the route folder to
singular, or introduce a path-vs-entityType mapping in `ConfigAuditEntityType`). Report this to
Web executor of "Integrate ConfigAuditLogPanel into Holiday tab" before merging.

## Ambiguity noted (not blocking, needs owner confirmation)

TRD text names snapshot columns "Holiday date" / "Holiday name"; the shipped column `title`s are
"Date" / "Name" / "National holiday" (see `HolidayAuditLogPanel.tsx`). Test cases below assert the
**actual shipped labels**. If TRD's literal column names are a hard requirement, that's a
Web-side gap, not a QA matrix gap — flagging for PM/TRD owner confirmation rather than assuming.

TRD/ticket don't specify whether toggling List ↔ Calendar mode should preserve the audit panel's
scroll/loaded-pages state or remount it fresh. HOL-UI-01 below tests presence in both modes only;
scroll/remount behavior is left unasserted pending clarification.

## UI and accessibility

| ID | Scenario | Precondition | Steps | Expected | Coverage |
| --- | --- | --- | --- | --- | --- |
| HOL-UI-01 | Panel appears under the List/Calendar toggle, in both modes | Logged in as Lead; Configuration → Holiday tab open | 1) Open Holiday tab in List mode, scroll below the toggle. 2) Switch to Calendar mode, scroll below the toggle | Panel renders below the toggle in both List and Calendar mode (not a separate tab). Query key is `['holiday','audit-log']`. Request path is exactly `/api/holidays/audit-log` (see known defect above — currently fails). Panel shows only Holiday entries; no WP Weight / Target WP data leaks in | Inspection + manual |
| HOL-UI-02 | Audit table data and columns | Lead; ≥1 create and ≥1 delete audit row exist | Open panel, inspect rendered rows and column headers | Server order preserved, no client-side re-sort. Columns left to right: Changed at, Action, Changed by, Date, Name, National holiday | Inspection + manual |
| HOL-UI-03 | Create / delete row renders human-readable snapshot, not raw JSON | Lead; one `create` row and one `delete` row present | Inspect a create row and a delete row | Create row renders `new_value` snapshot; delete row renders `old_value` snapshot. Date/Name/National holiday show as plain values (e.g. `2026-08-17`, `Independence Day`, `Yes`/`No`) — no raw JSON object or field names visible in the cell | Inspection + manual |
| HOL-UI-04 | Timestamp rendering | Lead; ≥1 audit row present | Inspect the "Changed at" cell and its DOM | Semantic `<time dateTime="...">` with the UTC ISO value in the attribute; visible text is `Asia/Jakarta` local time suffixed `WIB` | Inspection + manual timezone fixture |
| HOL-UI-05 | Initial load / empty data | Lead; isolated test data with zero Holiday audit rows | Open panel with empty audit history | Loading state is announced via a polite `role="status"` while fetching. Once loaded empty, exact empty text `No Holiday audit activity yet.` is shown (not a generic/blank table) | Manual |
| HOL-UI-06 | Initial request fails, including non-Lead 403 | (a) Lead with server/network fault injected on first load; (b) Member/non-Lead account | (a) Load panel as Lead with fault injected. (b) Load panel as Member | (a) Error state distinct from the empty state; generic message with keyboard-reachable `Retry` that refetches on activation. (b) Same error UI, but message text is specifically `Only Leads can view Holiday audit activity.` (403-specific copy), not the generic fallback | Manual fault injection + manual RBAC |
| HOL-UI-07 | `next_cursor` present → load more | Lead; ≥21 Holiday audit rows seeded | Load panel, observe first page, click "Load more" | "Load more" button appears when `next_cursor` is non-null. While pending, button is disabled, shows "Loading more...", and a `role="status"` announces "Loading more audit activity...". New page appends after existing rows in server order (no re-sort, no duplicates) | Manual 21-row fixture |
| HOL-UI-08 | Load-more request fails | Lead; first page loaded; fault injected on the load-more request | Click "Load more" with fault injected | Existing (already loaded) rows remain visible and unchanged. A dedicated load-more error + `Retry` appears; only the failed page is retried, first page is not re-fetched or cleared | Manual fault injection |
| HOL-A11Y-01 | Keyboard and screen reader pass | Lead; panel loaded with data, in both List and Calendar mode | Tab through toggle → panel → table → Load more (if present); trigger with keyboard only; test with a screen reader | Every interactive control (mode toggle, Retry, Load more) has visible focus and is keyboard-operable. Section heading (`Holiday Audit Log`) labels the region for assistive tech (`aria-labelledby`). Loading/error/load-more status changes are announced. Table remains reachable via horizontal scroll at high zoom (verify against `scroll={{x:1095}}`) | Manual |

## Regression check (SLS-16621 generalize)

| ID | Scenario | Expected | Coverage |
| --- | --- | --- | --- |
| HOL-REG-01 | WP Weight audit panel after `ConfigAuditLogPanel` generalization | `WpWeightAuditLogPanel` renders unchanged: query key `['wp-weight-config','audit-log']`, request `/api/wp-weight-config/audit-log`, same columns/labels/empty-text/error copy as before. Re-run existing `P3-UI-01..08`/`P3-A11Y-01` in `WP_WEIGHT_CONFIG_QA_MATRIX.md` against the generic component — all must still pass unmodified | Manual, re-run existing WP Weight matrix |

Out of scope Phase 1 (per TRD): Target WP audit UI, write-side RBAC on Holiday mutations, filter/search/export on the audit log, polling/backfill/refresh control.
