# BU-P1-13 — Native Stat3DScene and auth compositions

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 5, slot 3/3
**TRD coverage:** FE-14; R-08–R-11, R-13–R-14
**Estimated scope:** M; high-risk native visual/auth slice

## Description

Replace the Three-based visual with semantic DOM/CSS 3D and compose presentational auth views around it. Preserve depth, seeded sparkles, focus/pointer detail, and reduced-motion meaning without auth/business logic.

**Wave 1 compile contract:** BU-P1-01 seeds throwing `src/components/stat-3d/index.ts` and `src/layouts/auth/index.ts` scaffolds. This task owns those paths now and must replace both completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/stat-3d/**`
- `/apps/beras-ui/src/layouts/auth/**`
- `/apps/beras-ui/src/catalog/cases/auth.tsx`
- `/apps/beras-ui/src/fixtures/auth.ts`
- `/apps/beras-ui/tests/stat3d-auth.test.mjs`

BU-P1-03 owns CSS; BU-P1-07 owns legal dialog mechanics; BU-P1-04 owns OAuth button/icon.

## Contract

Exact exports: component `Stat3DScene`; layouts `AuthLayout`, `SignInView`, `SignUpView`.

`Stat3DScene` uses semantic focusable DOM statistic bars with visible label/value, CSS perspective/grid/depth/sparkles, pointer parallax via scoped CSS variables, and no animation/render loop. Fixture positions are seeded literals. Focus and pointer expose identical detail. Reduced motion freezes transition/sparkle/parallax but leaves all values/actions. No Three/Canvas requirement; if Canvas is proven necessary it stays decorative and semantic DOM authoritative.

Auth layouts accept controlled field/state/action/legal props and emit C-02 events only. Navy hero is an evidenced component variant inside light product, not a global dark theme. No Firebase/session/router/localStorage.

Required cases:

- `visualization/stat-3d-scene/default|focus|pointer|reduced-motion|narrow`;
- `composition/sign-in/default|validation|pending|error|legal-open|narrow`;
- `composition/sign-up/default|validation|pending|error|success|narrow`.

Export `authCases: readonly CatalogRuntimeCase[]`.

## Acceptance criteria

- [ ] Live scene preserves perspective/bars/grid/depth/sparkles/parallax/hover/focus intent with native DOM/CSS; no static placeholder or third-party visual library.
- [ ] Every statistic is named/focusable with visible value; pointer/focus parity works; reduced motion/no-transform still exposes complete semantic values/actions.
- [ ] Output is deterministic across runs; no `Math.random`, current time, loop, remote image, or hydration mismatch.
- [ ] Sign-in/up cases cover validation/pending/error/success/legal/narrow; repeated pending submit emits once.
- [ ] Auth views contain no Firebase/auth/session/router/legal storage; callbacks contain presentational values only.
- [ ] At 320 actions/content remain visible, no page overflow; no Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/stat3d-auth.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser: scene pointer/focus/reduced-motion/no-transform and auth keyboard flow at 320/1440; last command empty.

## Definition of Done

Native equivalence/determinism/auth-state checks pass with live evidence capability; reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-13 add 3d auth views (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
