# BU-P1-16 — Consumer fixture and contract validators

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 7, slot 1/3
**TRD coverage:** FE-17; Gates 1–3 and 5; QA-S01…S12 implementation support
**Estimated scope:** M

## Description

Implement the clean public consumer fixture and five zero-dependency Node validators. Each validator must fail on a seeded contract violation and print objective gate counts; no browser-test framework or UI dependency.

## Owned files

- `/apps/beras-ui/scripts/{verify-inventory.mjs,verify-catalog.mjs,verify-boundaries.mjs,verify-isolation.mjs,verify-evidence.mjs}`
- `/apps/beras-ui/tests/consumer/consumer.tsx`
- `/apps/beras-ui/tests/validators.test.mjs`

Do not edit manifests/cases/evidence to make validators pass; report failures to their owning task.

## Contract

Consumer imports at least one item from root `.`, `./components`, `./layouts`, `./foundations`, `./types`, and imports `./styles.css` once. It imports no source path/private module.

Validators enforce C-01…C-05 and exact QA-S01…S12:

- inventory exact SHA/82 unique/4 CSS/foundation inputs/82 ledger rows/allowed dispositions/no unexplained/deferred/dangling links;
- catalog every public component/layout export -> live manifest case -> fixture/runtime/docs/evidence, exact stable ID and async family states;
- boundaries exact dependency allowlists/export map, no wildcard/private import, prefixed CSS, outer-only `className`, no public internal style prop/prohibited UI import;
- isolation no Tere path, env secret/API URL/auth/store/query/mutation/network/non-deterministic fixture and empty baseline Tere diff;
- evidence every required matrix entry resolves to an existing artifact, legal check/viewport, result pass, and required interaction proof where screenshot alone fails.

Exact reports include `82/82`, `4/4`, `unexplained=0`, `deferred=0`. Node stdlib only; tests use `node:test`. Seed violations live in temporary test fixtures, never mutate canonical data.

## Acceptance criteria

- [ ] Consumer typechecks/builds through every public subpath and stylesheet with no private/source import.
- [ ] All five scripts return non-zero with targeted message for every seeded violation and zero only for valid assembled data.
- [ ] Inventory/catalog validators prove graph completeness, not counts alone; every public export and case resolves.
- [ ] Boundary scan catches exact disallowed dependency/import/global CSS/public style escape; isolation catches network/Tere/env/random/current clock.
- [ ] Evidence validator rejects missing/failing/duplicate/dangling artifact and screenshot-only proof for complex interactive families.
- [ ] Validators do not rewrite/fix source data and add no dependency; no Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/validators.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:inventory --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
npm run verify:evidence --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Last command empty.

## Definition of Done

Every positive and seeded-negative contract check passes with clear failure output; reviewer returns `STATUS: CLEAN`.

## Commit

`test(beras-ui): BU-P1-16 add contract validators (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
