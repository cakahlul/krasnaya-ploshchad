# BU-P1-12 — Hierarchy tree and safe ADF content

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 5, slot 2/3
**TRD coverage:** FE-12 and FE-13; R-08–R-10, R-14
**Estimated scope:** M; tree/content slice

## Description

Implement the native ARIA hierarchy tree/control/detail surface and safe typed ADF renderer. Both share epic-explorer content ownership and exclude Jira queries, tree construction, filtering, and unsafe raw HTML.

**Wave 1 compile contract:** BU-P1-01 seeds a throwing `src/components/tree-content/index.ts` scaffold. This task owns that path now and must replace the scaffold completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/tree-content/**`
- `/apps/beras-ui/src/catalog/cases/tree-content.tsx`
- `/apps/beras-ui/src/fixtures/tree-content.ts`
- `/apps/beras-ui/tests/tree-adf.test.mjs`

BU-P1-07 owns `TicketDetailDialog`; BU-P1-03 owns CSS.

## Contract

Exact exports: `IssueTree`, `TreeControls`, `AdfContent`. Public `IssueTreeNode` and typed ADF node names/shapes come from BU-P1-01/C-02.

Tree roles: `tree`, `treeitem`, `group`, `aria-level`, `aria-expanded`, `aria-selected`, exactly one roving `tabIndex=0`. Right expands/enters, Left collapses/parents, Up/Down moves visible items, Home/End jumps, Enter/Space activates/selects. `Load more` is a named normal button and only emits an action.

ADF supports document, paragraph, heading, text marks, bullet/ordered list, list item, blockquote, code block, rule, table, link, panel. Unknown node renders safe children or labelled unsupported block. Links allow only `https:`, `http:`, `mailto:`; external gets `rel="noopener noreferrer"`. `dangerouslySetInnerHTML` is forbidden.

Required cases:

- `data-display/issue-tree/empty|loading|error|collapsed|expanded|selected|deep|load-more|detail-open`;
- `form/tree-controls/default|populated|disabled|narrow` (runtime component supplied here; BU-P1-06 owns the forms registry entry);
- `content/adf/empty|plain|rich|table|safe-links|unsafe-link|unknown-node|overflow`.

Export `treeContentCases: readonly CatalogRuntimeCase[]`. Data/fixtures are fixed, pre-shaped trees/ADF.

## Acceptance criteria

- [ ] All exact exports have public live cases and controlled presentational events; no Jira/store/query/filter/tree-building behavior.
- [ ] Complete roving tree keyboard contract works for empty/deep/collapsed/expanded/selected/load-more/detail states; only one visible item is tabbable.
- [ ] Large visible set/load-more and deep labels remain usable at 320 with named owned overflow.
- [ ] ADF covers every supported/unknown/empty/overflow case, filters unsafe schemes, preserves safe child content, and never renders raw HTML.
- [ ] Heading/list/table/link semantics and long code/table overflow are accessible.
- [ ] No Tere/network/env and no Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/tree-adf.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser keyboard tree walk and safe/unsafe ADF links at 320/1440; last command empty.

## Definition of Done

Tree reducer/navigation and ADF safety checks pass for every required case; reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-12 add tree and ADF (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
