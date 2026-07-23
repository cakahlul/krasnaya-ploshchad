# Beras UI Rollout Phases

## Status and source

- Source: confirmed manual PRD and Tere UI audit.
- Target: new sibling workspace `apps/beras-ui` beside `apps/tere-project`.
- Rollout decision: Phase 1 is a **completeness MVP**, not a small component-library pilot.
- Open MVP questions: none. The user explicitly requires every canonical presentational component, foundation, and layout in Phase 1.

## Product objective

Build Beras UI once, from zero, as both:

1. a runnable internal web catalog; and
2. a private workspace package ready for Tere to consume later.

The value of Phase 1 is complete visual coverage of Tere without copying Tere's API, authentication, store, or business logic. A partial library would not meet that value, because migration would still depend on unmodeled local UI.

## Fixed inventory denominator

Phase 1 coverage uses this immutable source denominator:

| Source group | Count |
|---|---:|
| App/page/layout UI sources | 17 |
| Shared UI sources | 12 |
| Feature UI sources | 51 |
| ADF renderer | 1 |
| Theme hook | 1 |
| **Production UI source total** | **82** |

The audited baseline is Tere commit `79927540a3c27d2c29b42d84c42b7e9abcb51800`. The inventory manifest must pin the 82 paths, four stylesheet paths, `tailwind.config.ts`, and font/foundation inputs to that baseline. Later Tere drift does not silently change the denominator: it fails the coverage gate until recorded and explicitly reconciled as a scope change.

The four stylesheet sources (2,045 LOC) and their foundations are additional mandatory inventory inputs. Source count is not component count: duplicate patterns may map many-to-one into a canonical Beras component, but every source and every visual artifact still needs a disposition.

The mapping ledger must record, for every source:

- source path and visual artifacts;
- canonical Beras export or catalog composition covering each artifact;
- standalone catalog use cases and represented states;
- responsive and accessibility concerns;
- disposition and rationale.

Allowed dispositions are limited to:

- `implemented`;
- `canonicalized into <Beras export>`;
- `non-visual business boundary` for logic only, while any visual shell in the same source remains covered;
- `not ported: dead CSS or known defect`, with evidence;
- `inventory-only: void/crimson`, the only theme exception explicitly approved.

`deferred` is not a valid Phase 1 disposition. Unused, legacy, or business-bound source files do not leave the denominator; any distinct intended light-mode visual in them must still be implemented or canonicalized.

## Rollout overview

| Rollout phase | Outcome | Why here |
|---|---|---|
| **Phase 1 — MVP: complete Beras package and catalog** | Beras independently covers 100% of the approved Tere visual inventory and is ready for consumption. | This is the minimum that achieves the confirmed goal. Missing canonical UI leaves the package incomplete and blocks safe migration. |
| **Phase 2 — Tere adoption and migration** | Tere consumes Beras across its active UI while retaining real auth, API, store, and business behavior. | Explicitly forbidden in Phase 1; depends on a stable, complete Phase 1 package contract. |
| **Phase 3 — legacy removal and governance** | Superseded Tere UI/CSS/dependencies are removed and drift prevention is established. | Cleanup and long-term enforcement are useful after adoption but are not required to prove the package or migrate active flows. |

---

## Phase 1 — MVP: complete Beras package and catalog

### User outcome

As an internal engineer, I can browse every canonical Tere visual pattern in a standalone catalog, exercise it with deterministic local states, and import it through a stable private workspace-package API without depending on Tere runtime services.

### Exact scope

#### 1. Workspace product

- Create `apps/beras-ui` as a Next.js + React + TypeScript + Tailwind workspace.
- Make it runnable as an internal catalog and importable as a private workspace package.
- Keep package private; no npm publication configuration and no public documentation site.
- Provide documented workspace commands for dev, build, lint, type-check, and tests.
- Expose components, layouts, foundations, tokens, variant types, and any public supporting types only through deliberate package entrypoints. Consumers must not need source-path imports.
- Make the catalog itself consume those public package entrypoints and the exported Beras stylesheet; it must not receive privileged relative access to private implementation files.

#### 2. Complete inventory and canonicalization

- Audit and map all 82 production UI sources and all four stylesheet sources.
- Include visual artifacts from app/layout, shared, feature, ADF renderer, theme behavior, business-bound, unused, and legacy sources.
- Consolidate similar visuals into canonical components; preserve source-to-canonical traceability.
- Recreate visual intent, not the old component tree, third-party APIs, accidental implementation details, dead CSS, or known defects.
- Preserve the intended current light visual baseline.
- Record void/crimson artifacts in inventory only; do not implement those themes.

#### 3. Foundations and customization contract

- Consolidate semantic color, typography, spacing, sizing, border, radius, elevation, motion, layer, breakpoint, status, and data-visualization foundations actually evidenced by inventory.
- Resolve duplicate or conflicting Tere tokens into one documented semantic token contract.
- Use semantic CSS tokens for themeable values and typed variants for supported component appearance/behavior.
- If public `className` is accepted, apply it only to the outer consumer-controlled positioning/layout boundary. It must not act as an escape hatch for internal component styling.
- Do not expose arbitrary consumer styling props that bypass tokens or typed variants. Internal computed styles needed for data geometry are not a public customization API.

#### 4. Canonical presentational surface

- Implement every canonical primitive, compound component, data-display component, feedback/state view, visualization, navigation element, content renderer, and page/layout shell required by the inventory.
- Do not defer difficult categories such as charts, calendars, tables, hierarchy/tree views, dialogs, selects, date controls, navigation shells, responsive shells, icons, loading/error feedback, or the ADF renderer when the inventory requires them.
- Treat `Stat3DScene` as part of that rule: replacing Three does not permit omission or a static placeholder; its mapped visual and interaction intent needs a native case.
- Replace third-party visual behavior with native HTML/CSS/SVG/Canvas/Web APIs as appropriate.
- Keep components controlled by typed props/events. Do not duplicate Tere API calls, authentication, stores, repositories, permissions, or domain orchestration.

#### 5. Standalone live catalog cases

- Give every exported component and layout a discoverable, live standalone use case.
- Use only local deterministic props/fixtures; the catalog must run without Tere auth, API, database, Jira, Firebase, Zustand stores, or environment secrets.
- For data-bearing components and layouts, include loading, empty, error, and populated cases.
- For every component, include all inventory-relevant variants and interaction states, including disabled, validation, overflow, focus, selection, expansion, or reduced-motion behavior where applicable.
- Ensure a fixture can reproduce every source-mapped visual artifact without embedding Tere business logic.

#### 6. Responsive and accessible behavior

- Support and verify viewport widths 320, 768, 1024, and 1440 pixels.
- Fix the known mobile-shell geometry/overflow defect in Beras; do not touch Tere in this phase.
- Meet WCAG AA basics: semantic structure, keyboard operation, visible focus, sensible focus order, names/labels, contrast, and reduced-motion support.
- Preserve usable overflow and navigation behavior for dense tables, calendars, charts, trees, dialogs, and menus at the required widths.

#### 7. Dependency boundary

- Allowed UI implementation basis: Next.js, React, TypeScript, Tailwind, and native HTML/CSS/SVG/Canvas/Web APIs.
- Beras must not import or depend on Ant Design, Recharts, Lucide, Framer Motion, Three, Radix, shadcn, or another third-party UI/visual library.
- Maintain an explicit direct-dependency allowlist instead of relying only on a banned-library list. Runtime UI dependencies are limited to the approved basis; non-runtime build, lint, and test tools must be separately documented and must not provide UI/visual behavior.
- Native icons and visualizations must remain accessible and token-driven.

### Explicitly out of Phase 1

- Any modification under `apps/tere-project/**`.
- Tere imports, adapters, migration, or production rollout.
- Real Tere API/auth/store/repository/business logic.
- Public npm publication or public documentation.
- Dark, void, or crimson theme implementation.
- New product UI that is not needed to cover the approved Tere visual inventory.
- Reproduction of dead CSS, known defects, or accidental third-party-library behavior.

### Phase 1 acceptance gates

All gates are required; there is no partial-MVP release.

#### Gate 1 — Coverage contract

- Inventory manifest is pinned to Tere commit `79927540a3c27d2c29b42d84c42b7e9abcb51800`; its 82 source paths, four stylesheet paths, Tailwind config, and font/foundation inputs are reproducible.
- Inventory ledger has exactly 82 production UI source rows.
- All four stylesheet sources are analyzed, including token/rule disposition.
- Every distinct visual artifact has an allowed disposition and evidence.
- Coverage report shows `82/82` sources accounted for, zero unexplained artifacts, and zero `deferred` entries.
- Business-bound, unused, and legacy sources are visibly present in the ledger rather than filtered out.
- Void/crimson, dead CSS, and known-defect exceptions are explicit and are not implemented.

#### Gate 2 — Consumable package

- `apps/beras-ui` is registered as a private workspace and can run independently.
- Dev, build, lint, type-check, and test commands are documented and pass from a clean install.
- A consumer fixture imports all public categories through package entrypoints, with no source-path import.
- The catalog imports its components and exported stylesheet through the same public entrypoints as a consumer.
- Public props and exports type-check; semantic tokens and typed variants are the supported customization surface.
- `className` behavior is verified as outer positioning/layout only.
- Manifest matches the approved direct-dependency allowlist; source scan proves zero unapproved UI/visual dependencies or imports.

#### Gate 3 — Catalog completeness

- Every public component/layout is discoverable and renders in at least one standalone catalog case.
- Every mapped visual artifact is reachable through a catalog case.
- Every mapped artifact has a stable catalog-case ID linking inventory, fixture, and verification evidence.
- Every data-bearing component/layout has local loading, empty, error, and populated cases.
- Inventory-relevant variants and interaction states are covered by deterministic fixtures.
- Catalog succeeds with network access disabled and without Tere environment variables.

#### Gate 4 — Visual, responsive, and accessibility quality

- Intended light-mode output is compared against current Tere reference evidence; intentional consolidation or defect fixes are documented.
- Required cases are verified at 320, 768, 1024, and 1440 pixels without clipped primary actions, unusable overflow, or shell breakage.
- Keyboard-only walkthrough passes for interactive cases; focus is visible and ordered.
- Semantic naming/labels, contrast, and reduced-motion checks pass.
- A parity matrix links each stable case ID to viewport and keyboard/focus/contrast/reduced-motion evidence. Charts, tables, modals, selects/date controls, calendars, trees, toasts, icons, loading animation, and `Stat3DScene` require both visual and interaction-equivalent evidence; a mapping label alone cannot pass them.
- The known Tere mobile-shell defect cannot be reproduced in the Beras shell.

#### Gate 5 — Isolation

- No source, config, dependency, or styling file under `apps/tere-project/**` changed during Phase 1.
- No catalog fixture imports Tere runtime code or makes Tere network/auth/store calls.
- Phase 1 tasks are reviewed, `STATUS: CLEAN`, and committed individually before Phase 2 starts.

### Feasibility challenge

This scope is technically feasible, but not a conventional thin MVP. Audit size—82 UI sources, 18,894 UI LOC, 2,045 CSS LOC, 954 style props, 822 `className` uses, 71 of 81 components marked client-side, mixed UI libraries, and no broad existing catalog/test harness—makes Phase 1 a large delivery phase with material schedule and regression risk.

The requirement remains coherent because source coverage may consolidate many legacy patterns into fewer canonical exports, and live behavior may use fixtures instead of duplicated business systems. Delivery must use an inventory-first contract, shared tokens, reusable native interaction patterns, and parallel task execution with agreed interfaces.

No component category may be silently moved to Phase 2 to make the date fit. If capacity or deadline cannot support the gate, the correct action is explicit product scope renegotiation; until then, Phase 1 remains blocked from completion rather than redefined as a partial kit.

---

## Phase 2 — Tere adoption and migration

### User outcome

As a Tere user, I receive the same intended product behavior and light visual baseline through Beras components, including the corrected responsive shell, while real Tere data, permissions, and workflows continue to work.

### Exact scope

- Add the private Beras workspace dependency to Tere and consume only its public entrypoints.
- Migrate active Tere visual surfaces represented by the Phase 1 ledger, route/feature by route/feature.
- Keep API, authentication, authorization, stores, repositories, queries, mutations, and domain logic in Tere; add thin adapters only where needed to translate Tere data/events into Beras props/events.
- Replace local visual implementations with canonical Beras components instead of forking them.
- Apply the Beras responsive shell so the current Tere mobile-shell defect is fixed during migration.
- Validate real loading, empty, error, populated, permission, retry, and mutation flows against production-shaped Tere behavior.
- Keep migration increments reversible. Old and new UI may coexist during the phase, but Phase 2 is not complete while an active mapped visual still bypasses Beras without an approved boundary rationale.

### Explicitly out of Phase 2

- New Tere business features or changed API contracts unrelated to UI adaptation.
- Reimplementing Beras components locally to avoid package changes.
- Public package publication, public docs, or additional themes.
- Deleting all dormant legacy files before migrated behavior is validated; that cleanup belongs to Phase 3.

### Why this is not MVP

The package/catalog delivers the Phase 1 value independently. Tere adoption is downstream integration and is explicitly prohibited from modifying Tere during Phase 1.

### Phase 2 acceptance gates

- Every active visual artifact in the mapping ledger is served through a Beras public export or has an approved non-visual/business-bound rationale.
- Tere has no active duplicate/fork of a migrated canonical Beras visual.
- Real auth, RBAC, API, store, query, mutation, retry, and error behavior remains correct.
- Tere build, lint, type-check, relevant tests, and route-level smoke checks pass.
- Migrated routes pass visual, keyboard, reduced-motion, and 320/768/1024/1440 checks.
- The Tere mobile shell passes at 320 pixels and the former defect has a regression check.
- Any old UI/visual dependency is removed only after proving zero remaining imports; any remaining active legacy UI usage blocks complete migration and is recorded.
- All Phase 2 tasks are reviewed, `STATUS: CLEAN`, and committed individually before Phase 3 starts.

---

## Phase 3 — legacy removal and governance

### User outcome

As a maintainer, I have one durable source of truth for Tere visuals, with obsolete local code removed and lightweight checks preventing design-system drift.

### Exact scope

- Delete Tere UI modules, duplicated tokens/styles, and dead CSS made unreachable by Phase 2.
- Remove obsolete UI/visual dependencies only after source and build evidence shows no remaining use.
- Keep the source-to-canonical ledger current and mark final migration/removal status.
- Add lightweight CI/static checks for Beras package boundaries, banned Beras UI/visual dependencies, public-entrypoint imports, and inventory drift.
- Add private maintainer guidance for authoring variants, changing tokens, adding catalog cases, and migrating future Tere visuals.
- Establish an internal package change/versioning process appropriate to an npm workspace; do not publish publicly.

### Why this is later

Legacy deletion and governance reduce maintenance cost but do not create the core Phase 1 catalog/package value or the Phase 2 user-facing adoption value. Deferring deletion also keeps Phase 2 rollback safer.

### Phase 3 acceptance gates

- No obsolete Tere visual module or duplicate stylesheet identified by the migration ledger remains reachable.
- Unused UI/visual dependencies are absent from manifests and lockfile; builds still pass.
- CI/static guards fail on banned Beras UI/visual dependencies, private source-path imports, or an unmapped new Tere visual source.
- Ledger, internal maintainer guidance, and package-change procedure match the final codebase.
- All Phase 3 tasks are reviewed, `STATUS: CLEAN`, and committed individually.

## Persistent non-goals

These are not silently assigned to a future phase:

- public npm release;
- public documentation site;
- void/crimson implementation;
- dark theme;
- generalized design-system features not evidenced by Tere;
- migration of unrelated business architecture.

Any of these requires a new explicit product decision and new rollout slicing.

## Execution rule

Development **MUST start with Phase 1 (MVP)**. Phase 2 may start only after every Phase 1 task is executed, reviewed `STATUS: CLEAN`, and committed. Phase 3 follows the same barrier after Phase 2. Internal workstreams may run in parallel, but they do not weaken a phase's acceptance gates or allow unfinished scope to spill into the next phase.
