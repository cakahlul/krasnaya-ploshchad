# BU-P1-06 — Forms, selection, and native date entry

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 2, slot 2/3
**TRD coverage:** FE-05; R-08, R-10–R-11, R-14
**Estimated scope:** M

## Description

Implement controlled native fields plus complete searchable single/multiselect and date/month/range entry behavior. Use native `<select>`, `<input type="date">`, and `<input type="month">` where simple; no day library.

**Wave 1 compile contract:** BU-P1-01 seeds a throwing `src/components/forms/index.ts` scaffold. This task owns that path now and must replace the scaffold completely; no `stub`, `contractPlaceholder`, or replacement marker may remain.

## Owned files

- `/apps/beras-ui/src/components/forms/**`
- `/apps/beras-ui/src/catalog/cases/forms.tsx`
- `/apps/beras-ui/src/fixtures/forms.ts`
- `/apps/beras-ui/tests/forms.test.mjs`

BU-P1-11 owns visual calendar grids; BU-P1-03 owns CSS.

## Contract

Exact exports: `TextField`, `TextAreaField`, `SwitchField`, `CheckboxField`, `SelectField`, `Combobox`, `SearchCombobox`, `MultiSelect`, `DateField`, `MonthField`, `DateRangeField`, `FieldGroup`, `FilterBar`, `SegmentedControl`.

Use `BerasOption`, `ChangeMeta`, `AsyncViewState`, `onValueChange(nextValue, meta)`, `onOpenChange(open, meta)`, and `onAction(actionId, meta)`. Values are controlled strings/arrays; dates are ISO `YYYY-MM-DD`, months `YYYY-MM`; all display formatting uses `Intl`.

Searchable/multi contract: labelled trigger, `aria-expanded`, `aria-controls`, active descendant, Arrow/Home/End, Enter/Space, Escape, search/type, clear/cancel, disabled option, long accessible label. Multi selections remain explicit/removable and apply staged draft only on Apply where case says `draft`.

Required mapped cases, with every listed variant expanded as a three-segment ID:

- `form/combobox/[empty,populated,search,selection,clear,disabled,long-options]`;
- `form/sprint-combobox/[empty,populated,search,selection,disabled,long-options]`;
- `form/sprint-multiselect/[empty,populated,search,partial,all,draft,disabled,long-options]`;
- `form/team-multiselect/[empty,populated,search,partial,all,draft,disabled,long-options]`;
- `form/epic-multiselect/[loading,empty,error,populated,search,partial,draft,long-options]`;
- `form/team-select/[empty,populated,selection,disabled,long-options]`;
- `form/project-combobox/[loading,empty,error,populated,search,selection]`;
- `form/epic-search/[idle,loading,empty,error,populated,long-options]`;
- `form/global-search/[idle,loading,empty,error,populated,detail-open,long-content]`;
- `form/date-range-field/[empty,populated,preset,custom,validation,disabled,narrow]`;
- `form/month-field/[empty,populated,disabled,validation]`;
- `form/report-filter-bar/[default,partial,complete,disabled,narrow,overflow]`;
- `form/tree-controls/[default,populated,disabled,narrow]`;
- `form/json-import/[empty,validation,ready,pending,success,failure]`;
- `form/segmented-control/[default,selection,disabled]`;
- one live default/error/disabled case as applicable for remaining field exports.

Exports `formCases: readonly CatalogRuntimeCase[]`; roots follow C-04.

## Acceptance criteria

- [ ] Every export is controlled, labelled, typed, has helper/error/required/readOnly/disabled and long-content behavior as applicable, and has a live public-import case.
- [ ] Complete keyboard/open/select/clear/cancel behavior works; Escape returns focus; disabled options never select; no positive `tabindex`.
- [ ] Staged multi-select cases do not commit until Apply and emit only values + `ChangeMeta`.
- [ ] ISO boundary/reversed-range validation, presets, clear/cancel, and native keyboard entry are deterministic; no `dayjs` or current clock.
- [ ] Loading/empty/error/populated cases use `AsyncViewState` where data-bearing.
- [ ] No business validation/query/store/Tere/network code; no Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/forms.test.mjs
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Browser keyboard walkthrough for combobox, multiselect, date range, and segmented control at 320/1440; last command empty.

## Definition of Done

Keyboard/date logic checks and mapped cases pass; no prohibited dependency/runtime coupling; reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-06 add form controls (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
