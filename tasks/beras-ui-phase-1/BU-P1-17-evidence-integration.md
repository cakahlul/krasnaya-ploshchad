# BU-P1-17 — Responsive, accessibility, and parity evidence integration

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 7, slot 2/3
**TRD coverage:** FE-18; R-13–R-14; Gate 4
**Estimated scope:** M; evidence/integration slice

## Description

Capture and integrate the required browser evidence against assembled public catalog cases. This task owns evidence only. Any product defect is returned to the owning FE task for revision; do not patch another task's code here.

## Owned files

- `/apps/beras-ui/evidence/phase-1/evidence-manifest.json`
- `/apps/beras-ui/evidence/phase-1/screenshots/**`
- `/apps/beras-ui/evidence/phase-1/results/**`
- `/apps/beras-ui/evidence/phase-1/phase-1-report.md`

BU-QA-P1-04 owns QA procedure/result templates under `/qa/**`; BU-P1-16 owns evidence validator.

## Contract

```ts
export interface EvidenceEntry {
  id: string;
  caseId: string;
  check:
    | 'visual'
    | 'responsive'
    | 'keyboard'
    | 'focus'
    | 'contrast'
    | 'motion'
    | 'offline';
  viewport?: 320 | 768 | 1024 | 1440;
  artifactPath: string;
  result: 'pass' | 'fail';
  note?: string;
}
```

ID: `evidence:<case-id>:<check>:<viewport-or-mode>`. Filename: `<case-id with slash replaced by __>__<check>__<viewport-or-mode>.png|json|md`. Screenshots record browser/OS, route, case ID, viewport, reduced-motion mode; zoom 100%.

Each manifest-required case receives visual and all applicable responsive/keyboard/focus/contrast/motion/offline evidence. Widths are exactly 320, 768, 1024, 1440 (heights 800,800,900,900); dialogs also 320x568. Charts, tables, dialogs/select/date, calendars, trees, toasts, icon naming, loading, and `Stat3DScene` require interaction proof in addition to screenshots.

Intentional delta notes are limited to native replacement, canonical consolidation, contrast correction, mobile-shell fix, dead/defect omission, and void/crimson inventory-only. No missing evidence can be marked pass.

## Acceptance criteria

- [ ] Every required manifest case has all applicable evidence entries and existing artifact paths; no duplicate/dangling ID.
- [ ] Required width runs prove document no-overflow, action visibility, named inner overflow, shell correction, and responsive layout.
- [ ] Keyboard/focus evidence covers global catalog and every interactive pattern; contrast thresholds and non-color meaning pass.
- [ ] Reduced motion stops loops/parallax/shimmer/bounce/smooth scroll; offline run has zero unexpected remote/Tere/auth/analytics request; console clean.
- [ ] Complex native families include interaction/semantic evidence, never screenshot-only.
- [ ] Report prints exact exit fields including `82/82`, `4/4`, zero unexplained/deferred/prohibited/private/network/Tere changes and required evidence present/required.
- [ ] Product defect is routed to owner and remains fail until revised/rechecked; no Tere edit.

## Verification

```bash
npm run dev --workspace=@krasnaya/beras-ui
npm run verify:evidence --workspace=@krasnaya/beras-ui
npm run beras:verify
npm run beras:build
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Last command empty; all manifest evidence `result` values pass.

## Definition of Done

Evidence matrix complete/objective/reproducible, no hidden product patch, full gate clean, reviewer returns `STATUS: CLEAN`.

## Commit

`test(beras-ui): BU-P1-17 integrate evidence (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
