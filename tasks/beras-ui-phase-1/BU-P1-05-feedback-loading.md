# BU-P1-05 — Feedback, state panels, and deterministic loading

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 3, slot 1/3
**TRD coverage:** FE-07 plus toast/alert portion of FE-06; R-08, R-10–R-11, R-14
**Estimated scope:** M

## Description

Implement deterministic loading/skeleton/state feedback and accessible toast/alert/status surfaces, without timers, random data, remote images, or consumer-side retry behavior.

**Wave 1 compile contract:** BU-P1-01 seeds a throwing `src/components/feedback/index.ts` scaffold. This task owns that path now and must replace the scaffold completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/feedback/**`
- `/apps/beras-ui/src/catalog/cases/feedback.tsx`
- `/apps/beras-ui/src/fixtures/feedback.ts`
- `/apps/beras-ui/tests/feedback.test.mjs`

BU-P1-07 owns overlay mechanics; BU-P1-03 owns CSS.

## Contract

Exact exports: `Spinner`, `Skeleton`, `PageSkeleton`, `LoadingOverlay`, `LoadingIllustration`, `StateView`, `Callout`, `Toast`, `ToastViewport`, `MaintenanceState`, `AccessState`.

Callbacks are `onAction(actionId, meta)` or `onRetry()`. Loading uses `aria-busy`; decorative skeleton regions are hidden. Toast role: success/info `status`, urgent error only `alert`; close control named. Loading stage/progress/scene is a controlled prop with fixed fixture seed, never a current clock/random timer.

Required cases:

- `feedback/loading-overlay/waiting|data|progress|reduced-motion`;
- `feedback/page-skeleton/default|dense|reduced-motion`;
- `feedback/spinner/default|labelled|reduced-motion`;
- `feedback/maintenance-state/default|retry-pending|narrow`;
- `feedback/access-state/loading|denied|not-registered`;
- `feedback/state-view/loading|empty|error|retry|coming-soon`;
- `feedback/toast/success|error|long-content|reduced-motion`;
- `feedback/export-toast/success|error|long-content|reduced-motion|narrow`.

Exports `feedbackCases: readonly CatalogRuntimeCase[]`; fixture IDs/case IDs follow C-03. Root classes/data attributes follow C-04.

## Acceptance criteria

- [ ] Every exact export has a discoverable live case and controlled typed state/action contract.
- [ ] Loading illustration is native inline SVG/CSS, deterministic, locally rendered, and preserves visible text/stage under reduced motion.
- [ ] Loading/empty/error/success/failure, retry/pending, permission/not-registered, long/narrow states are all represented.
- [ ] Live regions announce once without stealing focus; skeletons are hidden from AT; repeated pending retry/action emits once.
- [ ] Reduced motion stops bounce/shimmer/loop while retaining state meaning.
- [ ] No `Math.random`, current time, remote resource, Tere import/env/network, or window reload.
- [ ] No Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/feedback.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser: exercise toast/retry/loading in normal and reduced motion; last command empty.

## Definition of Done

Determinism, live-region, pending, and reduced-motion checks pass; reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-05 add feedback states (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
