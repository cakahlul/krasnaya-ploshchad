# BU-P1-11 — Native calendars and leave schedule grid

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 5, slot 1/3
**TRD coverage:** FE-11; R-08, R-10–R-11, R-13–R-14
**Estimated scope:** M; high-risk date/calendar slice

## Description

Implement native visual month/holiday calendars and dense leave schedule with ISO date helpers, complete keyboard navigation, boundary states, and independently operable narrow overflow.

**Wave 1 compile contract:** BU-P1-01 seeds a throwing `src/components/calendars/index.ts` scaffold. This task owns that path now and must replace the scaffold completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/calendars/**`
- `/apps/beras-ui/src/catalog/cases/calendars.tsx`
- `/apps/beras-ui/src/fixtures/calendars.ts`
- `/apps/beras-ui/tests/calendars.test.mjs`

This task exclusively implements/exports `LeaveScheduleGrid`; BU-P1-09 must not define it. BU-P1-03 owns CSS.

## Contract

Exact public exports owned: `MonthCalendar`, `HolidayCalendar`, `LeaveScheduleGrid`. Public `CalendarDay` comes from C-02. Values are controlled ISO `YYYY-MM-DD`; display uses `Intl`; no `dayjs` or current clock.

Month grid uses native buttons and one roving focus: Arrow keys move day, Home/End week boundary, PageUp/PageDown month, Enter/Space select. `HolidayCalendar` exposes selected/range/holiday/weekend/current/boundary/dense states and pointer range plus keyboard/two-click equivalent. `LeaveScheduleGrid` is a semantic table in a labelled focusable horizontal overflow region with explicit edit buttons; no TanStack API/virtualization.

Required cases:

- `calendar/holiday-calendar/empty|populated|selection|range|boundary|dense|narrow|reduced-motion`;
- `data-display/leave-schedule/loading|empty|error|populated|dense|selection|overflow|narrow`;
- direct `calendar/month-calendar/default|selection|boundary|narrow` cases.

Export `calendarCases: readonly CatalogRuntimeCase[]`; fixed dates only.

## Acceptance criteria

- [ ] Every exact export has public live cases; components accept presentational days/rows and emit typed values/actions only.
- [ ] Pure date helpers pass month/year/leap/boundary cases and never depend on locale parsing/current time.
- [ ] Complete roving calendar keyboard contract, selected/range announcements, pointer/keyboard equivalence, and visible focus pass.
- [ ] Empty/dense/holiday/weekend/boundary/selection/reduced-motion states are deterministic and non-color-only.
- [ ] Leave schedule covers both legacy row 74 and active row 75 intent without TanStack API; loading/empty/error/ready and edit action work.
- [ ] At 320, dense region scrolls to final date/action while page remains bounded; no Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/calendars.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser keyboard walkthrough at month boundaries and leave overflow at 320/1440; last command empty.

## Definition of Done

Date logic, roving focus, dense overflow, and all mapped states pass; reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-11 add native calendars (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
