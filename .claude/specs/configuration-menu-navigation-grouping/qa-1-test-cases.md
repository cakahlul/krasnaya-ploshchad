# Test Case Document — QA-1 (JIRA SLS-16501)

**Feature**: Configuration Menu Navigation Grouping (Phase 1 MVP)
**Scope**: FE-1 — Sidebar parent "Configuration" + accordion sub-menu
**Component under test**: `apps/tere-project/src/components/sidebar.tsx`
**Related contract files** (read-only reference, not implemented yet as of authoring):
- `apps/tere-project/src/shared/constants/configuration-tabs.ts` — CONFIG_TABS: `holiday`, `wp-weight`, `target-wp`, `audit-log`
- `apps/tere-project/src/features/configuration/components/ConfigurationTabs.tsx` — reads `?tab=` query param, `router.replace('/dashboard/configuration?tab=<id>')`
- `apps/tere-project/src/app/dashboard/configuration/page.tsx` — gated `RoleBasedRoute allowedRoles={['Lead']}`

**Note**: at authoring time, `sidebar.tsx` still has legacy flat "Holiday" top-level item (`roles: ['Lead']`, key `/dashboard/holiday-management`) and no "Configuration" parent/accordion. Test cases below assume FE-1 will: (a) add "Configuration" parent item positioned after "Team Members", collapsed by default, visible to Lead only; (b) accordion expands to 4 sub-items — Holiday, WP Weight Config, Target WP Config, Audit Log — each navigating to `/dashboard/configuration?tab=<id>`; (c) remove/replace the legacy flat "Holiday" top-level item.

**Out of scope**: `useHolidayQueries.ts` (smoke-only, covered in QA-2). Automation scripts (manual exec only).

---

## Ambiguity / Open Questions (flag to PM/dev before or during execution)

1. **Expand-state persistence across client-side nav** (not a fresh URL load/refresh): AC only specifies auto-expand behavior for "direct URL/refresh". Whether accordion stays expanded when Lead navigates away to another top-level menu and back via SPA nav (no refresh) is not specified. See TC-EDGE-05 — flag as ambiguous, report observed behavior.
2. **Mobile drawer + auto-expand combo**: AC covers "drawer auto-close on sub-item click" and "auto-expand on direct URL" separately; combined case (direct URL load on mobile viewport with drawer initially closed) not explicitly stated — TC-EDGE-06 covers as inferred expectation (drawer state on load should follow existing sidebar mobile default, not force-open).

---

## Test Environment / Preconditions (Background)

- App running locally / staging, both themes available: light+dark toggle, and crimson theme toggle (per `useThemeColors`).
- Two test accounts available: one with `member.isLead = true` ("Lead"), one with `member.isLead = false` ("Member"). Role differentiation via `members.isLead`, NOT `UserAccess.role` (per project convention).
- Desktop viewport (≥1024px, `isDesktop` true → fixed sidebar) and mobile viewport (<1024px → drawer sidebar) both to be tested where noted.
- Browser cache/session cleared between direct-URL test cases to avoid stale client state.

---

## 1. Visibility & Positioning

### TC-HAPPY-01 — Lead sees "Configuration" after "Team Members", collapsed by default
**Tags**: positive, happy-path
**Precondition**: Logged in as Lead. Desktop viewport.
**Steps**:
1. Load any `/dashboard/*` page.
2. Observe sidebar nav item order.
3. Observe "Configuration" item's expand/collapse state (chevron/icon) without interacting.

**Expected Result**:
- "Configuration" item renders immediately after "Team Members" in the nav list.
- No sub-items visible under "Configuration" on initial load (collapsed).
- Item shows correct icon/label "Configuration", not styled as active (no highlight) since current route ≠ any config sub-route.

---

### TC-NEG-01 — Member does NOT see "Configuration"
**Tags**: negative
**Precondition**: Logged in as Member. Desktop viewport.
**Steps**:
1. Load `/dashboard`.
2. Scan full sidebar nav list top to bottom.

**Expected Result**: "Configuration" item is absent from the DOM entirely (not just hidden via CSS) for Member role.

---

### TC-NEG-02 — Member does NOT see legacy top-level "Holiday"
**Tags**: negative, regression
**Precondition**: Logged in as Member. Desktop viewport.
**Steps**:
1. Load `/dashboard`.
2. Scan full sidebar nav list.

**Expected Result**: No top-level "Holiday" item rendered for Member (was already Lead-only pre-change; confirm still true post-change — i.e. not accidentally exposed to Member during refactor).

---

### TC-NEG-03 — Legacy top-level "Holiday" removed for Lead too
**Tags**: negative, regression
**Precondition**: Logged in as Lead. Desktop viewport.
**Steps**:
1. Load `/dashboard`.
2. Scan full sidebar nav list.

**Expected Result**: No standalone flat "Holiday" top-level item exists anymore for Lead (superseded by "Configuration" > "Holiday" sub-item). Only one path to Holiday management remains: via Configuration accordion.

---

## 2. Accordion Expand/Collapse Behavior

### TC-HAPPY-02 — Click toggles expand then collapse
**Tags**: positive, happy-path
**Precondition**: Logged in as Lead, "Configuration" collapsed. Desktop viewport.
**Steps**:
1. Click "Configuration" parent item.
2. Observe sub-item list.
3. Click "Configuration" parent item again (same element, not a sub-item).
4. Observe sub-item list.

**Expected Result**:
- After step 1: exactly 4 sub-items render, in order: Holiday, WP Weight Config, Target WP Config, Audit Log.
- Parent item visual state shows "expanded" (e.g. chevron rotated / open state), page does NOT navigate on this click (still on prior route).
- After step 3: sub-items collapse (removed from DOM or hidden), chevron/icon reverts to collapsed state.

---

### TC-HAPPY-03 — Sub-item order and labels match contract
**Tags**: positive, regression
**Precondition**: Logged in as Lead, Configuration expanded.
**Steps**:
1. Expand Configuration.
2. Read sub-item labels top to bottom.

**Expected Result**: Labels exactly "Holiday", "WP Weight Config", "Target WP Config", "Audit Log" — matching `CONFIG_TABS` in `configuration-tabs.ts`, in that exact order.

---

### TC-EDGE-01 — Rapid repeated clicks (double toggle spam)
**Tags**: edge-case
**Precondition**: Logged in as Lead, Configuration collapsed.
**Steps**:
1. Click "Configuration" 5 times in quick succession (double-click speed or faster).

**Expected Result**: Final state is deterministic and consistent with click-count parity (odd clicks = expanded, even = collapsed). No duplicate sub-item render, no UI flicker/broken state, no unintended navigation.

---

### TC-EDGE-02 — Expand Configuration while another item is active
**Tags**: edge-case
**Precondition**: Logged in as Lead, currently on `/dashboard/reports` (Team Reporting active/highlighted).
**Steps**:
1. Click "Configuration" to expand.
2. Observe "Team Reporting" item highlight state.

**Expected Result**: "Team Reporting" remains highlighted/active (still on that route since expand click doesn't navigate). Configuration expands without stealing active-route highlight from the real current route.

---

## 3. Sub-item Navigation

### TC-HAPPY-04 — Click sub-item navigates to correct tab (desktop)
**Tags**: positive, happy-path
**Precondition**: Logged in as Lead, Configuration expanded, desktop viewport.
**Steps**:
1. Click "WP Weight Config" sub-item.
2. Observe URL and page content.

**Expected Result**: URL becomes `/dashboard/configuration?tab=wp-weight`. Page renders WP Weight Config tab content as active (per `ConfigurationTabs.tsx` tab bar, `activeTab === 'wp-weight'` styled selected). Sidebar sub-item "WP Weight Config" shows active/highlighted state.

Repeat same steps/expectation for each remaining sub-item:
- "Target WP Config" → `?tab=target-wp`
- "Audit Log" → `?tab=audit-log`
- "Holiday" → `?tab=holiday`

(Log as TC-HAPPY-04a/b/c or run as data-driven table — 4 total assertions.)

---

### TC-HAPPY-05 — Sub-item click auto-closes mobile drawer
**Tags**: positive, happy-path
**Precondition**: Logged in as Lead, mobile viewport (<1024px), sidebar drawer open, Configuration expanded.
**Steps**:
1. Click any sub-item (e.g. "Audit Log").
2. Observe drawer state and overlay.

**Expected Result**: Drawer closes (`onClose()` fires, `isOpen` → false, `translateX(-100%)`), backdrop overlay disappears, URL navigates to `/dashboard/configuration?tab=audit-log` as expected.

---

### TC-EDGE-03 — Click already-active sub-item again
**Tags**: edge-case
**Precondition**: Logged in as Lead, currently on `/dashboard/configuration?tab=holiday`, Configuration expanded.
**Steps**:
1. Click "Holiday" sub-item again (already active).

**Expected Result**: No error/crash. URL stays same (`router.replace` with identical param is a no-op navigation). Tab content remains rendered correctly, no duplicate re-mount glitches (e.g. Holiday list/calendar view toggle state not unexpectedly reset — verify manually).

---

## 4. Direct URL / Refresh Auto-Expand + Highlight

### TC-HAPPY-06 — Direct URL load auto-expands and highlights correct sub-item
**Tags**: positive, happy-path
**Precondition**: Logged in as Lead. Fresh browser tab / hard refresh.
**Steps**:
1. Navigate directly to `/dashboard/configuration?tab=wp-weight` (paste URL / refresh).
2. Observe sidebar state on load, before any click.

**Expected Result**: Sidebar renders with "Configuration" already expanded (no manual click needed). "WP Weight Config" sub-item shows active/highlighted styling. "Configuration" parent item itself also reflects "contains active route" state (if design specifies parent highlight — verify against design; if not specified, at minimum expanded + child highlighted).

---

### TC-HAPPY-07 — Refresh on active sub-item preserves state
**Tags**: positive, regression
**Precondition**: Logged in as Lead, currently on `/dashboard/configuration?tab=audit-log`.
**Steps**:
1. Hard refresh browser (F5 / Cmd+R).

**Expected Result**: After reload, same behavior as TC-HAPPY-06 — Configuration auto-expanded, "Audit Log" sub-item highlighted, correct tab content re-rendered.

---

### TC-EDGE-04 — Direct URL with invalid `?tab=` value
**Tags**: edge-case
**Precondition**: Logged in as Lead.
**Steps**:
1. Navigate directly to `/dashboard/configuration?tab=nonexistent-tab`.
2. Observe sidebar and page content.

**Expected Result**: `resolveTab()` falls back to `DEFAULT_CONFIG_TAB` ('holiday') — page content shows Holiday tab. Sidebar auto-expands Configuration and highlights "Holiday" sub-item. FAIL if: no highlight, expand skipped, wrong sub-item highlighted, or crash.

---

### TC-EDGE-05 — Accordion state after SPA navigation away and back (no refresh)
**Tags**: edge-case
**Precondition**: Logged in as Lead, on `/dashboard/configuration?tab=holiday` (Configuration expanded).
**Steps**:
1. Click "Dashboard" (or any other top-level item) to navigate away — no refresh.
2. Click "Configuration" parent's chevron area is not clicked; observe whether it auto-collapses when leaving route.
3. Click "Configuration" again to return.

**Expected Result** (ambiguous — Ambiguity #1, report observed behavior, don't hard-fail): document whether Configuration stays expanded (memory persists) or collapses back to default once route no longer matches a config path. Either is plausible; flag actual behavior for design sign-off if not specified in TRD.

---

### TC-EDGE-06 — Direct URL load on mobile viewport
**Tags**: edge-case
**Precondition**: Logged in as Lead, mobile viewport, sidebar drawer closed (default mobile state).
**Steps**:
1. Navigate directly to `/dashboard/configuration?tab=target-wp` on mobile.
2. Open the drawer (hamburger).
3. Observe drawer state.

**Expected Result** (Ambiguity #2): Drawer does not auto-open on page load (existing mobile pattern — drawer only opens via explicit user toggle). Once opened, Configuration should already show expanded + "Target WP Config" highlighted, consistent with TC-HAPPY-06, without needing extra click.

---

## 5. Regression — Existing Menu Items Unchanged

### TC-REG-01 — Dashboard item unaffected
**Tags**: regression
**Precondition**: Logged in as Lead or Member.
**Steps**: Click "Main Dashboard" (Dashboard) menu item.
**Expected Result**: Navigates to `/dashboard`, active highlight applied correctly, position unchanged (first item), icon unchanged.

### TC-REG-02 — Team Reporting unaffected
**Tags**: regression
**Steps**: Click "Team Reporting".
**Expected Result**: Navigates to `/dashboard/reports`. Position (2nd item), active state, icon all unchanged from pre-existing behavior.

### TC-REG-03 — Productivity Summary unaffected (Lead only)
**Tags**: regression
**Precondition**: Logged in as Lead.
**Steps**: Click "Productivity Summary".
**Expected Result**: Navigates to `/dashboard/productivity-summary`, unchanged position/behavior. Confirm Member still cannot see this item (unrelated to this change but must not regress).

### TC-REG-04 — Bug Monitoring unaffected (Lead only)
**Tags**: regression
**Steps**: Click "Bug Monitoring".
**Expected Result**: Navigates to `/dashboard/bug-monitoring`, unchanged. Member still cannot see it.

### TC-REG-05 — Talent Leave unaffected (Lead & Member)
**Tags**: regression
**Steps**: Click "Talent Leave" as both Lead and Member.
**Expected Result**: Navigates to `/dashboard/talent-leave` for both roles, unchanged position/behavior.

### TC-REG-06 — Team Members unaffected (Lead only), still directly precedes Configuration
**Tags**: regression
**Steps**: As Lead, click "Team Members"; also re-confirm its position directly before "Configuration" (cross-check with TC-HAPPY-01).
**Expected Result**: Navigates to `/dashboard/team-members`, unchanged behavior. Position: immediately before "Configuration".

### TC-REG-07 — MCP Connection unaffected (Lead & Member)
**Tags**: regression
**Steps**: Click "MCP Connection" as both roles.
**Expected Result**: Navigates to `/dashboard/mcp-connection` for both, unchanged, remains last item in list (after Configuration for Lead).

### TC-REG-08 — Legacy route `/dashboard/holiday-management` direct access
**Tags**: regression
**Precondition**: Logged in as Lead.
**Steps**: Navigate directly to `/dashboard/holiday-management` via URL (not via sidebar).
**Expected Result**: Redirects to `/dashboard/configuration?tab=holiday`. Sidebar reflects Configuration expanded + "Holiday" sub-item highlighted (consistent with TC-HAPPY-06). FAIL if: old page still renders standalone, 404, or redirect target is wrong.

### TC-REG-09 — Header chip, quote, footer unaffected
**Tags**: regression
**Steps**: Compare sidebar header (logo, TERE title, role/level chip, team health / sprint progress chip) and footer (quote, credit line) before/after change, both roles.
**Expected Result**: No visual/behavioral change to header/footer sections — change is scoped to nav list only.

### TC-REG-10 — Full menu item count for Lead
**Tags**: regression
**Precondition**: Logged in as Lead.
**Steps**: Count all top-level nav items.
**Expected Result**: 7 top-level items total (Dashboard, Team Reporting, Productivity Summary, Bug Monitoring, Talent Leave, Team Members, Configuration) + MCP Connection = 8, in that exact order. (Was 8 before with flat Holiday; net count same since Holiday folded into Configuration, not net addition — confirm no accidental duplicate item.)

### TC-REG-11 — Full menu item count for Member
**Tags**: regression
**Precondition**: Logged in as Member.
**Steps**: Count all top-level nav items.
**Expected Result**: 4 items (Dashboard, Team Reporting, Talent Leave, MCP Connection), unchanged from pre-existing Member view. No Configuration, no Holiday.

---

## 6. Visual / Theme Regression

### TC-VIS-01 — Dark mode, Configuration collapsed & expanded
**Tags**: regression, visual
**Precondition**: Logged in as Lead, dark mode enabled (non-crimson).
**Steps**:
1. Observe Configuration item collapsed styling (icon color, text color, hover state).
2. Expand it, observe 4 sub-items styling (indentation, text color, active-state background/border per `activeBg`/`navTextActive` tokens).

**Expected Result**: Colors/contrast consistent with rest of dark-mode nav items (`navTextColor` = `rgba(255,255,255,0.7)` unselected, `navTextActive` per theme). No unstyled/default-browser elements, no clipped text, no missing icon, no broken hover background (`hoverBg`).

### TC-VIS-02 — Crimson theme, Configuration collapsed & expanded
**Tags**: regression, visual
**Precondition**: Logged in as Lead, crimson theme enabled.
**Steps**: Same as TC-VIS-01 but with crimson theme active.
**Expected Result**: Crimson-specific tokens applied correctly (`hoverBg` = `rgba(194,21,24,0.18)`, `navTextActive` = `#fff6e6`, gold accents where used elsewhere in sidebar). Sub-items and parent item render without color clashes or unreadable contrast against crimson gradient background.

### TC-VIS-03 — Light mode, Configuration collapsed & expanded
**Tags**: regression, visual
**Precondition**: Logged in as Lead, light mode (not dark, not crimson).
**Steps**: Same as above.
**Expected Result**: `navTextColor = '#4b5563'`, `navTextActive = '#011d4d'`, white sidebar background — parent + 4 sub-items render legibly, no leftover dark-mode-only styling bleeding through.

### TC-VIS-04 — Sub-item indentation / visual hierarchy
**Tags**: visual
**Precondition**: Any theme, Lead, Configuration expanded.
**Steps**: Visually inspect indentation/icon size of sub-items vs top-level items.
**Expected Result**: Sub-items visually distinguishable as children (e.g. indent, smaller/no icon, or connector styling) — not confused with top-level items. Flag to design if no visual distinction implemented (pure accessibility/UX concern, not a hard functional bug, but worth noting).

### TC-VIS-05 — Long label truncation unaffected
**Tags**: visual, regression
**Precondition**: Any theme, narrow desktop width (sidebar fixed width 224px).
**Steps**: Check "WP Weight Config" and "Target WP Config" (longest labels) don't overflow/wrap awkwardly in the fixed 224px sidebar.
**Expected Result**: Labels truncate with ellipsis (`truncate` class, consistent with existing `<span className="truncate">`) rather than wrapping or overflowing the sidebar bounds.

---

## Summary

- Total test cases: **31** (across positive/happy-path: 8 incl. sub-scenarios, negative: 3, edge-case: 6, regression: 11, visual: 5 — some overlap tagged both regression+visual).
- Ambiguities requiring PM/dev confirmation before final sign-off: **2** (see "Ambiguity / Open Questions" section — expand-state persistence across SPA nav, mobile auto-open interaction). Legacy route fate, sub-item order, and invalid-tab fallback are confirmed contract, no longer open.
- `useHolidayQueries.ts` intentionally NOT exercised (QA-2 smoke scope).
- Execution mode: manual only, no automation script authored (per task instruction).
