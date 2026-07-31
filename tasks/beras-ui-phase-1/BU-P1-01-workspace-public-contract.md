# BU-P1-01 — Workspace, package, and public contract

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 1, slot 1/3
**TRD coverage:** FE-01; R-01–R-03, R-15; Gate 2 and Gate 5 foundations
**Estimated scope:** M; configuration/public-contract slice

## Description

Register `apps/beras-ui` as a private runnable Next workspace and freeze the package/public TypeScript boundary used by every parallel executor. Do not implement component visuals or catalog routes here.

## Owned files

- `/package.json`
- `/package-lock.json`
- `/apps/beras-ui/package.json`
- `/apps/beras-ui/{next.config.ts,tsconfig.json,eslint.config.mjs,postcss.config.mjs,tailwind.config.ts}`
- `/apps/beras-ui/src/public/{index.ts,components.ts,layouts.ts,foundations.ts,types.ts}`
- Temporary compile scaffolds at each downstream family `/apps/beras-ui/src/components/*/index.ts`
  and `/apps/beras-ui/src/layouts/*/index.ts`; ownership transfers to the named family task when
  its wave starts, and that task must replace (not retain) the throwing scaffold.
- `/.claude/steering/{feature-index.md,structure.md,tech.md}`

No other task edits these paths. Steering must add Beras to Quick Navigation/feature paths, document the new `apps/beras-ui` layout, Node minimum, exact dependency basis, scripts, and test/verification tooling. It must not claim unfinished evidence or Phase 2 adoption.

## Contract

Package: `@krasnaya/beras-ui@0.1.0`, `private: true`, Node `>=20.9.0`. Exact exports:

```json
{
  ".": "./src/public/index.ts",
  "./components": "./src/public/components.ts",
  "./layouts": "./src/public/layouts.ts",
  "./foundations": "./src/public/foundations.ts",
  "./types": "./src/public/types.ts",
  "./styles.css": "./src/styles/index.css"
}
```

Runtime direct dependencies are exactly `next@16.0.8`, `react@19.2.1`, `react-dom@19.2.1`. Exact dev direct dependencies: `@types/node@^20`, `@types/react@19.2.7`, `@types/react-dom@19.2.3`, `autoprefixer@^10.4.18`, `eslint@^9`, `eslint-config-next@16.0.8`, `postcss@^8.4.35`, `tailwindcss@3.4.1`, `typescript@5.8.2`.

Package scripts are exactly the TRD section 10 scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, five `verify:*` scripts, and aggregate `verify`. Root adds only `beras:dev`, `beras:build`, `beras:verify`; existing root scripts remain unchanged. Root `engines.node` becomes `>=20.9.0`.

Shared signatures are exact:

```ts
export interface BerasCommonProps {
  id?: string;
  className?: string;
}
export type InteractionSource = 'keyboard' | 'pointer' | 'programmatic';
export interface ChangeMeta {
  source: InteractionSource;
}
export type AsyncViewState<T> =
  | { status: 'loading'; label?: string }
  | { status: 'empty'; title: string; description?: string }
  | { status: 'error'; title: string; description?: string }
  | { status: 'ready'; data: T };
export interface BerasOption<Value extends string = string> {
  value: Value;
  label: string;
  description?: string;
  disabled?: boolean;
}
export interface ActionSpec {
  id: string;
  label: string;
  disabled?: boolean;
  pending?: boolean;
}
```

Callbacks: `onValueChange(nextValue, meta)`, `onAction(actionId, meta)`, `onOpenChange(open, meta)`, `onRetry()`. Also export exact named contracts `DataColumn`, `ChartSeries`, `CalendarDay`, `IssueTreeNode`, typed ADF nodes, and every public prop/view-model. Their minimal concrete fields are frozen in this file/commit; no runtime/business objects allowed.

Inventory rows 46 and 50 share this frozen presentational option contract:

```ts
export interface SprintOption extends BerasOption<string> {
  group: string;
  startDate?: string;
  endDate?: string;
}
```

`MultiSelect` and `Combobox` preserve generic value inference when consuming this option; no sprint grouping/date/business logic enters Beras.

Public component/layout/foundation names are exactly C-01 in [`../plan.md`](../plan.md); no rename, wildcard, default export, private source export, or extra speculative public export. Parallel component modules may be temporarily absent/stubbed, but the final barrel names must already be frozen. Public barrels themselves are final direct, explicit re-exports and must never contain throwing placeholders. For Wave 1 compileability, temporary typed throwing implementations live only in the downstream family `index.ts` files and include their replacement task ID. Every family executor replaces its scaffold; no `contractPlaceholder` or replacement marker may survive BU-P1-16.

## Acceptance criteria

- [ ] `apps/beras-ui/package.json` matches the exact identity, dependency allowlists, scripts, `sideEffects: ["./src/styles/index.css"]`, engines, and export map.
- [ ] Next config has `transpilePackages: ['@krasnaya/beras-ui']`; Tailwind scans only `./src/**/*.{ts,tsx,mdx}` with `relative: true`; ESLint uses Next 16 and explicit `eslint .`.
- [ ] Root retains `apps/*` workspace and existing Tere/MCP scripts; only three Beras convenience scripts and Node minimum are added.
- [ ] `feature-index.md`, `structure.md`, and `tech.md` describe the new app/package paths and frozen Phase 1 tooling without rewriting Tere ownership.
- [ ] Public barrels expose only the frozen names. `BerasCommonProps.className` is outer-only by documentation/type contract; no public `style`, `styles`, `classNames`, or `slotProps` contract.
- [ ] No direct dependency outside the allowlists. No Tere edits: no file under `apps/tere-project/**` changes.

## Verification

Run from repository root after the wave's contract-compatible modules exist:

```bash
npm ci
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
npm run build --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Last command: empty output. If a parallel module is not landed yet, reviewer checks manifest/export resolution against a contract stub; no stub may survive BU-P1-16.

## Definition of Done

Acceptance met; config/type contract reviewed; no unrelated edits; verifier/build pass in assembled wave; reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-01 workspace contract (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
