# BU-QA-P1-01 — Static/package executable test-case plan

**Stack:** QA
**Assigned role:** `qa-executor`
**Reviewer role:** `qa-reviewer`
**Wave:** 2, slot 3/3
**TRD coverage:** QA-S01…QA-S12; Gates 1–3 and 5
**Estimated scope:** M; QA artifact only

## Description

Write executable, evidence-ready test cases for every static/package contract. Output test procedure and result schema, not product implementation or validator code.

## Owned files

- `/qa/beras-ui-phase-1/static-package-test-cases.md`
- `/qa/beras-ui-phase-1/static-package-results.md`

Do not edit `/apps/beras-ui/src/**`, `/apps/beras-ui/scripts/**`, tests, manifests, or Tere.

## Contract

Each test case records: ID, requirement, precondition, exact command/input, negative seed, steps, objective expected result, actual result placeholder, pass/fail, artifact path, and defect handoff fields. Use C-01…C-05 in [`../plan.md`](../plan.md).

Cover exactly:

- QA-S01 exact SHA, 82 unique production paths, 4 unique CSS, foundation inputs;
- QA-S02 82 ledger rows, allowed dispositions, zero `deferred`, artifact case/evidence links;
- QA-S03 no dangling/duplicate case ID and renderer/fixture/docs/evidence resolution;
- QA-S04 no wildcard/private export and every public component/layout has live case;
- QA-S05 root/components/layouts/foundations/types/styles consumer imports compile/build;
- QA-S06 catalog public-import-only boundary;
- QA-S07 exact runtime/dev allowlists and zero prohibited import;
- QA-S08 no Tere/env/API/auth/store/query/mutation/network fixture;
- QA-S09 prefixed/scoped CSS, no global reset, no dark/void/crimson output;
- QA-S10 sentinel `className` outer-root only, no style/slot escape hatch;
- QA-S11 deterministic fixtures: no random/current clock/fetch/XHR/WebSocket/EventSource;
- QA-S12 empty Tere diff from baseline.

Denominator assertions are literal `production_sources=82/82`, `stylesheets=4/4`, `unexplained_artifacts=0`, `deferred=0`.

## Acceptance criteria

- [ ] All 12 IDs appear once with positive and seeded-negative procedure that can be followed without interpretation.
- [ ] Expected outputs include exact counts, schemas, export paths, dependency versions, forbidden patterns, and empty Tere diff.
- [ ] Each failure routes to one owning BU-P1 task and includes reproduction/expected/actual/artifact fields.
- [ ] Results file is a blank executable record, not invented pass evidence.
- [ ] No product/test implementation and no Tere edit.

## Verification

QA reviewer executes plan completeness checks, then later runs:

```bash
npm run verify:inventory --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
npm run typecheck --workspace=@krasnaya/beras-ui
npm run build --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

## Definition of Done

QA plan is exhaustive/objective/runnable, result placeholders honest, reviewer returns `STATUS: CLEAN`.

## Commit

`test(beras-ui): BU-QA-P1-01 static plan (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
