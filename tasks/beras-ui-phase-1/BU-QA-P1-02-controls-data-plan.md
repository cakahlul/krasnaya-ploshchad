# BU-QA-P1-02 — Controls and data functional test-case plan

**Stack:** QA
**Assigned role:** `qa-executor`
**Reviewer role:** `qa-reviewer`
**Wave:** 3, slot 3/3
**TRD coverage:** QA-F01…QA-F08
**Estimated scope:** M; QA artifact only

## Description

Write executable browser/keyboard test cases for actions, fields, selections, dates, overlays, feedback, shell/navigation, and tables/lists. Use frozen public signatures/case IDs so planning can run beside FE implementation.

## Owned files

- `/qa/beras-ui-phase-1/controls-data-test-cases.md`
- `/qa/beras-ui-phase-1/controls-data-results.md`

No product code, automation code, evidence screenshot, or Tere edit.

## Contract

Each procedure records case ID/URL, viewport, input mode, precondition, ordered keys/pointer actions, callback observation, expected DOM/ARIA/focus/overflow, result placeholder, and artifact path. Exact families:

- QA-F01 buttons/actions: default/hover/focus/active/disabled/pending/success/failure; pending emits once;
- QA-F02 fields/forms: required/optional/helper/error/read-only/disabled, labels, submit/cancel, long content;
- QA-F03 select/multiselect: open/close/select/clear/cancel/search/disabled/long/empty and Arrow/Home/End/Enter/Space/Escape;
- QA-F04 date/month/range: boundaries, reversed invalid range, presets, clear/cancel, disabled, keyboard;
- QA-F05 dialog/drawer/popover: initial/returned focus, modal containment, Escape/backdrop, 320x568 overflow actions;
- QA-F06 toast/alert/state: role/live announcement/close/retry/loading/empty/error/maintenance/permission/not-registered;
- QA-F07 shell/navigation: active, mobile closed/open, long/nested labels, action/topbar, no fixed narrow offset;
- QA-F08 table/list: loading/empty/error/populated, both sorts, select, page, dense/wide, optional/long values, named focusable overflow.

Use only manifest case IDs governed by C-03; callbacks are C-02. Failures identify owning task BU-P1-04/05/06/07/08/09.

## Acceptance criteria

- [ ] QA-F01…F08 each has complete happy, edge, keyboard/focus, repeated-action, and narrow-overflow procedures.
- [ ] Every required state is tied to a stable case ID; no generic “check accessibility/visual” step.
- [ ] Expected callback counts/payloads, focus target/order/return, ARIA states, and scroll ownership are objective.
- [ ] Results file contains no fabricated pass; defect template includes case, route, viewport/mode, exact reproduction, expected/actual, artifact.
- [ ] No product implementation. No Tere edits.

## Verification

Plan review plus later execution against:

```bash
npm run dev --workspace=@krasnaya/beras-ui
npm test --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

## Definition of Done

All eight matrices are executable and unambiguous; reviewer returns `STATUS: CLEAN`.

## Commit

`test(beras-ui): BU-QA-P1-02 controls plan (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
