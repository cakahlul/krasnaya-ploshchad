# BU-P1-08 — Navigation and corrected responsive shell

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 4, slot 1/3
**TRD coverage:** FE-08; R-08, R-10–R-11, R-13–R-14; known mobile-shell defect
**Estimated scope:** M

## Description

Implement controlled navigation primitives and `AppShell` using native responsive grid/drawer behavior. Remove the fixed 252px geometry defect in Beras without changing Tere.

**Wave 1 compile contract:** BU-P1-01 seeds throwing `src/components/navigation/index.ts` and `src/layouts/shell/index.ts` scaffolds. This task owns those paths now and must replace both completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/navigation/**`
- `/apps/beras-ui/src/layouts/shell/**`
- `/apps/beras-ui/src/catalog/cases/navigation.tsx`
- `/apps/beras-ui/src/fixtures/navigation.ts`
- `/apps/beras-ui/tests/navigation-shell.test.mjs`

BU-P1-07 owns `Drawer`; BU-P1-03 owns CSS.

## Contract

Exact component exports: `Tabs`, `Pagination`, `Breadcrumbs`, `NavList`, `AppHeader`, `AppSidebar`, `PageHeader`. Exact layout export: `AppShell`.

Controlled inputs: active item/page/tab, nav groups, mobile drawer open state, long labels, account/action descriptors. Events use `onValueChange`, `onAction`, `onOpenChange` with `ChangeMeta`; no router/path/auth/RBAC/sign-out/query.

Responsive contract is literal C-04: `>=1024` grid columns `var(--beras-sidebar-width) minmax(0, 1fr)`; `<1024` one content column, controlled modal drawer, main/topbar `inset-inline-start: 0`, `min-width: 0`; 320 drawer `min(18rem, 88vw)`, overlays instead of reserving desktop width.

Required cases:

- `layout/app-shell/desktop|mobile-closed|mobile-open|long-navigation`;
- `navigation/app-sidebar/desktop|mobile|active|long-labels`;
- `navigation/app-header/desktop|mobile|account-open|long-title`;
- `navigation/configuration-tabs/default|selection|focus|overflow`;
- `navigation/tabs/default|selection`;
- one direct live default/edge case for `Pagination`, `Breadcrumbs`, `NavList`, `PageHeader`.

Tabs/segmented keyboard behavior follows ARIA contract; mobile drawer follows BU-P1-07 modal behavior. Export `navigationCases: readonly CatalogRuntimeCase[]`.

## Acceptance criteria

- [ ] Every exact export has a controlled, public-import live case; no routing/auth/RBAC/business computation.
- [ ] Desktop and mobile shell contracts match exact CSS geometry; content/topbar never use fixed left offset.
- [ ] At 320, closed shell begins at viewport inline-start 0, content width <= viewport; open drawer overlays <=88vw; primary actions remain visible/wrap.
- [ ] Nav active/long/nested items, account menu, tabs, pagination, breadcrumbs and focus/keyboard states are deterministic and named.
- [ ] Landmarks, skip path, logical focus order, visible focus, and modal background exclusion pass.
- [ ] No page-level horizontal overflow; dense inner overflow remains owned by its component.
- [ ] No Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/navigation-shell.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run dev --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser exact regression routes: `/catalog/layout/app-shell?case=layout/app-shell/mobile-closed` and `.../mobile-open` at 320x800; assert document `scrollWidth <= clientWidth`; last command empty.

## Definition of Done

Shell regression and keyboard/nav cases pass at 320/768/1024/1440, reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-08 fix responsive shell (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
