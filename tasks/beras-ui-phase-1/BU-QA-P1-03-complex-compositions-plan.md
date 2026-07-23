# BU-QA-P1-03 — Complex widgets and compositions test-case plan

**Stack:** QA
**Assigned role:** `qa-executor`
**Reviewer role:** `qa-reviewer`
**Wave:** 6, slot 3/3
**TRD coverage:** QA-F09…QA-F15
**Estimated scope:** M; QA artifact only

## Description

Write executable visual+interaction test cases for native charts, calendars, tree, ADF, loading, `Stat3DScene`, and all page compositions. Output plan/results template only; no product or automation implementation.

## Owned files

- `/qa/beras-ui-phase-1/complex-compositions-test-cases.md`
- `/qa/beras-ui-phase-1/complex-compositions-results.md`

## Contract

Each case includes stable ID/route, fixed fixture, viewport/motion mode, exact pointer/keyboard steps, semantic equivalent assertion, expected callbacks/focus/DOM/visual behavior, artifact name, and result placeholder.

Cover exactly:

- QA-F09 charts: empty/single/multiple/flat/zero/long, focus-pointer tooltip parity, legend, semantic data equivalent;
- QA-F10 calendars: empty/dense/holiday/weekend/boundary/selected/range/edit/sticky overflow and full day keyboard;
- QA-F11 tree: empty/collapsed/expanded/selected/deep/large/load-more and complete roving keyboard;
- QA-F12 ADF: empty/headings/marks/lists/quote/code/table/panel/safe+unsafe links/unknown/overflow;
- QA-F13 loading: stage variants, deterministic output, busy/name semantics, reduced-motion stable state;
- QA-F14 `Stat3DScene`: seeded bars/depth/sparkles/perspective/parallax, hover-focus parity, no loop, reduced motion;
- QA-F15 auth, dashboard, reports/productivity, bug, config, MCP, epic, holiday, leave, members; callbacks only presentational values.

Cases use exact C-03 IDs from BU-P1-10…15 and artifact naming in BU-P1-17. Screenshots alone are never sufficient.

## Acceptance criteria

- [ ] QA-F09…F15 each includes every state/interaction and objective semantic/visual assertion.
- [ ] Keyboard sequences are explicit for chart points, calendar days, tree, ADF links/overflow, loading action, scene bars, and page controls.
- [ ] Each native replacement includes both visual and interaction-equivalence evidence requirements.
- [ ] Composition cases prove fixture-only/offline behavior and presentational callback payloads.
- [ ] Results remain blank until execution; defect template includes case/route/viewport/mode/repro/expected/actual/artifact/owner.
- [ ] No product implementation. No Tere edits.

## Verification

Plan review plus later execution against:

```bash
npm run dev --workspace=@krasnaya/beras-ui
npm test --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:evidence --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

## Definition of Done

All seven family matrices executable and non-placeholder, reviewer returns `STATUS: CLEAN`.

## Commit

`test(beras-ui): BU-QA-P1-03 complex plan (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
