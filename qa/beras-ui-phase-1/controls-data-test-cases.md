# BU-QA-P1-02 — Controls and data browser test cases

Planning artifact only. No browser case has been executed and no pass result is claimed here.

## Scope and contract status

These cases trace QA-F01 through QA-F08 to the Phase 1 PRD/TRDs, `tasks/plan.md`
contracts C-02 through C-04, and tasks BU-P1-04 through BU-P1-09. The root repository does not
currently contain `.Codex/knowledge/review-lessons.md`; no local reviewer-lesson file was
available to apply.

- Primitive and form IDs are present in their current family manifests.
- Feedback and overlay IDs are frozen by BU-P1-05/07 and may land beside this plan.
- Every navigation/shell and data-display ID below is **contract-bound for future Wave 4**
  BU-P1-08/09. Do not substitute an implemented ID later; an absent/renamed ID is a failure
  against that owning task.
- The live URL arrives in BU-P1-15. Until then, an unavailable route is an unmet execution
  precondition, never a pass and never fabricated evidence.
- Authorization is outside this presentational package. Permission/not-registered rendering is
  tested as controlled data in QA-F06; no auth/RBAC behavior is inferred.

## Common browser execution contract

### Environment and URL

1. Start the assembled catalog with
   `npm run dev --workspace=@krasnaya/beras-ui`.
2. Use Chrome at 100% zoom, light mode, no Tere environment/credential, and a clean profile.
3. Record browser/OS, tested commit, case ID, URL, viewport, and input mode before each run.
4. Build each URL as
   `/catalog/<first-id-segment>/<second-id-segment>?case=<full-case-id>`.
5. Use heights `800` at widths 320/768, `900` at 1024/1440, and exactly `320x568` for
   small-height overlays.
6. Direct-load the URL and reload once. The requested case must remain selected and render
   without a console error, hydration warning, failed resource, or unexpected remote request.

### Callback observer

Reload before each procedure so callback ordinal starts at zero. In Chrome Sources, use the
development source map to set a breakpoint on the family case's `onValueChange`, `onAction`,
`onOpenChange`, or `onRetry` callback body. Count breakpoint hits and copy arguments from the
paused Scope panel; corroborate them with the case's visible event output. Do not infer a
callback merely from a visual state change. Record each call as:

```text
<ordinal> <callback>(<complete payload>)
```

The only legal callback shapes are:

```text
onValueChange(nextValue, { source: 'keyboard' | 'pointer' | 'programmatic' })
onAction(actionId, { source: 'keyboard' | 'pointer' | 'programmatic' })
onOpenChange(open, {
  source: 'keyboard' | 'pointer' | 'programmatic',
  reason: 'action' | 'backdrop' | 'escape' | 'outside' | 'programmatic'
})
onRetry()
```

If source mapping and the live case cannot expose callback name, full payload, order, and count,
stop that procedure and report the owning BU-P1 task. Screenshots and DOM changes do not replace
callback evidence.
When a procedure uses a fixture-bound symbol, bind it once in the precondition and record its
literal value:

- `O1`, `O2`: first and second enabled option values in DOM order;
- `D0`: controlled selection before opening;

An expectation such as `[D0, O2]` means that exact literal array in that exact order, not a
set-like comparison.

### Objective DOM, focus, and overflow checks

- Record active element by role/name after every focus-changing key.
- Record relevant `disabled`, `aria-busy`, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`, `aria-selected`, `aria-invalid`, `aria-describedby`, `aria-sort`,
  `role`, and live-region attributes.
- Modal traversal must list the first control, every intervening control, last control, wrap
  target, and returned invoker. No background element may enter the modal Tab cycle.
- Unless a procedure names an owned inner scroller:

  ```js
  document.documentElement.scrollWidth <=
    document.documentElement.clientWidth
  ```

  must be `true`. A named inner scroller must have an accessible name, be keyboard focusable,
  satisfy `scrollWidth > clientWidth`, and reach its final content/action at maximum
  `scrollLeft`.
- Pointer “active” means hold primary button before release; callback count stays zero until the
  completed click. Hover/focus alone never emits.
- Use artifact names
  `qa/beras-ui-phase-1/artifacts/<test-id>__<case-id-with-slashes-as-__>__<viewport-or-mode>.png|json|md`.
  Paths below remain placeholders until real execution.

## Coverage crosswalk

| Family | Required state/behavior | Procedures |
|---|---|---|
| QA-F01 | default, hover, active, success, failure | F01-01 |
| QA-F01 | disabled, pending, reduced motion | F01-02 |
| QA-F01 | focus and keyboard activation | F01-03 |
| QA-F01 | fixed pending suppresses repeat; ready emits once per activation | F01-04 |
| QA-F01 | narrow action containment | F01-05 |
| QA-F02 | required, optional, helper, labels, submit/cancel | F02-01, F02-03 |
| QA-F02 | error, read-only, disabled | F02-02 |
| QA-F02 | repeated pending form action | F02-04 |
| QA-F02 | long/narrow/overflow | F02-05 |
| QA-F03 | open, close, select, clear | F03-01 |
| QA-F03 | search, disabled option/control, long, empty | F03-02 |
| QA-F03 | Arrow, Home, End, Enter, Space, Escape, focus return | F03-03 |
| QA-F03 | staged Apply/Cancel and repeat | F03-04 |
| QA-F03 | narrow popup/selection overflow | F03-05 |
| QA-F04 | boundary date/month values | F04-01 |
| QA-F04 | reversed invalid and disabled | F04-02 |
| QA-F04 | presets, clear, cancel | F04-03 |
| QA-F04 | keyboard entry and repeated action | F04-04 |
| QA-F04 | narrow range containment | F04-05 |
| QA-F05 | initial/contained/returned focus | F05-01, F05-03 |
| QA-F05 | Escape, backdrop, outside policies | F05-02 |
| QA-F05 | repeated open/close | F05-04 |
| QA-F05 | 320x568 visible actions and owned scroll | F05-05 |
| QA-F06 | toast/alert role, live announce, close | F06-01, F06-03 |
| QA-F06 | loading/empty/error/maintenance/permission/not-registered | F06-02 |
| QA-F06 | retry and fixed-pending repeat | F06-03, F06-04 |
| QA-F06 | long/narrow/reduced motion | F06-05 |
| QA-F07 | active, nested, action, topbar | F07-01 |
| QA-F07 | mobile closed/open and no fixed narrow offset | F07-02 |
| QA-F07 | keyboard/focus | F07-03 |
| QA-F07 | repeated menu/action activation | F07-04 |
| QA-F07 | long labels and overflow at all widths | F07-05 |
| QA-F08 | loading/empty/error/populated | F08-01 |
| QA-F08 | both sorts, select, page | F08-02 |
| QA-F08 | keyboard/focus and row actions | F08-03 |
| QA-F08 | repeated controls | F08-04 |
| QA-F08 | dense/wide/optional/long named overflow | F08-05 |

## QA-F01 — Buttons and actions (`BU-P1-04`)

### QA-F01-01 — Pointer states and terminal action states

- **Cases/URLs:** `primitive/export-button/default`, `/catalog/primitive/export-button?case=primitive/export-button/default`;
  `primitive/export-button/success`; `primitive/export-button/failure`.
- **Viewport/mode:** 1440x900, pointer.
- **Precondition:** Callback observer empty; identify `actionId="export-report"`.
- **Steps:** On default, inspect rest state; hover; hold primary button; release once. Then
  direct-load success and failure cases and inspect visible/icon text.
- **Callback observation:** Hover/press before release: 0. Completed default click:
  exactly 1 `onAction('export-report', { source: 'pointer' })`. State-only success/failure
  loads: 0.
- **Expected result:** Native enabled `button`; hover/focus/active affordances are visible without
  changing accessible name; terminal cases expose literal success/failure text or icon+text,
  never color alone; no overflow.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f01-01__... ]`

### QA-F01-02 — Disabled, pending, and reduced-motion negative paths

- **Cases/URLs:** `primitive/export-button/disabled`, `/catalog/primitive/export-button?case=primitive/export-button/disabled`;
  `primitive/export-button/pending`; `primitive/export-button/reduced-motion`.
- **Viewport/mode:** 320x800, pointer + keyboard; reduced-motion emulation for final case.
- **Precondition:** Callback observer empty.
- **Steps:** Click and press Space/Enter on disabled; repeat on pending; inspect pending semantics;
  emulate `prefers-reduced-motion: reduce` and reload reduced-motion case.
- **Callback observation:** 0 calls for disabled and pending attempts.
- **Expected result:** Disabled/pending controls are natively disabled; pending has
  `aria-busy="true"` and visible pending meaning; no looping/spinning transform under reduced
  motion; control name/state remain perceivable; document does not overflow.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f01-02__... ]`

### QA-F01-03 — Keyboard focus and activation

- **Cases/URLs:** `primitive/oauth-button/focus`, `/catalog/primitive/oauth-button?case=primitive/oauth-button/focus`;
  `primitive/icon-button/default`.
- **Viewport/mode:** 768x800, keyboard only.
- **Precondition:** Focus begins immediately before case content; callback observer empty.
- **Steps:** Tab to OAuth button; press Space; reload, Tab and press Enter. On icon button,
  Tab to it and press Enter.
- **Callback observation:** Each isolated OAuth activation emits exactly 1
  `onAction('oauth-google', { source: 'keyboard' })`; icon activation emits exactly 1
  `onAction('open-search', { source: 'keyboard' })`; total per reload is 1.
- **Expected result:** Logical Tab order, visible unclipped ring, native button role; icon button
  has non-empty accessible name; focus remains on button after activation.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f01-03__... ]`

### QA-F01-04 — Fixed pending suppression and repeatable ready action

- **Cases/URLs:** `primitive/oauth-button/default`, `/catalog/primitive/oauth-button?case=primitive/oauth-button/default`;
  `primitive/oauth-button/pending`.
- **Viewport/mode:** 1440x900, pointer then keyboard.
- **Precondition:** Reload before each fixed case; observer empty.
- **Steps:** In default, complete one pointer click, wait for its callback, then focus the same
  button and press Enter. Reload the fixed pending case; attempt pointer click, programmatic
  `.click()`, Enter, and Space.
- **Callback observation:** Default emits exactly two calls, in order:
  `onAction('oauth-google', { source: 'pointer' })`, then
  `onAction('oauth-google', { source: 'keyboard' })`. The fixed pending case emits 0 for every
  attempt.
- **Expected result:** A non-pending action remains repeatable one-for-one. The fixed pending
  button is natively disabled, has `aria-busy="true"`, cannot receive keyboard focus, and
  suppresses every activation without requiring a nonexistent pending toggle.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f01-04__... ]`

### QA-F01-05 — Narrow action containment

- **Cases/URLs:** `primitive/export-button/default`, `/catalog/primitive/export-button?case=primitive/export-button/default`;
  `primitive/status-badge/long-label`.
- **Viewport/mode:** 320x800, keyboard + pointer.
- **Precondition:** Browser at 100% zoom; callback observer empty.
- **Steps:** Inspect page width; Tab to action; zoom text to 200%; repeat width/focus checks;
  activate once; inspect the adjacent long status case separately.
- **Callback observation:** Exactly 1
  `onAction('export-report', { source: 'keyboard' })`.
- **Expected result:** Action stays visible, named, and operable; text wraps or contains safely;
  focus ring is not clipped; long status meaning remains complete; document width assertion is
  true and no unnamed horizontal scroller appears.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f01-05__... ]`

## QA-F02 — Fields and forms (`BU-P1-06`, specialized cases `BU-P1-07`)

### QA-F02-01 — Labels, helper, explicit required/optional, and validation boundary

- **Cases/URLs:** `form/text-field/default`, `/catalog/form/text-field?case=form/text-field/default`;
  `form/text-field/error`, `/catalog/form/text-field?case=form/text-field/error`;
  `overlay/member-form/validation`;
  `overlay/leave-form/read-only`.
- **Viewport/mode:** 1440x900, keyboard.
- **Precondition:** Literal contract binding: `form/text-field/default` is optional;
  `form/text-field/error` is the explicit required-state case with an empty controlled value and
  `required={true}`. Observer empty. If the live error case lacks native
  `required`/`validity.valueMissing` semantics, record a failure owned by BU-P1-06; do not
  discover or substitute another case and never infer required state from error copy.
- **Steps:** In default, activate the label and inspect helper association plus optional state.
  Direct-load error, activate its label, and inspect the input's literal `required` attribute,
  `validity.valueMissing`, and referenced error. In member validation, inspect the controlled
  `validationMessage`, then Tab to Save and press Enter. In leave read-only, attempt both
  disabled action descriptors.
- **Callback observation:** Label/helper/required/error inspection emits 0. Member validation
  Save is enabled by its `ActionSpec`, so it emits exactly
  `onAction('save', { source: 'keyboard' })` and 0 value callbacks. The read-only fixture's
  `ActionSpec.disabled` Save/Cancel attempts emit 0.
- **Expected result:** Optional default has no required state. The literal error case exposes
  native `required` and `validity.valueMissing === true` from its explicit prop; its error and
  the member `validationMessage` remain presentational, not Beras business validation. Beras
  neither validates domain data nor suppresses an enabled action; only the controlled disabled
  descriptor suppresses it.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f02-01__... ]`

### QA-F02-02 — Error, read-only, and disabled controls

- **Cases/URLs:** `form/text-field/error`, `/catalog/form/text-field?case=form/text-field/error`;
  `form/text-field/disabled`; `overlay/leave-form/read-only`.
- **Viewport/mode:** 768x800, keyboard + pointer.
- **Precondition:** Record controlled values; observer empty.
- **Steps:** Inspect error association; attempt typing/paste in disabled and read-only controls;
  attempt their actions; Tab through each case.
- **Callback observation:** 0 value/action callbacks from disabled or read-only attempts.
- **Expected result:** Error control has `aria-invalid="true"` and references visible error text;
  disabled control is omitted from Tab order; read-only value is focusable/readable but
  immutable and exposed as read-only; labels remain associated.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f02-02__... ]`

### QA-F02-03 — Keyboard edit, prevented native submit, Save, and Cancel order

- **Cases/URLs:** `overlay/member-form/create`, `/catalog/overlay/member-form?case=overlay/member-form/create`;
  `form/field-group/default`.
- **Viewport/mode:** 1440x900, keyboard only.
- **Precondition:** Member create initial value is
  `{ name: '', email: 'nadya@example.test', lead: false, teams: ['Platform', 'Quality'] }`;
  field-group checkbox is initially `true`; observer empty.
- **Steps:** In the already-open member dialog, focus Name, select its complete empty value, and
  keyboard-paste `Beras QA` as one edit; press Enter while still in the text field; then Tab to
  Save and press Enter. Reload, Tab to Cancel, and press Enter. In field group, focus Active and
  press Space.
- **Callback observation:** Name edit emits exactly
  `onValueChange({ name: 'Beras QA', email: 'nadya@example.test', lead: false, teams:
  ['Platform', 'Quality'] }, { source: 'keyboard' })`. Enter inside the form emits 0 action
  callbacks because native submit is prevented. Save then emits exactly
  `onAction('save', { source: 'keyboard' })`; isolated Cancel emits exactly
  `onAction('cancel', { source: 'keyboard' })`; checkbox emits exactly
  `onValueChange(false, { source: 'keyboard' })`.
- **Expected result:** DOM and focus order match visual order; Enter in the single-line field does not
  accidentally submit on Enter; submit/cancel retain visible names and focus rings; no positive
  `tabindex`.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f02-03__... ]`

### QA-F02-04 — Repeated pending submit is suppressed

- **Cases/URLs:** `overlay/member-form/pending`, `/catalog/overlay/member-form?case=overlay/member-form/pending`;
  `form/json-import/pending`.
- **Viewport/mode:** 768x800, keyboard + pointer.
- **Precondition:** Member Save has pending action ID `save`; JSON Import has pending action ID
  `import`; observer empty.
- **Steps:** Rapid-click pending Save and press Enter/Space; reload JSON case and repeat against
  pending Import; attempt input only in the JSON case's disabled textarea.
- **Callback observation:** Both cases load with their action already pending; every action
  attempt emits exactly 0. Editing the member fields remains a separate controlled value
  interaction and is not counted as a pending action callback.
- **Expected result:** Both pending actions are disabled and `aria-busy="true"` with visible
  pending text; JSON textarea is disabled by that fixture. Member fields remain independently
  controlled rather than becoming implicitly read-only; no duplicate form/default navigation.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f02-04__... ]`

### QA-F02-05 — Long and narrow form containment

- **Cases/URLs:** `form/global-search/long-content`, `/catalog/form/global-search?case=form/global-search/long-content`;
  `form/report-filter-bar/narrow`; `form/report-filter-bar/overflow`;
  `overlay/member-form/narrow`.
- **Viewport/mode:** 320x800 and overlay 320x568, keyboard.
- **Precondition:** Observer empty. Global search starts open with no selected value; report
  ranges start `{ start: '2026-07-01', end: '2026-07-31' }`; narrow member value is
  `{ name: 'Nadya Pratama', email: 'nadya@example.test', lead: false, teams:
  ['Platform', 'Quality'] }`.
- **Steps:** (1) In global-search long-content, type 256 literal `x` characters and traverse its
  filtered empty state. (2) In report-filter-bar narrow, replace Start with `2026-07-02`, then
  activate Apply. (3) In report-filter-bar overflow, choose native Team option
  `long-platform`, then activate Apply. (4) In member-form narrow at 320x568, select the complete
  Name value and keyboard-paste `Nadya Pratama QA` as one edit, reach Cancel, and activate it.
  Measure each case separately.
- **Callback observation:** (1) Query filtering emits 0 `onValueChange` and 0 open callbacks
  because the search case starts open. (2) Exactly
  `onValueChange({ start: '2026-07-02', end: '2026-07-31' },
  { source: 'keyboard' })`, then `onAction('apply', { source: 'keyboard' })`. (3) Exactly
  `onValueChange('long-platform', { source: 'keyboard' })`, then
  `onAction('apply', { source: 'keyboard' })`. (4) Exactly
  `onValueChange({ name: 'Nadya Pratama QA', email: 'nadya@example.test', lead: false,
  teams: ['Platform', 'Quality'] }, { source: 'keyboard' })`, then
  `onAction('cancel', { source: 'keyboard' })`; the form action itself does not imply an
  `onOpenChange`.
- **Expected result:** Labels/errors/helper text wrap; inputs and actions remain visible;
  footer action is reachable at 320x568; page width assertion is true; only a labelled,
  focusable component-owned region may scroll horizontally.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f02-05__... ]`

## QA-F03 — Select and multiselect (`BU-P1-06`)

### QA-F03-01 — Closed start, open, select, close, and clear

- **Cases/URLs:** `form/combobox/clear`, `/catalog/form/combobox?case=form/combobox/clear`.
- **Viewport/mode:** 1440x900, pointer.
- **Precondition:** Case starts closed with selected value `platform`; enabled second option is
  `payments`; observer empty.
- **Steps:** Click combobox; click Payments; reopen; click named Clear control.
- **Callback observation:** Open exactly 1
  `onOpenChange(true, { source: 'pointer', reason: 'action' })`; selection exactly
  `onValueChange('payments', { source: 'pointer' })`, then exactly one
  `onOpenChange(false, { source: 'pointer', reason: 'action' })`; reopen emits one more
  true/pointer/action; Clear emits exactly
  `onValueChange('', { source: 'pointer' })`.
- **Expected result:** Trigger has `role="combobox"`, matching `aria-controls`, and
  `aria-expanded` true/false; selected option reports `aria-selected="true"`; focus remains on
  trigger after selection/clear.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f03-01__... ]`

### QA-F03-02 — Search, empty, disabled, and long option edges

- **Cases/URLs:** `form/combobox/search`, `/catalog/form/combobox?case=form/combobox/search`;
  `form/combobox/empty`; `form/combobox/disabled`; `form/combobox/long-options`.
- **Viewport/mode:** 768x800, keyboard + pointer.
- **Precondition:** Bind disabled option value and `O1`; observer empty.
- **Steps:** Type an exact substring from `O1`; clear query; type a no-match string; inspect
  empty fixture; attempt disabled control and disabled option; inspect complete long label.
- **Callback observation:** These search/empty/long fixtures load open; query-only input,
  filtering, and inspection emit 0 callbacks. Disabled control/option attempts also emit
  0 value/open callbacks.
- **Expected result:** Filtered list contains only matching accessible labels; no-match/empty
  message is a disabled option/state, not a selectable value; disabled option has
  `aria-disabled="true"`; long option accessible name is untruncated even if visual text wraps.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f03-02__... ]`

### QA-F03-03 — Complete selection keyboard contract

- **Cases/URLs:** `form/combobox/clear`, `/catalog/form/combobox?case=form/combobox/clear`;
  `form/sprint-multiselect/populated`.
- **Viewport/mode:** 1440x900, keyboard only.
- **Precondition:** Single selection starts closed with `platform`. Sprint populated starts open
  with `['sprint-42', 'sprint-43']`; observer empty.
- **Steps:** Focus closed combobox; press ArrowDown, Home, End, ArrowUp; verify active descendant
  each time; Enter selects. Reload multiselect; first press Escape to close/reset, then ArrowDown
  to reopen. Press Space to toggle `sprint-42`; ArrowDown and Enter to toggle `sprint-43`; type
  `QA plan` including its literal Space and verify the Space remains query text; press Escape.
- **Callback observation:** Single emits, in order: one
  `onOpenChange(true, { source: 'keyboard', reason: 'action' })`, one
  `onValueChange('payments', { source: 'keyboard' })`, then one false/keyboard/action close.
  Initial multiselect reset emits `onAction('cancel', { source: 'keyboard' })` then
  false/keyboard/escape; ArrowDown emits true/keyboard/action; toggles emit exactly
  `onValueChange(['sprint-43'], { source: 'keyboard' })`, then
  `onValueChange([], { source: 'keyboard' })`; query typing emits 0; final Escape emits one
  cancel action then one false/keyboard/escape.
- **Expected result:** `aria-activedescendant` always names an existing enabled option;
  Home/End reach first/last enabled option; disabled item is skipped; Escape returns focus to
  combobox; Space used as query text when search is non-empty does not select.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f03-03__... ]`

### QA-F03-04 — Staged Apply/Cancel and repeated actions

- **Cases/URLs:** `form/sprint-multiselect/draft`, `/catalog/form/sprint-multiselect?case=form/sprint-multiselect/draft`;
  `form/team-multiselect/draft`.
- **Viewport/mode:** 1440x900, keyboard then pointer.
- **Precondition:** Sprint starts open at `D0=['sprint-42']`, with `O2='sprint-43'`; Team starts
  open at `D0=['platform']`, with `O2='payments'`; observer empty.
- **Steps:** In Sprint, ArrowDown and Space-toggle sprint-43, then press Escape. Reopen with
  ArrowDown, move to sprint-43, toggle, and activate Cancel with Enter. Reopen/toggle again and
  activate Apply with Enter; after close attempt Enter once. Repeat one separate Apply cycle.
  In Team, repeat one draft/Apply cycle using pointer.
- **Callback observation:** Staged toggles emit 0 values. Sprint Escape emits exactly
  `onAction('cancel', { source: 'keyboard' })`, then false/keyboard/escape. Sprint Cancel emits
  exactly `cancel`/keyboard, then false/keyboard/action, with no value. Each Sprint Apply cycle
  emits, in order,
  `onValueChange(['sprint-42', 'sprint-43'], { source: 'keyboard' })`,
  `onAction('apply', { source: 'keyboard' })`, then false/keyboard/action; the closed Enter adds
  0. Team Apply emits the same triplet with payload `['platform', 'payments']` and pointer
  source.
- **Expected result:** Draft is discarded on Escape/Cancel and commits only on Apply; selected
  values are announced/removable; closed popup cannot accept a stale second action.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f03-04__... ]`

### QA-F03-05 — Narrow long-option overflow

- **Cases/URLs:** `form/sprint-multiselect/long-options`, `/catalog/form/sprint-multiselect?case=form/sprint-multiselect/long-options`;
  `form/team-select/long-options`.
- **Viewport/mode:** 320x800, keyboard.
- **Precondition:** Sprint case starts open with no selection; first enabled long option is
  `long-platform`; native Team select starts closed; observer empty.
- **Steps:** In sprint case, press Escape to close/reset; press ArrowDown to reopen; traverse
  first-to-last, press Space on `long-platform`, activate its named Remove control, and reach the
  final selection action. Reload native Team select and open it with Alt+ArrowDown; inspect
  widths before/after.
- **Callback observation:** Sprint reset emits exactly
  `onAction('cancel', { source: 'keyboard' })`, then
  `onOpenChange(false, { source: 'keyboard', reason: 'escape' })`; reopen emits exactly
  true/keyboard/action; select emits
  `onValueChange(['long-platform'], { source: 'keyboard' })`; remove emits
  `onValueChange([], { source: 'keyboard' })`. Native select opening/traversal alone emits 0.
- **Expected result:** Popup and long labels remain within viewport or a labelled owned region;
  full option name remains in accessibility tree; trigger/action focus rings are not clipped;
  page width assertion is true.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f03-05__... ]`

## QA-F04 — Date, month, and range (`BU-P1-06`)

### QA-F04-01 — ISO date and month boundaries

- **Cases/URLs:** `form/date-field/default`, `/catalog/form/date-field?case=form/date-field/default`;
  `form/month-field/populated`.
- **Viewport/mode:** 1440x900, keyboard.
- **Precondition:** Date bounds `2026-01-01`/`2026-12-31`; month bounds
  `2026-01`/`2026-12`; observer empty.
- **Steps:** Enter each minimum and maximum in isolated reloads; inspect native value and
  localized display output.
- **Callback observation:** Exactly 1 per accepted entry:
  `onValueChange('2026-01-01', { source: 'keyboard' })`,
  `onValueChange('2026-12-31', { source: 'keyboard' })`,
  `onValueChange('2026-01', { source: 'keyboard' })`, and
  `onValueChange('2026-12', { source: 'keyboard' })`.
- **Expected result:** Native date/month inputs retain exact ISO values; min/max are present;
  localized text uses deterministic `Intl`; no current clock/timezone-derived value appears.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f04-01__... ]`

### QA-F04-02 — Reversed range and disabled negative paths

- **Cases/URLs:** `form/date-range-field/validation`, `/catalog/form/date-range-field?case=form/date-range-field/validation`;
  `form/date-range-field/disabled`; `form/month-field/validation`.
- **Viewport/mode:** 768x800, keyboard + pointer.
- **Precondition:** Validation range is start `2026-07-31`, end `2026-07-01`; observer empty.
- **Steps:** Inspect reversed range; attempt Apply; attempt edits/clear/cancel on disabled case;
  in month validation replace the sanitized invalid fixture value with `2027-01`, beyond
  `max="2026-12"`.
- **Callback observation:** Reversed Apply and every disabled attempt: 0 action/value callbacks.
  The enabled native month input emits exactly
  `onValueChange('2027-01', { source: 'keyboard' })`; after the controlled value rerenders, no
  action callback occurs.
- **Expected result:** Range exposes `aria-invalid="true"` and visible referenced error; Apply
  is disabled; disabled fieldset/controls are not operable; native min/max validation remains
  visible/programmatic. The out-of-range month is retained as controlled presentational data
  while `input.validity.rangeOverflow === true` and `input.checkValidity() === false`; Beras
  does not silently suppress or normalize the consumer value.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f04-02__... ]`

### QA-F04-03 — Preset, clear, and cancel

- **Cases/URLs:** `form/date-range-field/preset`, `/catalog/form/date-range-field?case=form/date-range-field/preset`;
  `form/date-range-field/populated`.
- **Viewport/mode:** 1440x900, pointer then keyboard.
- **Precondition:** Observer empty; preset value is `this-month`.
- **Steps:** Click This month; reload populated and activate Clear; reload and activate Cancel
  with Enter.
- **Callback observation:** Preset exactly 1
  `onAction('this-month', { source: 'pointer' })`; Clear exactly 1
  `onValueChange({ start: '', end: '' }, { source: 'pointer' })`; Cancel exactly 1
  `onAction('cancel', { source: 'keyboard' })`.
- **Expected result:** Preset does not invent dates inside Beras; Clear emits only the empty
  presentational range; Cancel does not emit a value; focus remains on activated control.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f04-03__... ]`

### QA-F04-04 — Keyboard entry and repeated date action

- **Cases/URLs:** `form/date-range-field/custom`, `/catalog/form/date-range-field?case=form/date-range-field/custom`;
  `form/date-range-field/preset`.
- **Viewport/mode:** 1440x900, keyboard only.
- **Precondition:** Custom starts `{ start: '2026-07-08', end: '2026-07-19' }`; observer empty.
- **Steps:** Focus Start, select its complete value, type `2026-07-09`, then Tab. Focus End,
  select its complete value, type `2026-07-20`; activate
  Apply; reload preset, activate `this-month` twice as two separated Enter key presses.
- **Callback observation:** Accepted edits emit, in order,
  `onValueChange({ start: '2026-07-09', end: '2026-07-19' },
  { source: 'keyboard' })`, then
  `onValueChange({ start: '2026-07-09', end: '2026-07-20' },
  { source: 'keyboard' })`; Apply emits exactly one
  `onAction('apply', { source: 'keyboard' })`; two deliberate preset activations emit exactly
  two identical `this-month` callbacks, no extra native submit.
- **Expected result:** Focus order is start, end, Clear, Cancel, Apply (plus presets before
  fields when present); keyboard entry remains native; repeat count equals completed
  activations one-for-one.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f04-04__... ]`

### QA-F04-05 — Narrow date-range containment

- **Cases/URLs:** `form/date-range-field/narrow`, `/catalog/form/date-range-field?case=form/date-range-field/narrow`;
  `form/report-filter-bar/narrow`.
- **Viewport/mode:** 320x800, keyboard.
- **Precondition:** Narrow range starts
  `{ start: '2026-07-01', end: '2026-07-31' }`; observer empty.
- **Steps:** Traverse both date inputs and every action; select the complete Start value and
  keyboard-paste `2026-01-01` as one edit, then do the same for End with `2026-12-31`; activate
  final Apply; inspect viewport and any inner scroller.
- **Callback observation:** In order, exactly
  `onValueChange({ start: '2026-01-01', end: '2026-07-31' },
  { source: 'keyboard' })`,
  `onValueChange({ start: '2026-01-01', end: '2026-12-31' },
  { source: 'keyboard' })`, and
  `onAction('apply', { source: 'keyboard' })`.
- **Expected result:** Inputs/actions stack or wrap, remain fully reachable, and preserve labels;
  focus rings are not clipped; document width assertion is true; no unnamed inner scroll.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f04-05__... ]`

## QA-F05 — Dialog, drawer, and popover (`BU-P1-07`)

### QA-F05-01 — Dialog initial focus, containment, close, and return

- **Cases/URLs:** `overlay/dialog/default`, `/catalog/overlay/dialog?case=overlay/dialog/default`;
  `overlay/confirm-dialog/default`.
- **Viewport/mode:** 1440x900, keyboard only.
- **Precondition:** Both fixtures load open. Dialog first focusable control is Close; confirm
  first focusable control is Cancel. Each case also renders an external Open example invoker;
  observer empty.
- **Steps:** Direct-load dialog, record initial focus, Tab past last and Shift+Tab before first,
  then activate Close. Focus Open example and press Enter; record reopened initial focus,
  repeat containment, close, and record return. Direct-load confirm, repeat containment, and
  activate Cancel.
- **Callback observation:** Initial open render emits 0. Each dialog Close emits exactly
  `onOpenChange(false, { source: 'keyboard', reason: 'action' })`; Open example directly
  controls local `open` and emits 0 C-02 callbacks. Confirm Cancel emits, in order,
  `onAction('cancel', { source: 'keyboard' })`, then
  `onOpenChange(false, { source: 'keyboard', reason: 'action' })`.
- **Expected result:** Native modal dialog is labelled/described; initial focus is explicit ref
  or first enabled control; Tab wraps last-to-first and reverse; background is unreachable.
  After the explicit invoker reopens dialog, closing returns focus exactly to Open example.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f05-01__... ]`

### QA-F05-02 — Escape, backdrop, and outside close policies

- **Cases/URLs:** `overlay/dialog/default`, `/catalog/overlay/dialog?case=overlay/dialog/default`;
  `overlay/drawer/open`; `overlay/popover/open`.
- **Viewport/mode:** 1440x900, keyboard + pointer.
- **Precondition:** All fixtures load open. Dialog has `closeOnBackdrop=false`; Drawer has
  `closeOnBackdrop=true`; observer empty.
- **Steps:** (1) In dialog, click content, click backdrop, then press Escape. (2) In Drawer,
  focus Close and press Enter, focus Open example and press Enter, then pointer-click backdrop.
  (3) In open popover, click outside; press Enter on its focused trigger to reopen; press Escape.
- **Callback observation:** (1) Content/backdrop clicks emit 0; Escape emits exactly
  `onOpenChange(false, { source: 'keyboard', reason: 'escape' })`. (2) Initial Close emits one
  false/keyboard/action; Open example emits 0; allowed backdrop emits exactly
  `onOpenChange(false, { source: 'pointer', reason: 'backdrop' })`. (3) Outside emits exactly
  false/pointer/outside; trigger reopen emits true/keyboard/action; Escape emits
  false/keyboard/escape.
- **Expected result:** Forbidden and allowed backdrop policies match their literal props; an
  inside-content click never closes. Closed overlays leave the accessibility tree. Drawer
  backdrop close and popover outside/Escape return focus exactly to their invoker/trigger.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f05-02__... ]`

### QA-F05-03 — Modal drawer containment and return

- **Cases/URLs:** `overlay/drawer/closed`, `/catalog/overlay/drawer?case=overlay/drawer/closed`;
  `overlay/drawer/open`.
- **Viewport/mode:** 320x800, keyboard only.
- **Precondition:** Closed case exposes only Open example; focus that invoker; observer empty.
- **Steps:** Press Enter on Open example; enumerate initial focus and full Tab/Shift+Tab wrap;
  attempt to reach background; press Escape and record focus. Direct-load open case and record
  initial focus without operating it.
- **Callback observation:** Open example directly updates local state, so opening emits 0.
  Escape emits exactly
  `onOpenChange(false, { source: 'keyboard', reason: 'escape' })`. Direct-loading the fixed open
  case emits 0.
- **Expected result:** Drawer width is at most `0.88 * 320 = 281.6px`; it overlays instead of
  reserving desktop width; background is not keyboard reachable; focus returns to invoker;
  closed drawer is not exposed as active modal content.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f05-03__... ]`

### QA-F05-04 — Rapid and repeated overlay state changes

- **Cases/URLs:** `overlay/popover/closed`, `/catalog/overlay/popover?case=overlay/popover/closed`;
  `overlay/dialog/default`.
- **Viewport/mode:** 768x800, pointer then keyboard.
- **Precondition:** Observer empty.
- **Steps:** Double-click the closed popover trigger; after it settles closed, focus trigger,
  press Enter, then press Escape. Direct-load dialog (already open), press Escape twice; focus
  Open example, press Enter, and press Escape once.
- **Callback observation:** Popover double-click emits exactly true/pointer/action then
  false/pointer/action; Enter emits true/keyboard/action; Escape emits false/keyboard/escape.
  Dialog initial Escape emits false/keyboard/escape; second Escape while closed emits 0. Open
  example emits 0; final Escape emits one false/keyboard/escape.
- **Expected result:** At most one overlay instance exists; no stale backdrop, orphan focus
  sentinel, or focus in removed DOM; final focus is invoker.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f05-04__... ]`

### QA-F05-05 — Small-height overflow with persistent actions

- **Cases/URLs:** `overlay/dialog/overflow`, `/catalog/overlay/dialog?case=overlay/dialog/overflow`;
  `overlay/legal-dialog/overflow`; `overlay/member-form/narrow`.
- **Viewport/mode:** exactly 320x568, keyboard.
- **Precondition:** Overlay open; observer empty.
- **Steps:** Record footer rectangle before scrolling; focus body scroller; scroll to final
  content; in plain/legal dialog activate Close. In member narrow, activate Cancel, verify the
  dialog remains controlled open, then activate the built-in Close. Inspect document/inner
  metrics.
- **Callback observation:** Scrolling emits 0. Plain/legal Close emits exactly
  `onOpenChange(false, { source: 'keyboard', reason: 'action' })` per isolated case. Member
  Cancel emits exactly `onAction('cancel', { source: 'keyboard' })` and no open callback;
  subsequent built-in Close emits exactly false/keyboard/action.
- **Expected result:** Body, not page, owns vertical overflow; footer actions remain visible or
  reachable without horizontal scroll; named body scroller reaches last content; focus ring is
  not clipped; document width assertion is true.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f05-05__... ]`

## QA-F06 — Toast, alert, and state feedback (`BU-P1-05`)

### QA-F06-01 — Toast roles, one announcement, and close

- **Cases/URLs:** `feedback/toast/success`, `/catalog/feedback/toast?case=feedback/toast/success`;
  `feedback/toast/error`; `feedback/export-toast/success`; `feedback/export-toast/error`.
- **Viewport/mode:** 1440x900, screen-reader semantics + keyboard.
- **Precondition:** Accessibility tree/live-region recording starts before case insertion;
  observer empty.
- **Steps:** Load each case once; record announcement count/text; Tab to named close; activate.
- **Callback observation:** Case insertion: 0 C-02 action calls. Close exactly once per isolated
  case: success `onAction('dismiss:toast-success', { source: 'keyboard' })`, error
  `onAction('dismiss:toast-error', { source: 'keyboard' })`, export success
  `onAction('dismiss:export-toast-success', { source: 'keyboard' })`, and export error
  `onAction('dismiss:export-toast-error', { source: 'keyboard' })`.
- **Expected result:** Success/info uses `role="status"`; only urgent error uses `role="alert"`;
  title/description announces exactly once without moving focus; close has accessible name and
  removes only its toast.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f06-01__... ]`

### QA-F06-02 — Loading, empty, error, maintenance, and access states

- **Cases/URLs:** `feedback/state-view/loading`, `/catalog/feedback/state-view?case=feedback/state-view/loading`;
  `feedback/state-view/empty`; `feedback/state-view/error`;
  `feedback/maintenance-state/default`; `feedback/access-state/loading`;
  `feedback/access-state/denied`; `feedback/access-state/not-registered`.
- **Viewport/mode:** 768x800, accessibility tree.
- **Precondition:** Observer empty.
- **Steps:** Direct-load each case; record role/name/busy/description/action availability.
- **Callback observation:** 0 on render for every case.
- **Expected result:** Loading exposes `aria-busy`; empty/error/maintenance/denied/not-registered
  have distinct literal title/description and non-color icon/text meaning; denied and
  not-registered are controlled presentation only; no redirect/auth/network occurs.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f06-02__... ]`

### QA-F06-03 — Retry and action callbacks

- **Cases/URLs:** `feedback/state-view/retry`, `/catalog/feedback/state-view?case=feedback/state-view/retry`;
  `feedback/maintenance-state/default`; `feedback/access-state/denied`;
  `feedback/access-state/not-registered`.
- **Viewport/mode:** 1440x900, keyboard then pointer.
- **Precondition:** Observer empty.
- **Steps:** (1) In StateView retry, focus Retry and press Enter. (2) Direct-load Maintenance
  default, pointer-click its Retry exactly once. (3) Direct-load denied, focus Request access
  and press Enter. (4) Direct-load not-registered, focus Register account and press Enter.
- **Callback observation:** StateView emits exactly one zero-argument `onRetry()`.
  Maintenance default independently emits exactly one zero-argument `onRetry()` and no
  `onAction`. Access actions emit exactly
  `onAction('request-access', { source: 'keyboard' })` and
  `onAction('register-account', { source: 'keyboard' })`; no retry payload is invented.
- **Expected result:** Focus stays on action; visible state does not falsely claim data refresh;
  consumer side effects remain absent.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f06-03__... ]`

### QA-F06-04 — Fixed pending suppression and repeatable ready retry

- **Cases/URLs:** `feedback/maintenance-state/retry-pending`, `/catalog/feedback/maintenance-state?case=feedback/maintenance-state/retry-pending`;
  `feedback/state-view/retry`.
- **Viewport/mode:** 768x800, pointer + keyboard.
- **Precondition:** Reload before each fixed case; observer empty.
- **Steps:** In fixed pending Maintenance, attempt pointer click, `.click()`, Enter, and Space.
  Reload StateView retry; complete one pointer click, wait for its callback, then focus Retry and
  press Enter.
- **Callback observation:** Fixed pending Maintenance emits 0. Ready StateView emits exactly
  two zero-argument `onRetry()` calls, one per completed pointer/keyboard activation.
- **Expected result:** Pending Retry is natively disabled and busy, announces state once, and
  cannot receive keyboard focus. Ready Retry remains repeatable one-for-one; no timer/window
  reload or nonexistent pending-clear control is assumed.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f06-04__... ]`

### QA-F06-05 — Long/narrow content and reduced motion

- **Cases/URLs:** `feedback/toast/long-content`, `/catalog/feedback/toast?case=feedback/toast/long-content`;
  `feedback/export-toast/narrow`; `feedback/maintenance-state/narrow`;
  `feedback/loading-overlay/reduced-motion`.
- **Viewport/mode:** 320x800, keyboard; reduced-motion emulation.
- **Precondition:** Observer empty.
- **Steps:** Traverse toast/state actions; inspect full accessible text; close toast; emulate
  reduced motion and reload loading overlay.
- **Callback observation:** Close exactly one
  `onAction('dismiss:toast-long-content', { source: 'keyboard' })`; motion/resize emits 0.
- **Expected result:** Long text/actions wrap and remain operable; page width assertion is true;
  loading retains visible stage and busy/name semantics with no infinite transform/shimmer under
  reduced motion.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f06-05__... ]`

## QA-F07 — Shell and navigation (`BU-P1-08`, future Wave 4 contract)

### QA-F07-01 — Desktop active, nested, action, and topbar

- **Cases/URLs:** `layout/app-shell/desktop`, `/catalog/layout/app-shell?case=layout/app-shell/desktop`;
  `navigation/app-sidebar/active`; `navigation/app-header/account-open`.
- **Viewport/mode:** 1440x900, keyboard + pointer.
- **Precondition:** Future fixture contract: active item `dashboard`, nested non-active item
  `reports`, account action `sign-out`; observer empty.
- **Steps:** Inspect landmarks; traverse parent/nested items; focus Reports and press Enter;
  pointer-open account controls and click Sign out; inspect topbar/main alignment.
- **Callback observation:** Reports emits exactly
  `onAction('reports', { source: 'keyboard' })`; Sign out emits exactly
  `onAction('sign-out', { source: 'pointer' })`. Active render/traversal emits 0.
- **Expected result:** Exactly one current/active item is announced; nested hierarchy/name is
  preserved; header/sidebar/main landmarks are distinct; desktop grid is
  `var(--beras-sidebar-width) minmax(0, 1fr)` without overlap.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f07-01__... ]`

### QA-F07-02 — Corrected mobile closed/open geometry

- **Cases/URLs:** `layout/app-shell/mobile-closed`, `/catalog/layout/app-shell?case=layout/app-shell/mobile-closed`;
  `layout/app-shell/mobile-open`, `/catalog/layout/app-shell?case=layout/app-shell/mobile-open`.
- **Viewport/mode:** exactly 320x800, keyboard + pointer.
- **Precondition:** Observer empty; capture main/header/drawer rectangles.
- **Steps:** On closed case record `left`, width, and document metrics; pointer-click menu to
  open; record drawer width/overlay and background reachability; close with Escape; remeasure.
- **Callback observation:** Pointer menu activation emits exactly
  `onOpenChange(true, { source: 'pointer', reason: 'action' })`; Escape emits exactly
  `onOpenChange(false, { source: 'keyboard', reason: 'escape' })`; no duplicate open value.
- **Expected result:** Closed main and topbar left edges equal viewport inline-start `0`; primary
  content width is `<=320`; no reserved 252px offset; open drawer overlays and is
  `<=281.6px`; page width assertion is true; background excluded while open.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f07-02__... ]`

### QA-F07-03 — Skip, navigation, tabs, and focus order

- **Cases/URLs:** `navigation/configuration-tabs/focus`, `/catalog/navigation/configuration-tabs?case=navigation/configuration-tabs/focus`;
  `navigation/tabs/selection`; `layout/app-shell/desktop`.
- **Viewport/mode:** 1024x900, keyboard only.
- **Precondition:** Future configuration fixture is frozen to DOM/value order `holiday`,
  `wp-weight`, `target-wp`, `audit-log`, initially selected/focused `holiday`; observer empty.
- **Steps:** From URL bar press Tab through skip link, navigation, search, case content; activate
  skip. In `navigation/configuration-tabs/focus`, press ArrowRight once to focus `wp-weight`,
  press Enter to activate it, then press End and Home only to inspect focus destinations.
  Direct-load `navigation/tabs/selection` only to inspect its controlled selected state.
- **Callback observation:** ArrowRight/End/Home and selection-case render emit 0. Enter emits
  exactly one
  `onValueChange('wp-weight', { source: 'keyboard' })`; no `onAction` or open callback occurs.
- **Expected result:** Skip target is main content; focus order follows DOM; one tab reports
  selected state; arrow navigation skips disabled tab; focus ring is visible/unclipped; no
  positive `tabindex`.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f07-03__... ]`

### QA-F07-04 — Repeated menu and navigation actions

- **Cases/URLs:** `navigation/app-header/mobile`, `/catalog/navigation/app-header?case=navigation/app-header/mobile`;
  `navigation/app-sidebar/mobile`.
- **Viewport/mode:** 768x800, pointer then keyboard.
- **Precondition:** Future fixture contract: AppHeader mobile action ID `open-navigation`;
  AppSidebar mobile starts closed and exposes controlled drawer trigger; observer empty.
- **Steps:** In AppHeader, activate Open navigation once by pointer and once by Enter. In
  AppSidebar, pointer-open and Escape-close; then keyboard-open and activate its named Close
  button by pointer.
- **Callback observation:** Header emits exactly
  `onAction('open-navigation', { source: 'pointer' })`, then the same action with keyboard
  source. Sidebar emits, in order, true/pointer/action, false/keyboard/escape,
  true/keyboard/action, false/pointer/action through `onOpenChange`.
- **Expected result:** No double emit, stale drawer, duplicated menu, or focus loss; repeated
  non-pending actions remain usable one-for-one.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f07-04__... ]`

### QA-F07-05 — Long labels and responsive overflow

- **Cases/URLs:** `layout/app-shell/long-navigation`, `/catalog/layout/app-shell?case=layout/app-shell/long-navigation`;
  `navigation/app-sidebar/long-labels`; `navigation/app-header/long-title`;
  `navigation/configuration-tabs/overflow`.
- **Viewport/mode:** 320x800, 768x800, 1024x900, 1440x900; keyboard.
- **Precondition:** Future configuration fixture uses the F07-03 value order and starts at
  `holiday`; observer empty.
- **Steps:** At each width traverse long/nested nav, header action, every overflowed tab, and
  final content action; scroll only the named tabs region where needed. In overflow case, focus
  `audit-log` and press Enter once.
- **Callback observation:** Traversal/scroll emits 0; overflow activation emits exactly
  `onValueChange('audit-log', { source: 'keyboard' })`.
- **Expected result:** 320/768 use one-column shell; 1024/1440 use desktop grid without jump;
  long accessible names stay complete; page width assertion is true; if tabs overflow, their
  labelled focusable region owns scroll and reaches final tab.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f07-05__... ]`

## QA-F08 — Tables and lists (`BU-P1-09`, future Wave 4 contract)

### QA-F08-01 — Loading, empty, error, and populated states

- **Cases/URLs:** `data-display/bug-table/loading`, `/catalog/data-display/bug-table?case=data-display/bug-table/loading`;
  `data-display/bug-table/empty`; `data-display/bug-table/error`;
  `data-display/bug-table/populated`.
- **Viewport/mode:** 1440x900, accessibility tree.
- **Precondition:** Observer empty.
- **Steps:** Direct-load each state; inspect busy/state text/table semantics and row/column
  headers.
- **Callback observation:** 0 callbacks on every render.
- **Expected result:** Loading exposes busy/name; empty and error have distinct literal
  descriptions; populated uses native `table`, caption/accessible label, column headers, and
  labelled row controls; no empty fake row is announced as data.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f08-01__... ]`

### QA-F08-02 — Sort both directions, selection, and page

- **Cases/URLs:** `data-display/bug-table/sort`, `/catalog/data-display/bug-table?case=data-display/bug-table/sort`;
  `data-display/bug-table/selection`; `data-display/team-metrics-table/populated`.
- **Viewport/mode:** 1440x900, pointer.
- **Precondition:** Future fixtures are frozen as follows: bug sort starts
  `{ columnId: 'days-open', direction: 'descending' }`; bug selection starts `[]` with first
  row ID `BUG-101`; team populated starts `page=1`, `pageCount=3`. The case harness applies each
  emitted controlled value before the next step; observer empty.
- **Steps:** Click Days open twice, waiting for each controlled rerender; select and deselect
  BUG-101 with a rerender between; activate Next then Previous with a rerender between.
- **Callback observation:** Sort emits exactly
  `onValueChange({ columnId: 'days-open', direction: 'ascending' },
  { source: 'pointer' })`, then the same with `direction: 'descending'`; selection emits
  `onValueChange(['BUG-101'], { source: 'pointer' })`, then
  `onValueChange([], { source: 'pointer' })`; pagination emits
  `onValueChange(2, { source: 'pointer' })`, then
  `onValueChange(1, { source: 'pointer' })`.
- **Expected result:** `th[aria-sort]` changes none/ascending/descending with controlled props;
  row checkbox name includes row identity and checked state follows props; page controls expose
  current/total and disable boundaries.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f08-02__... ]`

### QA-F08-03 — Keyboard table/list controls and focus order

- **Cases/URLs:** `data-display/team-metrics-table/tasks-open`, `/catalog/data-display/team-metrics-table?case=data-display/team-metrics-table/tasks-open`;
  `data-display/audit-log/load-more`.
- **Viewport/mode:** 1024x900, keyboard only.
- **Precondition:** Future tasks-open fixture starts sort
  `{ columnId: 'member', direction: 'ascending' }`, selection `[]`, `page=1`,
  `pageCount=3`, first row `member-01`, and controlled member-tasks overlay `open=false`.
  The row-action button is named “Open tasks for Nadya Pratama” with action ID
  `open-tasks:member-01`; the opened modal's initial focus target is its first task disclosure,
  “BERAS-107 · Native overlay mechanics”. The harness applies each controlled value/open state
  before the next step; the separate audit fixture action ID is `load-more`; observer empty.
- **Steps:** Tab to Member sort and press Enter; Tab to member-01 checkbox and press Space; Tab
  to “Open tasks for Nadya Pratama” and press Enter. After observing the row action, have the
  harness set the member-tasks overlay open; verify initial focus, then press Escape without
  attempting background Tab navigation. Apply the emitted closed state in the harness and
  verify focus returns to “Open tasks for Nadya Pratama”; only then Tab to Next and press Enter.
  Direct-load audit log separately, Tab to Load more, and press Enter.
- **Callback observation:** In the tasks-open case, in order, exactly
  `onValueChange({ columnId: 'member', direction: 'descending' },
  { source: 'keyboard' })`, `onValueChange(['member-01'], { source: 'keyboard' })`,
  `onAction('open-tasks:member-01', { source: 'keyboard' })`,
  `onOpenChange(false, { source: 'keyboard', reason: 'escape' })`,
  and `onValueChange(2, { source: 'keyboard' })`. The harness-controlled open transition and
  focus checks emit 0. The separately loaded audit case emits exactly
  `onAction('load-more', { source: 'keyboard' })`.
- **Expected result:** Every interactive header/row/list action is keyboard reachable without
  click-only row behavior. Opening tasks excludes background controls and initially focuses
  “BERAS-107 · Native overlay mechanics”; no background Tab occurs while the modal is open.
  Escape emits one close request, the applied close returns focus exactly to “Open tasks for
  Nadya Pratama”, and Next is reached only after that return. DOM focus order and rings remain
  visible.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f08-03__... ]`

### QA-F08-04 — Repeated sort/select/page controls

- **Cases/URLs:** `data-display/team-metrics-table/sort`, `/catalog/data-display/team-metrics-table?case=data-display/team-metrics-table/sort`;
  `data-display/team-metrics-table/selection`; `data-display/team-metrics-table/populated`.
- **Viewport/mode:** 1440x900, pointer then keyboard.
- **Precondition:** Future team fixtures use initial sort
  `{ columnId: 'member', direction: 'ascending' }`, selection `[]` with row `member-01`, and
  populated `page=1`, `pageCount=3`. Harness applies every callback before the next activation;
  observer empty.
- **Steps:** Complete three separated Member sort clicks, waiting for rerender each time; select
  member-01 by pointer, wait, then deselect by Space. On populated, activate Next by pointer,
  wait for page 2, activate Next by Enter, wait for page 3, then attempt Next once at boundary.
- **Callback observation:** Sort emits, in order,
  `onValueChange({ columnId: 'member', direction: 'descending' },
  { source: 'pointer' })`,
  `onValueChange({ columnId: 'member', direction: 'ascending' },
  { source: 'pointer' })`, then
  `onValueChange({ columnId: 'member', direction: 'descending' },
  { source: 'pointer' })`. Selection emits
  `onValueChange(['member-01'], { source: 'pointer' })`, then
  `onValueChange([], { source: 'keyboard' })`. Page emits
  `onValueChange(2, { source: 'pointer' })`, then
  `onValueChange(3, { source: 'keyboard' })`; disabled boundary attempt emits 0.
- **Expected result:** No batched double callback, stale `aria-sort`, or selection/page state
  divergence; disabled page boundary emits 0.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f08-04__... ]`

### QA-F08-05 — Dense/wide, optional, and long owned overflow

- **Cases/URLs:** `data-display/bug-table/overflow`, `/catalog/data-display/bug-table?case=data-display/bug-table/overflow`;
  `data-display/team-metrics-table/overflow`; `data-display/epic-metrics/optional`;
  `data-display/bug-list/long-content`.
- **Viewport/mode:** 320x800 and 1440x900, keyboard.
- **Precondition:** Future team overflow fixture freezes the inner region accessible name to
  `Team metrics table`, first row ID to `member-01`, and its final named control to
  “Open tasks for Nadya Pratama” with action ID `open-tasks:member-01`; observer empty.
- **Steps:** Inspect optional/long values; Tab into overflow region; use horizontal keys/scroll
  to final column and action; activate final action; repeat at 1440.
- **Callback observation:** Scroll/focus emits 0; the named final team action emits exactly
  `onAction('open-tasks:member-01', { source: 'keyboard' })`. Other state-only cases emit 0.
- **Expected result:** Missing optional value has explicit neutral text (not `undefined`/blank
  ambiguity); long content remains named; at 320 only the labelled `tabindex="0"` region has
  `scrollWidth > clientWidth` and reaches final action; page width assertion is true; at 1440
  dense table remains readable without hiding columns.
- **Result:** `[NOT EXECUTED]`
- **Artifact path:** `[PENDING: qa/beras-ui-phase-1/artifacts/qa-f08-05__... ]`

## Failure routing

Route failures only to the family owner:

| Family | Owner |
|---|---|
| QA-F01 | `BU-P1-04` |
| QA-F02 | `BU-P1-06`, or `BU-P1-07` when the failing case is `overlay/*` |
| QA-F03, QA-F04 | `BU-P1-06` |
| QA-F05 | `BU-P1-07` |
| QA-F06 | `BU-P1-05` |
| QA-F07 | `BU-P1-08` |
| QA-F08 | `BU-P1-09` |

Do not execute a substitute case and do not mark an unavailable contract-bound route as pass.
