# TRD Phase 1 — Beras UI QA

## Status dan scope

QA Phase 1 membuktikan package/catalog Beras lengkap, native interaction setara, responsive, accessible, offline, dan terisolasi dari Tere. Dokumen sumber: [`prd.md`](./prd.md), [`rollout-phases.md`](./rollout-phases.md), [`trd-phase-1-fe-web.md`](./trd-phase-1-fe-web.md), [`inventory-baseline.md`](./inventory-baseline.md).

Backend QA dan Frontend Mobile QA: N/A. Responsive web di 320/768/1024/1440 termasuk scope QA Web.

## 1. Test levels

| Level | Tool | Scope |
|---|---|---|
| Static contracts | Node scripts + ESLint + TypeScript | manifest/count/schema, exports, dependencies, imports, `className`, isolation |
| Logic | `node:test` | scale/date/tree/table/search/ADF/3D-scene reducers and state transitions |
| Build/consumer | Next build + compile fixture | package entrypoints, stylesheet, catalog self-use, SSR/client boundary |
| Browser functional | Chrome DevTools/browser nyata | live controls, keyboard/focus, responsive/overflow, console/network |
| Visual parity | baseline reference + screenshots | intended light appearance, consolidation, known-defect correction |
| Accessibility | semantics tree/manual keyboard/contrast/motion | WCAG AA basics and native visual equivalents |

## 2. Preconditions dan deterministic test data

- Checkout baseline-aware Phase 1 branch; Node `>=20.9.0`; `npm ci` succeeds.
- Tere baseline evidence refers to commit `79927540a3c27d2c29b42d84c42b7e9abcb51800`.
- Browser zoom 100%; screenshots record browser/OS, route, case ID, viewport, reduced-motion mode.
- Disable cache while checking network; no Tere env vars or credentials exist.
- Fixtures use fixed IDs/dates/names/series/seeds. Clock/random/network are absent from catalog rendering.
- Run cases in light mode only. Void/crimson are inventory-only and must not be selectable.

## 3. Runnable gate sequence

```bash
npm ci
npm run lint --workspace=@krasnaya/beras-ui
npm run typecheck --workspace=@krasnaya/beras-ui
npm test --workspace=@krasnaya/beras-ui
npm run verify:inventory --workspace=@krasnaya/beras-ui
npm run verify:catalog --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run verify:isolation --workspace=@krasnaya/beras-ui
npm run build --workspace=@krasnaya/beras-ui
npm run dev --workspace=@krasnaya/beras-ui
# capture/update browser evidence, then:
npm run verify:evidence --workspace=@krasnaya/beras-ui
npm run verify --workspace=@krasnaya/beras-ui
```

Any failed command blocks Phase 1. Evidence validation is run after browser artifacts are present.

## 4. Static and package test cases

| ID | Check | Expected |
|---|---|---|
| QA-S01 | manifest baseline/path uniqueness/existence | exact commit, 82 unique production paths, 4 unique CSS, required foundation inputs |
| QA-S02 | ledger disposition/schema | 82 rows; allowed values only; zero `deferred`; every visual artifact has case/evidence |
| QA-S03 | artifact-to-case graph | no dangling/duplicate stable ID; runtime renderer + fixture + docs + evidence resolve |
| QA-S04 | public export graph | no wildcard/private source export; every component/layout export has live case |
| QA-S05 | consumer fixture | imports root/components/layouts/foundations/types/styles subpaths; typecheck/build passes |
| QA-S06 | catalog import boundary | no relative component/layout/internal imports; self-consumes `@krasnaya/beras-ui/*` |
| QA-S07 | direct dependency allowlist | runtime exact Next/React/ReactDOM; dev exact TRD list; prohibited scan zero |
| QA-S08 | runtime isolation | no Tere path, env secret, API URL, auth/store/query/mutation import or network fixture |
| QA-S09 | stylesheet boundary | public selectors prefixed/scoped; no global consumer reset; no void/crimson/dark output |
| QA-S10 | `className` contract | test sentinel class occurs only on outer root; no public `style`/slot styling escape hatch |
| QA-S11 | deterministic fixtures | no `Math.random`, current clock, fetch/XHR/WebSocket/EventSource; identical case data across runs |
| QA-S12 | Tere immutability | baseline diff under `apps/tere-project/**` empty |

## 5. Family functional matrix

Every listed family must have default plus inventory-required state cases. Data-bearing families require loading/empty/error/populated even when old Tere component mixed those states in a page.

| ID | Family | Required functional checks |
|---|---|---|
| QA-F01 | Buttons/actions | default/hover/focus/active/disabled/pending/success/failure; repeated activation while pending emits once |
| QA-F02 | Fields/forms | required/optional/helper/error/read-only/disabled; label association; keyboard submit/cancel; long content |
| QA-F03 | Select/multiselect | open/close/select/clear/cancel, search, disabled option, long option, empty; Arrow/Home/End/Enter/Space/Escape |
| QA-F04 | Date/month/range | boundary dates, invalid reversed range, presets, clear/cancel, disabled, keyboard entry/navigation |
| QA-F05 | Dialog/drawer/popover | invoker focus return, initial focus, Tab containment when modal, Escape, backdrop policy, overflow actions visible |
| QA-F06 | Toast/alert/state | success/error, close, live-region semantics, retry, loading/empty/error/maintenance/permission/not-registered |
| QA-F07 | Shell/navigation | active route, mobile closed/open, long labels, nested item, sign-out/action, topbar; no narrow fixed offset |
| QA-F08 | Table/list | loading/empty/error/populated, sort both directions, select, page, dense/wide, optional/long fields, named overflow region |
| QA-F09 | Charts | empty, single/multiple series, flat/zero, long labels; focus/pointer tooltip parity; legend and semantic data equivalent |
| QA-F10 | Calendars | empty/dense, holiday/weekend, month boundary, selected/range, edit action, sticky/wide overflow, roving day keyboard |
| QA-F11 | Tree | empty, collapsed/expanded, selected, deep nesting, large visible set/load more; complete tree keyboard contract |
| QA-F12 | ADF | empty, headings, marks, lists, quote, code, table, panel, safe/unsafe links, unknown node, long overflow |
| QA-F13 | Loading animation | stage variants, deterministic output, busy/name semantics, reduced-motion stable state |
| QA-F14 | `Stat3DScene` | seeded semantic bars/depth/sparkles, CSS perspective, pointer parallax, hover/focus parity, no loop, reduced motion |
| QA-F15 | Page compositions | auth, dashboard, reports/productivity, bug, config, MCP, epic, holiday, leave, members; events emit only presentational values |

## 6. Viewport matrix

Run each required case from `case-manifest.json` at all widths listed on that case. Height baseline: 800px for 320/768, 900px for 1024/1440; additionally shrink dialog height to 568px.

| Width | Core assertion |
|---:|---|
| 320 | no page-level horizontal overflow; shell content begins at inline-start 0; drawer <=88vw; primary actions visible/wrapped; dense regions independently operable |
| 768 | single-column shell remains; cards/forms reflow; overlays bounded; no clipped action/search |
| 1024 | desktop grid transition has no overlap/jump; sidebar/content/topbar align |
| 1440 | max-width/readability, dense tables/charts, no excessive stretching or hidden content |

For every run record: `document.documentElement.scrollWidth <= clientWidth` except the explicitly named inner overflow element; that element must be keyboard focusable, labelled, and scrollable to final content/action.

Known-defect regression: at 320px open `/catalog/layout/app-shell?case=layout/app-shell/mobile-open` and mobile-closed case. Assert main/topbar left edge is viewport edge when drawer closed, primary content width <= viewport, and drawer overlays rather than reserving desktop 252px.

## 7. Keyboard/focus walkthroughs

| Pattern | Expected keyboard path |
|---|---|
| Global catalog | Skip link -> nav -> search -> case content; focus visible and DOM order logical |
| Tabs/segmented | Arrow changes focused item; activation contract documented; selected state announced |
| Menu/select | trigger Enter/Space; Arrow/Home/End; search/type; Enter select; Escape closes and returns focus |
| Multiselect | each selection toggles without closing unexpectedly; selected values announced/removable |
| Dialog | invoker -> initial control -> all controls -> contained wrap; Escape close; focus returns |
| Drawer | open button; modal navigation; Escape/close; focus returns; background not keyboard reachable while modal |
| Table | sort buttons, selection, pagination, overflow region reachable; no click-only row action |
| Calendar | Arrow day, Home/End week, PageUp/Down month, Enter/Space select; boundary state announced |
| Tree | Up/Down visible items, Right expand/child, Left collapse/parent, Home/End, Enter/Space, load-more button |
| Chart | summary/legend/data equivalent reachable; any interactive point works with focus same as pointer |
| Toast | announcement occurs once; close reachable without stealing focus unexpectedly |
| 3D scene | every bar/value/action focusable and named; pointer-only parallax adds no hidden meaning |

No positive `tabindex` allowed. Focus ring cannot be obscured/clipped. Modal close cannot strand focus in removed DOM.

## 8. Contrast, semantics, dan motion

- Measure every semantic text/status/token pair. Pass: normal text >=4.5:1; large text and essential UI/focus >=3:1.
- Check default, hover, focus, active, disabled where meaning remains required. Disabled content may be exempt only if truly unavailable and still discernible.
- Status/tag/chart/calendar meaning must include text/icon/shape/pattern; grayscale inspection still understandable.
- Heading hierarchy and landmarks valid on every catalog/docs route. Form controls have programmatic labels; icon buttons have names.
- With OS `prefers-reduced-motion: reduce`: no infinite loop, parallax, shimmer, bouncing, auto animation, or smooth scroll; state changes remain perceivable.
- With no-preference: animation must not block action, move focus target, or continue after component unmount/hidden document.

## 9. Console, network, offline, dan resilience

For one case per family and every page composition:

1. Clear console/network, reload, exercise interactions.
2. Fail on React hydration/key warnings, uncaught error, failed resource, a11y-related browser warning, or unexpected log.
3. Block network after initial local document load and repeat. Catalog behavior/fixtures remain usable; no Tere/API/auth/analytics/remote asset request.
4. Direct-load every dynamic catalog route and refresh; no 404 or client-only crash.
5. Disable motion and remove CSS transforms in DevTools; semantic values/actions remain complete.
6. Rapidly click pending action, open/close overlay, switch cases, and resize; no duplicate callback, stale overlay, orphan animation, or corrupted local visual state.

Allowed browser requests: local catalog document, JS, CSS, local/generated font assets, source maps in dev. Any remote host is failure.

## 10. Visual parity dan evidence protocol

Each mapped case needs evidence entries as applicable:

- visual screenshot at reference width;
- responsive screenshots/notes for required widths;
- keyboard/focus result;
- contrast measurement result;
- reduced-motion result;
- offline result for each family/composition.

Filename: `<case-id with slash replaced by __>__<check>__<viewport-or-mode>.png|json|md`. Evidence manifest links stable case ID, exact artifact path, result, and intentional delta note. Required intentional deltas:

- native implementation replacing third-party mechanics while preserving intent;
- canonical consolidation of duplicate visuals;
- contrast correction;
- Beras mobile shell fix;
- dead CSS/known defect omitted;
- void/crimson retained inventory-only.

Screenshots alone never prove interaction. Charts, tables, dialog/select/date, calendars, trees, toast, icon naming, loading animation, and `Stat3DScene` need associated interaction evidence.

## 11. Catalog completeness sampling rule

Coverage is exhaustive, not statistical: every public component/layout export, every case ID, and every ledger artifact mapping is validated. Browser interaction may share a family test only when all variants use the exact same interaction primitive; every visually distinct case still receives visual/responsive evidence per manifest.

## 12. Exit report

QA final report must include:

```text
baseline=<40-char SHA>
production_sources=82/82
stylesheets=4/4
public_exports=<covered>/<total>
catalog_cases=<resolved>/<total>
unexplained_artifacts=0
deferred=0
prohibited_dependencies=0
private_imports=0
unexpected_network_requests=0
required_evidence=<present>/<required>
tere_changed_files=0
STATUS: CLEAN
```

Any non-zero failure, missing required evidence, or unresolved ambiguity produces `STATUS: NEEDS_REVISION` with case ID, route, viewport/mode, reproduction steps, expected, actual, and artifact path.
