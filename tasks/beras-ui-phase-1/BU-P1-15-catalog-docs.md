# BU-P1-15 — Catalog shell, case registry, search, and docs

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 6, slot 2/3
**TRD coverage:** FE-16; R-03, R-10–R-12, R-16; Gates 2–3
**Estimated scope:** M

## Description

Build the runnable internal catalog/docs app that aggregates frozen family case modules, self-consumes only public Beras entrypoints/styles, and makes every export/source mapping discoverable offline.

## Owned files

- `/apps/beras-ui/src/app/**`
- `/apps/beras-ui/src/catalog/registry.tsx`
- `/apps/beras-ui/src/catalog/{navigation.ts,search.ts}`
- `/apps/beras-ui/src/catalog/components/**`
- `/apps/beras-ui/src/inventory/case-manifest.json`
- `/apps/beras-ui/tests/catalog.test.mjs`

Family tasks exclusively own `/src/catalog/cases/*.tsx`; BU-P1-02 owns the inventory/ledger JSON; BU-P1-03 owns shipped CSS.

## Contract

Exact routes:

- `/` server redirects to `/catalog`;
- `/catalog` grouped export/case index, coverage summary, local search;
- `/catalog/[category]/[slug]` live cases, props/events, import/composition/tokens/states/responsive/a11y/source mappings;
- `/inventory` read-only ledger filters and case/evidence links;
- `/docs/getting-started`, `/docs/customization`, `/docs/accessibility`, `/docs/boundaries`.

Exact case schema:

```ts
export type CatalogCoverageTag =
  | 'default'
  | 'loading'
  | 'empty'
  | 'error'
  | 'populated'
  | 'disabled'
  | 'validation'
  | 'focus'
  | 'overflow'
  | 'selection'
  | 'expanded'
  | 'pending'
  | 'success'
  | 'failure'
  | 'reduced-motion';

export interface CatalogCaseManifestEntry {
  id: `${string}/${string}/${string}`;
  category: string;
  slug: string;
  title: string;
  exportNames: string[];
  fixtureId: `fixture:${string}`;
  sourcePaths: string[];
  variant: string;
  coverage: CatalogCoverageTag[];
  widths: Array<320 | 768 | 1024 | 1440>;
  docsHref: string;
  interactive: boolean;
}
```

IDs match `^[a-z0-9-]+/[a-z0-9-]+/[a-z0-9-]+$`; variant is exact third segment. Registry aggregates the family `readonly CatalogRuntimeCase[]` signature in C-03 and has exactly one renderer per manifest ID.

Catalog imports components/layouts/foundations/types only from `@krasnaya/beras-ui` subpaths and imports `@krasnaya/beras-ui/styles.css` once. Allowed relatives: catalog-local helper, fixture, JSON. Forbidden: `../components`, `../layouts`, `/internal/`, Tere path.

Search is local/case-insensitive over title, export, category, case ID, source basename; persists `?q=`. Navigation and search derive from `case-manifest.json`, never a second hand-maintained list. Fonts use exact BU-P1-03 family/weights, build-time only.

## Acceptance criteria

- [ ] All exact routes direct-load/refresh without 404/client crash and work with network blocked/no Tere env.
- [ ] Every exact public component/layout export has >=1 discoverable live case; every manifest ID resolves exactly one renderer, fixture, docs route, source mapping, and evidence reference.
- [ ] All mapped inventory case IDs/states from tasks BU-P1-03…14 appear; data-bearing families include loading/empty/error/populated.
- [ ] Catalog/public CSS self-import rules hold; no private source import or duplicated navigation list.
- [ ] Search matches all five fields, is case-insensitive, and round-trips `?q=` without network.
- [ ] Docs state purpose/import/props/events/variants/states/composition/customization/responsive/a11y/boundaries, including outer-only className and Tere exclusions.
- [ ] Global skip/nav/search/case focus order and headings/landmarks are logical; no Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/catalog.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run build --workspace=@krasnaya/beras-ui
npm run dev --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser direct-load every route family and search with network blocked; last command empty.

## Definition of Done

Every export/case/source is discoverable and documented through public self-imports, offline route/search checks pass, reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-15 add catalog docs (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
