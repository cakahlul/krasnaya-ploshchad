# BU-P1-07 — Dialogs, drawers, popovers, and specialized overlays

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 3, slot 2/3
**TRD coverage:** FE-06 plus specialized overlay exports from FE-15; R-08, R-10–R-11, R-14
**Estimated scope:** M

## Description

Implement controlled native modal/non-modal overlay mechanics and the evidenced presentational form/detail dialogs. Focus ownership, close reasons, small-height overflow, and callbacks are package behavior; mutations/business validation remain outside.

**Wave 1 compile contract:** BU-P1-01 seeds a throwing `src/components/overlays/index.ts` scaffold. This task owns that path now and must replace the scaffold completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/overlays/**`
- `/apps/beras-ui/src/catalog/cases/overlays.tsx`
- `/apps/beras-ui/src/fixtures/overlays.ts`
- `/apps/beras-ui/tests/overlays.test.mjs`

BU-P1-08 composes `Drawer` into shell; BU-P1-03 owns CSS.

## Contract

Exact exports: `Dialog`, `ConfirmDialog`, `LegalContentDialog`, `Drawer`, `Popover`, `MemberTasksDialog`, `MemberFormDialog`, `LeaveFormDialog`, `HolidayFormDialog`, `ConfigFormDialog`, `TicketDetailDialog`, `ApiKeyTable`, `JsonImportPanel`.

`Dialog|ConfirmDialog|LegalContentDialog` use native `<dialog>`/`showModal()`. Controlled signature: `onOpenChange(open, meta)` plus a typed close reason for action/Escape/backdrop; explicit backdrop policy. Focus starts at explicit initial ref or first control, modal Tab stays contained, Escape closes, and focus returns to invoker. At 320px and 568px height, body scrolls internally and footer actions remain visible.

Required cases:

- `overlay/legal-dialog/terms|privacy|overflow|narrow`;
- `overlay/member-tasks/loading|empty|error|populated|expanded|long-content`;
- `overlay/member-form/create|edit|validation|lead|pending|error|narrow`;
- `overlay/leave-form/create|edit|read-only|validation|multiple-ranges|confirm|pending|error|narrow`;
- `overlay/holiday-form/create|edit|validation|existing|confirm|pending|error|narrow`;
- `overlay/dialog/default|overflow|narrow`, `overlay/confirm-dialog/default|pending`, `overlay/drawer/closed|open|narrow`, `overlay/popover/closed|open|long-content`, and live default/state cases for remaining specialized exports.

`JsonImportPanel` also participates in `form/json-import/*`; `ApiKeyTable` in `composition/mcp-connection/*`; `TicketDetailDialog` in search/tree cases. Export `overlayCases: readonly CatalogRuntimeCase[]`. No raw HTML.

## Acceptance criteria

- [ ] All exact exports exist with controlled props/events and public-import live cases; no API/mutation/router/clipboard/window side effect.
- [ ] Modal initial focus, Tab containment, Escape/cancel/backdrop policy, close reason, and focus return work; no stranded focus or positive `tabindex`.
- [ ] Drawer/popover outside/Escape behavior is explicit; modal background is not keyboard reachable.
- [ ] All mapped create/edit/read-only/validation/confirm/pending/error/long/narrow states render from fixed props.
- [ ] At 320x568 actions stay visible and content overflow is operable; focus ring is not clipped.
- [ ] ADF/plain content is safe React content only; `dangerouslySetInnerHTML` forbidden.
- [ ] No Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/overlays.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser: keyboard-only dialog/drawer/popover at 320x568 and 1440x900; last command empty.

## Definition of Done

Overlay focus/close/overflow checks and all mapped cases pass; reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-07 add overlays (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
