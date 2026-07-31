# BU-P1-02 — Frozen inventory and 82-row machine ledger

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 1, slot 2/3
**TRD coverage:** FE-02; R-04–R-05; Gate 1
**Estimated scope:** M; data/schema slice

## Description

Materialize the normative baseline as stable JSON: exact manifest, exactly 82 ledger rows, four stylesheet analyses, required foundation inputs, artifact dispositions, stable cases, and evidence links. Copy audit facts, not Tere source/runtime code.

## Owned files

- `/apps/beras-ui/src/inventory/inventory-manifest.json`
- `/apps/beras-ui/src/inventory/inventory-ledger.json`
- `/apps/beras-ui/src/inventory/schemas.ts`
- `/apps/beras-ui/tests/inventory-schema.test.mjs`

BU-P1-15 owns `case-manifest.json`; BU-P1-17 owns `evidence/phase-1/evidence-manifest.json`.

## Contract

```ts
export interface InventoryManifest {
  schemaVersion: 1;
  baselineCommit: '79927540a3c27d2c29b42d84c42b7e9abcb51800';
  productionSources: string[];
  stylesheets: string[];
  foundationInputs: string[];
}

export interface InventoryLedgerEntry {
  sourcePath: string;
  currentDependencies: string[];
  removedRuntimeCoupling: string[];
  responsiveConcerns: string[];
  accessibilityConcerns: string[];
  artifacts: Array<{
    id: string;
    description: string;
    disposition:
      | 'implemented'
      | `canonicalized into ${string}`
      | 'non-visual business boundary'
      | 'not ported: dead CSS or known defect'
      | 'inventory-only: void/crimson';
    canonicalExports: string[];
    caseIds: string[];
    requiredStates: string[];
    rationale: string;
    evidenceIds: string[];
  }>;
}
```

Manifest denominator: exact Appendix A `17 + 12 + 51 + 1 + 1 = 82` production paths, four Appendix B CSS paths, `apps/tere-project/tailwind.config.ts`, font loading tagged to row 13, theme behavior tagged to row 82. Unique physical denominator is 87 paths; font/theme tags do not inflate 82 or 87.

Every row mirrors `.claude/specs/beras-ui/inventory-baseline.md`: source path, artifact(s), allowed disposition, canonical export(s), expanded three-segment case IDs, required states, removed coupling, responsive/a11y concerns, rationale, and evidence IDs. Evidence seed `S01`…`S82` becomes explicit IDs; no claim of completed browser evidence. All case/evidence IDs obey C-03 in [`../plan.md`](../plan.md).

Stylesheet artifact records cover exactly:

1. `apps/tere-project/src/app/bug-monitoring.css`;
2. `apps/tere-project/src/app/globals.css`;
3. `apps/tere-project/src/features/dashboard/components/FilterReport.css`;
4. `apps/tere-project/src/features/dashboard/components/SprintSelect.css`.

No `deferred`; void/crimson only `inventory-only: void/crimson`; raw HTML, dead/unloaded CSS, fixed 252px mobile offset, and fixed-width narrow dropdown use the documented known-defect/dead-CSS disposition.

Rows 46 and 50 list both their canonical visual export and the shared public `SprintOption`
contract. Its exact shape is frozen by BU-P1-01 as `BerasOption<string>` plus `group: string`,
optional `startDate`, and optional `endDate`; grouping/date behavior remains consumer-owned.

## Acceptance criteria

- [ ] Manifest baseline and all paths exactly match the normative PRD appendices; lists are unique and deterministic.
- [ ] Ledger has exactly one row per production source: app/page/layout `17/17`, shared `12/12`, feature `51/51`, ADF `1/1`, theme `1/1`.
- [ ] All four stylesheet inputs have selector/artifact disposition and case/evidence linkage; Tailwind/font/theme inputs are explicit.
- [ ] Every intended light visual artifact has non-empty canonical/case/evidence linkage; non-visual rows retain rationale. Unused/legacy/business-bound rows remain present.
- [ ] Only five allowed disposition forms appear; `deferred` and unexplained artifacts are zero.
- [ ] Schema test rejects wrong SHA/counts, duplicate/missing path, illegal disposition, malformed ID, empty required link, and denominator inflation.
- [ ] No Tere edits; source baseline is read-only.

## Verification

```bash
node --test apps/beras-ui/tests/inventory-schema.test.mjs
npm run verify:inventory --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Expected report includes `82/82`, `4/4`, `unexplained=0`, `deferred=0`; last command empty.

## Definition of Done

Machine data is deterministic and exhaustive, negative schema cases pass, reviewer spot-checks all 82 source paths against baseline, `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-02 freeze inventory ledger (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
