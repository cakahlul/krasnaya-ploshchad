# BU-QA-P1-04 — Release evidence, resilience, and exit plan

**Stack:** QA
**Assigned role:** `qa-executor`
**Reviewer role:** `qa-reviewer`
**Wave:** 7, slot 3/3
**TRD coverage:** QA sections 2–3 and 6–12; Gate 4 and final exit report
**Estimated scope:** M; QA artifact only

## Description

Write the exhaustive release execution matrix for viewports, keyboard/focus, contrast, motion, console/network/offline, resilience, visual parity, evidence naming, and final CLEAN/NEEDS_REVISION report. Do not implement product behavior.

## Owned files

- `/qa/beras-ui-phase-1/release-evidence-test-cases.md`
- `/qa/beras-ui-phase-1/release-evidence-results.md`
- `/qa/beras-ui-phase-1/exit-report-template.md`

BU-P1-17 owns actual evidence artifacts; this task owns procedures/result templates.

## Contract

Preconditions: Node `>=20.9.0`, baseline SHA exact, `npm ci`, browser zoom 100%, fixed fixtures, no Tere env/credentials, light only, cache disabled for network run.

Viewport matrix: every case uses its manifest widths among 320x800, 768x800, 1024x900, 1440x900; dialogs also 320x568. For each run assert `document.documentElement.scrollWidth <= clientWidth`, except one explicitly named inner focusable/labelled region that reaches final content/action.

Known shell regression route/assertions are exact QA TRD section 6. Keyboard paths cover global catalog, tabs/segmented, menu/select/multiselect, dialog/drawer, table, calendar, tree, chart, toast, 3D scene. No positive `tabindex`, clipped/hidden focus, or stranded modal focus.

Contrast: normal text `>=4.5:1`; large text and essential UI/focus `>=3:1`; check active/hover/focus/disabled meaning and grayscale/non-color cues. Reduced motion stops all loops/parallax/shimmer/bounce/auto animation/smooth scroll without hiding state.

Console/network/offline/resilience sequence follows QA TRD section 9 exactly, including direct refresh, no hydration/key/error/failed remote request, rapid pending click/open-close/switch/resize, no stale overlay/orphan animation/corrupted state. Allowed requests are local catalog document/JS/CSS/local-generated fonts/dev source maps only.

Exit template fields are verbatim:

```text
baseline=<40-char SHA>
production_sources=82/82
stylesheets=4/4
public_exports=<covered>/<total>
catalog_cases=<resolved>/<total>
unexplained_artifacts=0
deferred=0
prohibited_dependencies=0
private_imports=0
unexpected_network_requests=0
required_evidence=<present>/<required>
tere_changed_files=0
STATUS: CLEAN
```

Any failure uses `STATUS: NEEDS_REVISION` plus case ID, route, viewport/mode, ordered reproduction, expected, actual, artifact path, and owning task.

## Acceptance criteria

- [ ] Every manifest case is scheduled at every declared width; no statistical sample replaces export/case/source exhaustion.
- [ ] All keyboard, contrast, semantics, motion, console, network/offline, refresh, and rapid-interaction procedures are objective and ordered.
- [ ] Evidence filename/ID/check requirements exactly match BU-P1-17/C-03; complex families require interaction proof.
- [ ] Results/template never predeclare pass; CLEAN is only legal when every required count/evidence/gate is green.
- [ ] Tere immutability and exact `82/82`, `4/4` are explicit final blockers.
- [ ] No product implementation. No Tere edits.

## Verification

Execute after assembled FE tasks:

```bash
npm ci
npm run lint --workspace=@krasnaya/beras-ui
npm run typecheck --workspace=@krasnaya/beras-ui
npm test --workspace=@krasnaya/beras-ui
npm run verify:inventory --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
npm run build --workspace=@krasnaya/beras-ui
npm run dev --workspace=@krasnaya/beras-ui
npm run verify:evidence --workspace=@krasnaya/beras-ui
npm run beras:verify
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

## Definition of Done

Exhaustive release matrix and honest exit template complete, reviewer returns `STATUS: CLEAN`.

## Commit

`test(beras-ui): BU-QA-P1-04 release plan (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
