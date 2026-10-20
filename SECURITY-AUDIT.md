# API and MCP security audit — 2026-10-20

Scope: pre-fix working tree, including the earlier productivity fixes. The numbered findings below preserve the audit evidence; remediation status follows. Read all API route entry points, MCP registrations/client, and relevant auth, service, repository, OAuth, and rendering paths. No production calls, credentials, database writes, or exploit execution against users. Findings below describe code behavior; production exploitation is unverified.

## 1. Critical — members can promote themselves and alter/delete any member

`src/app/api/members/route.ts:11` and `src/app/api/members/[id]/route.ts:12` use login-only `withAuth`. They pass request bodies to `membersService.create/update`, which accept `isLead`, email, name, Jira identity, and teams (`src/server/modules/members/members.service.ts:66`). DELETE has no role check either.

A signed-in member can list IDs, PUT their own record with `{"isLead":true}`, then access lead-protected reports/export/configuration. `withRole` and `withAuthOrApiKey` resolve privilege from this same mutable record. Existing personal API keys acquire that lead access too; MCP uses these keys. Members can alternatively change their fullName to another employee's name and bypass personal report filters without becoming a lead.

Fix: restrict member mutations to authorized administrators/leads; validate body fields and preserve protected identity fields. Review member changes and API-key use for evidence of prior escalation. Earlier report fixes are not sufficient while this remains open.

## 2. High — account admission and verified email are not enforced server-side

`src/server/auth/with-auth.ts:23` and `with-auth-or-api-key.ts:50` accept Firebase project ID tokens without checking verified email, allowed domain, or active member admission. Domain restrictions exist in browser code (`src/lib/auth.ts:10`), which callers can skip. Privileges are resolved using token email alone. Creating API keys also requires only a valid token.

Conditional impact: if Firebase permits account creation, an external/unapproved account can reach login-only endpoints, including finding 1. If an employee's email is not already registered in Firebase, password signup under that address can potentially claim that employee's member privileges without proving mailbox ownership. Firebase provider settings/blocking hooks were not available, so account-creation exploitability is conditional.

Fix: centralized server-side admission policy, verified identity before email-based privilege resolution, active roster checks, and appropriate Firebase account-creation restrictions.

## 3. High — stored HTML injection in ticket descriptions

`src/server/modules/search/search.repository.ts:332` inserts ADF emoji `attrs.text` without escaping. Link/inline-card URLs are escaped as HTML but have no safe-protocol allowlist. `src/features/dashboard/components/MemberTaskModal.tsx:332` inserts resulting descriptions with `dangerouslySetInnerHTML`; plain-string descriptions also pass through unchanged.

Local isolated check extracted and transpiled the existing renderer, then verified that an emoji with text `<img src=x onerror=alert(1)>` is returned verbatim. No browser payload was executed. Reachability depends on the attacker being able to supply a description shape accepted by Jira. Raw HTML rendering itself is confirmed.

Impact: malicious descriptions can execute script in the application's origin if such content reaches the renderer, allowing access to client-held tokens and authorized API actions.

Fix: render ADF as React nodes using the existing safe renderer where suitable; treat plain strings as text; allowlist link protocols. Test malicious ADF and plain strings.

## 4. High — OAuth token disclosure and missing transaction binding

`src/app/api/talent-leave/auth/google/callback/route.ts:32` sends the Google access token to `window.opener` with target origin `*`. `src/server/lib/google-oauth.client.ts` generates authorization URLs without state binding; callback does not verify state. Both export hooks accept success messages without checking `event.origin` or `event.source`.

An attacker-controlled opener can initiate an authorization flow and receive a consenting user's Google token at its own origin. Spoofed success messages can also substitute tokens and redirect exports into the attacker's Google account. Granted scopes include spreadsheets and drive.file; exposure is bounded by the token's actual grants.

Fix: validated one-use OAuth state bound to the initiating user/session, exact callback target origin, and origin/source validation in both listeners. Avoid sending tokens to arbitrary openers.

## 5. High — lead-only bug monitoring is available through API and MCP

`src/features/bug-monitoring/hooks/useBugMonitoring.ts:17` enables fetching only for leads. Both `src/app/api/bug-monitoring/{bugs,summary}/route.ts:6` accept any valid Firebase token/API key and ignore caller identity. Board validation checks that the board is configured, not that the caller may access it. Direct callers can also select allBoards or NOC results.

`apps/mcp-server/src/tools/get-bug-monitoring.ts:14` calls these endpoints directly, so a member's key returns the same restricted data through MCP. Responses include assignee distributions, counts, issue metadata, and developer information.

Fix: enforce the intended lead policy on both server routes, before data retrieval.

## 6. High — individual leave reads bypass list filtering

`src/app/api/talent-leave/[id]/route.ts:6` calls `findOne(id)` without requester identity or ownership checks. The list endpoint filters to the member, and writes enforce owner/lead checks, but GET-by-ID does neither.

Any signed-in user knowing a record UUID can retrieve another employee's leave and sick-date history. UUID unpredictability reduces discovery; it does not authorize access. No current MCP tool exposes this detail endpoint, but direct API calls do.

Fix: enforce owner/lead authorization on reads, using the same policy as mutations.

## 7. Medium — legacy epic branch bypasses project authorization

`src/app/api/report/epics/route.ts:35` calls `getProjectEpics(project, caller)`, which checks roster projects. Adding sprint/date parameters switches to `getEpics(...)` at line 48, which receives no caller. Its assignee filter covers the selected project's roster, not the requesting user's permissions.

A member denied project-wide access can request another project's epic summaries/status through this alternate branch. `apps/mcp-server/src/tools/get-epics.ts:23` uses this legacy branch too.

Fix: apply the same project authorization before selecting either branch.

## 8. Medium — ticket search/detail use a global project allowlist

`src/app/api/search/tickets/route.ts` and `[key]/route.ts` require login only. `src/server/modules/search/search.repository.ts` allows static projects plus every configured board, without checking caller project membership. Requests use shared Jira credentials, not the user's Jira identity.

Members/unrostered authenticated users can read descriptions, assignees, story points, and weight points across allowed projects. This conflicts with the per-project policy enforced in Epic Explorer; confirm whether broader ticket visibility is intentional.

Fix: derive allowed projects from caller permissions and apply them to search, single detail, and batch detail.

## 9. Medium — shared configuration and seed mutations require only login

Holiday create/bulk/delete routes use `withHolidayAuth`, which wraps `withAuth`, not `withLead`. Service methods validate data but not caller role. Any authenticated user can alter the shared holiday calendar and therefore working-day/productivity calculations. The date immutability rule limits deletion but does not add role authorization.

`src/app/api/members/seed/route.ts:12` and `src/app/api/boards/seed/route.ts:13` also require only login. They allow unauthorized roster insertion attempts or board-name/short-name upserts.

Fix: restrict shared-calendar mutations according to policy; remove production seed endpoints or guard them with developer/admin authorization.

## 10. Medium — personal report ownership relies on nonunique display names

`src/server/modules/reports/report-filter.ts` and `productivity-summary-http.ts` compare row names with caller.fullName. `src/server/db/schema.ts:24` does not make fullName unique. Two distinct members sharing a name receive each other's matching rows. This remains possible after blocking member mutations; currently finding 1 makes it directly attacker-controlled.

Fix: carry a stable member/Jira identity through generated, snapshot, and archive report rows, and authorize using that identity. Do not infer ownership from display names.

## Additional hardening / deployment-dependent checks

- MCP is local stdio and forwards one configured TERE_API_KEY for every tool invocation. There is no separate caller identity. Sharing a lead-configured MCP process/key gives its consumers lead access by design. Use personal keys; any future shared remote transport needs per-user authentication.
- API key revocation DOES filter inactive keys in the repository; no revoked-key bypass found there. Deleted/departed Firebase users' API keys are not automatically revoked by member deletion/resignation; some endpoints ignore missing roster identity.
- Token verification does not request Firebase revocation checks. Disabled/revoked sessions can remain usable until token expiration unless other infrastructure blocks them.
- Middleware checks only cookie presence; a fabricated __session value passes its page gate. This alone does not bypass bearer-token API verification. Any protected server-rendered content needs a verified session before loading data.
- Batch ticket keys, sprint trends, and sprint-board batch inputs lack application-level item caps/rate limits. Authenticated callers can fan out Jira requests. Infrastructure rate limiting was not inspected.
- Role sources differ: member.isLead versus user_access.role. Review demotion/offboarding consistency across report/config and leave permissions.

## Priority

1. Block member privilege/identity mutation and enforce server-side account admission.
2. Close OAuth token disclosure and unsafe description rendering.
3. Enforce bug-monitoring, leave-detail, epic, search, and shared-configuration permissions at server boundaries.
4. Replace name-based ownership; verify demotion/offboarding and credential lifecycle.

The initial audit changed no application code. Remediation was subsequently implemented as recorded below. No claim of observed production exploitation. Paths beginning src/ are relative to apps/tere-project/; MCP paths are repository-relative.


## Remediation implemented — pending deployment

- **1:** Member create/update/delete require Lead. Seed endpoints require configured Developer access. Ordinary members cannot alter privilege or identity records.
- **2:** All bearer API wrappers require a verified company email and an active roster record; tokens are checked for revocation. API keys require an active roster owner and a verified, enabled Firebase account; keys predating Firebase credential revocation are denied. Password signup sends verification mail; login handles unverified accounts. Creating a session applies the same admission policy.
- **3:** Deleted the unsafe HTML converter. Ticket detail returns ADF/plain text; both ticket-description consumers use the existing React ADF renderer. Executable links and raw HTML are not rendered as HTML.
- **4:** OAuth uses random state bound to an HttpOnly, SameSite cookie, checked before code exchange and cleared on callback. Callback messages use the configured app origin, escaped script data, CSP, and no-store responses. Both popup listeners check origin and popup source. Authorization URLs require Lead access.
- **5:** Both bug-monitoring routes require Lead, including API-key/MCP requests.
- **6:** Leave GET-by-ID now applies the same owner/lead service check as updates/deletes.
- **7:** Legacy epic requests enforce project membership. Follow-up review found the `/report/stories` alias and closed the same bypass there. Both validate sprint/date inputs; `/report` validates project/sprint syntax too.
- **8:** Search, single detail, and batch detail scope projects before Jira queries. Detail keys are syntax-checked. Search and batch inputs are bounded.
- **9:** Calendar mutations require Lead; production seed operations require Developer authorization.
- **10:** Personal report access fails closed when any roster identities share the same normalized name. This blocks ambiguous ownership without rewriting historical reports. Legacy rows still use names; stable-ID migration remains a future compatibility change, and ambiguous-name accounts cannot access personal reports until resolved.
- **Additional:** Page middleware verifies session cookies and revocation instead of trusting cookie presence. Role lookups now use member.isLead consistently. Admin checks derive the caller's identity, not a query email. Role enumeration is restricted. Sprint/board batch fanout is bounded.

Verification includes real route-wrapper tests with mocked Firebase/DB/Jira boundaries, OAuth state and HTML escaping tests, safe ADF rendering, personal report JSON/stream tests, and scoped Jira search tests. Tests perform no production mutations.

Operational limits: changes are not deployed; Firebase account-creation settings, historical account/role tampering, and credential compromise require production review. No infrastructure rate-limit policy was changed. A shared MCP process continues to act as its configured key owner; do not share a lead key/process with members. Database audit contract tests require an explicitly isolated database and were not enabled.

Implementation references: [Firebase revocation checks](https://firebase.google.com/docs/reference/admin/node/firebase-admin.auth.baseauth), [Google OAuth state](https://developers.google.com/identity/protocols/oauth2/web-server), [Next.js Node middleware runtime](https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware).

Final local results: 105 selected regression tests passed; app source type-check passed using the existing tsconfig with generated `.next` route validators excluded; `git diff --check` passed. The full project type-check remains blocked by the existing generated `.next` route-context signature errors. Database contract tests were not enabled. Browser/production OAuth and deployment checks were not performed.


## Follow-up: directory and dashboard response leaks

The earlier remediation missed read endpoints and the dashboard summary. Corrected:

- `/api/members` returns only the caller's roster record for non-leads; `/api/members/[id]` denies other IDs before lookup.
- `/api/talent-leave/talents` returns only the caller's Jira identity for non-leads.
- `/api/boards` and `/api/project` return only assigned projects/boards; member board responses exclude lead-only bug-monitoring boards.
- Single and batch sprint endpoints authorize requested board IDs before loading sprints. Mixed allowed/forbidden batches return 403. This also protects MCP list-sprints.
- Sprint/open reports reject unassigned projects before reading reports or returning metadata.
- `/api/dashboard/summary` now scopes each report before calculating dashboard totals or serializing member summaries. Non-leads receive their own productivity and work-item counts for Scrum and Kanban. Team-wide work-item queries are skipped for members.
- Dashboard caches are separated by caller identity, assigned teams, board scope, and report range; lead caches cannot supply member responses. Missing/ambiguous caller identity is denied.
- Member dashboard rank and team-average cards were replaced with personal WP/SP productivity values.

Regression checks cover direct bearer-token requests, API-key/MCP paths, mixed board batches, member ID access, personal metrics for two different members, lead-first cache population, and unchanged lead visibility. Changes remain local pending deployment.


## Leave visibility policy clarified

The user explicitly allows members to view everyone's leave schedule. Authenticated, admitted users may read the leave list, talent selector, and leave-record details. API-key/MCP leave-list calls follow the same shared visibility. This supersedes the earlier owner-only read recommendation and talent-list restriction. Cross-user create/update/delete remain owner/Lead checked; exports remain Lead-only. Productivity, board, and member-directory restrictions are unchanged.

## Lead dashboard scope clarified

Leads retain access to all menus, the general member directory, and all reports. Dashboard member requests use `/api/members?scope=dashboard`, which returns only currently active members sharing at least one assigned team with the logged-in lead. Dashboard summaries likewise expose only assigned boards and active teammate member summaries. Resigned and not-yet-joined members are excluded using today's WIB date. Dashboard query keys are distinct from the full member-directory query; server summary cache identity includes lead/team/visible-member scope.
