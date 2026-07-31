# Beras UI Phase 1/MVP Task Checklist

Execution rules and frozen contracts: [`plan.md`](./plan.md). Local tasks only; no Jira transition.

## Wave 1 — capacity slots 1/3 to 3/3

- [x] [BU-P1-01 — Workspace, package, and public contract](./beras-ui-phase-1/BU-P1-01-workspace-public-contract.md)
- [x] [BU-P1-02 — Frozen inventory and 82-row ledger](./beras-ui-phase-1/BU-P1-02-inventory-ledger.md)
- [x] [BU-P1-03 — Foundations and shipped stylesheet](./beras-ui-phase-1/BU-P1-03-foundations-styles.md)
- [x] Barrier: all executors finished
- [x] Barrier: all three reviewers returned `STATUS: CLEAN`
- [x] Commit all CLEAN tasks individually

## Wave 2 — capacity slots 1/3 to 3/3

- [x] [BU-P1-04 — Primitives and named icons](./beras-ui-phase-1/BU-P1-04-primitives-icons.md)
- [x] [BU-P1-06 — Forms, selection, and date entry](./beras-ui-phase-1/BU-P1-06-forms-selection-date.md)
- [x] [BU-QA-P1-01 — Static/package test-case plan](./beras-ui-phase-1/BU-QA-P1-01-static-package-plan.md)
- [x] Barrier: all executors finished
- [x] Barrier: all reviewers returned `STATUS: CLEAN`
- [x] Commit all CLEAN tasks individually

## Wave 3 — capacity slots 1/3 to 3/3

- [ ] [BU-P1-05 — Feedback and deterministic loading](./beras-ui-phase-1/BU-P1-05-feedback-loading.md)
- [ ] [BU-P1-07 — Dialogs, drawers, popovers, and specialized overlays](./beras-ui-phase-1/BU-P1-07-overlays.md)
- [ ] [BU-QA-P1-02 — Controls/data functional test-case plan](./beras-ui-phase-1/BU-QA-P1-02-controls-data-plan.md)
- [ ] Barrier: all executors finished
- [ ] Barrier: all reviewers returned `STATUS: CLEAN`
- [ ] Commit all CLEAN tasks individually

## Wave 4 — capacity slots 1/3 to 3/3

- [ ] [BU-P1-08 — Navigation and corrected responsive shell](./beras-ui-phase-1/BU-P1-08-navigation-shell.md)
- [ ] [BU-P1-09 — Data tables, lists, and metrics](./beras-ui-phase-1/BU-P1-09-data-display.md)
- [ ] [BU-P1-10 — Native SVG chart family](./beras-ui-phase-1/BU-P1-10-svg-charts.md)
- [ ] Barrier: all executors finished
- [ ] Barrier: all three reviewers returned `STATUS: CLEAN`
- [ ] Commit all CLEAN tasks individually

## Wave 5 — capacity slots 1/3 to 3/3

- [ ] [BU-P1-11 — Native calendars and leave schedule](./beras-ui-phase-1/BU-P1-11-calendars.md)
- [ ] [BU-P1-12 — Hierarchy tree and safe ADF](./beras-ui-phase-1/BU-P1-12-tree-adf.md)
- [ ] [BU-P1-13 — Stat3DScene and auth layouts](./beras-ui-phase-1/BU-P1-13-stat3d-auth.md)
- [ ] Barrier: all executors finished
- [ ] Barrier: all three reviewers returned `STATUS: CLEAN`
- [ ] Commit all CLEAN tasks individually

## Wave 6 — capacity slots 1/3 to 3/3

- [ ] [BU-P1-14 — Page compositions](./beras-ui-phase-1/BU-P1-14-page-compositions.md)
- [ ] [BU-P1-15 — Catalog, case registry, and docs](./beras-ui-phase-1/BU-P1-15-catalog-docs.md)
- [ ] [BU-QA-P1-03 — Complex widgets/compositions test-case plan](./beras-ui-phase-1/BU-QA-P1-03-complex-compositions-plan.md)
- [ ] Barrier: all executors finished
- [ ] Barrier: all reviewers returned `STATUS: CLEAN`
- [ ] Commit all CLEAN tasks individually

## Wave 7 — capacity slots 1/3 to 3/3

- [ ] [BU-P1-16 — Consumer fixture and validators](./beras-ui-phase-1/BU-P1-16-consumer-validators.md)
- [ ] [BU-P1-17 — Responsive/a11y evidence integration](./beras-ui-phase-1/BU-P1-17-evidence-integration.md)
- [ ] [BU-QA-P1-04 — Release evidence and exit plan](./beras-ui-phase-1/BU-QA-P1-04-release-evidence-plan.md)
- [ ] Barrier: all executors finished
- [ ] Barrier: all reviewers returned `STATUS: CLEAN`
- [ ] Commit all CLEAN tasks individually

## Final Phase 1 gate

- [ ] `npm ci`
- [ ] `npm run beras:verify`
- [ ] `npm run beras:build`
- [ ] Coverage: `production_sources=82/82`, `stylesheets=4/4`, `unexplained_artifacts=0`, `deferred=0`
- [ ] Evidence: all required entries present and passing
- [ ] `git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project` prints nothing
- [ ] All 21 task commits exist; Phase 2 may start only after this barrier
