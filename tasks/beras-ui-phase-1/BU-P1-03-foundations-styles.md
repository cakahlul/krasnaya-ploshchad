# BU-P1-03 — Light foundations and shipped stylesheet

**Stack:** FE-web
**Assigned role:** `fe-web-executor`
**Reviewer role:** `fe-web-reviewer`
**Wave:** 1, slot 3/3
**TRD coverage:** FE-03 plus shared CSS/polish portion of FE-18; R-06–R-07, R-13–R-14
**Estimated scope:** M; foundation/style vertical slice

## Description

Implement the light-only semantic foundation, exact font/breakpoint metadata, and the single shipped CSS entrypoint. This task is the exclusive owner of shared CSS so parallel component executors never edit the same file.

## Owned files

- `/apps/beras-ui/src/foundations/**`
- `/apps/beras-ui/src/styles/{index.css,tokens.css,base.css,components.css}`
- `/apps/beras-ui/src/catalog/cases/foundations.tsx`
- `/apps/beras-ui/src/fixtures/foundations.ts`
- `/apps/beras-ui/tests/foundations.test.mjs`

Component tasks own markup/behavior and must use the root-class/data-attribute contract below; CSS fixes return here as revisions.

**Wave 2 revision contract:** BU-P1-04 proved that narrow long code/secret content needs root-level
containment. The shared CSS owner adds overflow containment for `.beras-code-block` and safe wrapping
for `.beras-secret-field`, plus a regression assertion. The BU-P1-04 executor may carry this tiny
cross-owner patch in the same revision slot, but it is reviewed and committed as a BU-P1-03 follow-up.

## Contract

Exports: `BERAS_BREAKPOINTS`, `BERAS_TOKEN_NAMES`, `berasLightTokenReference`, semantic unions for evidenced `variant`, `size`, and `tone`. Breakpoints are exactly `{ narrow: 320, tablet: 768, desktop: 1024, wide: 1440 }` in documented public metadata; CSS transitions at the matching boundaries.

`src/styles/index.css` imports only `tokens.css`, `base.css`, `components.css`. Public stylesheet import remains `@krasnaya/beras-ui/styles.css`.

Required token groups/names follow C-04 in [`../plan.md`](../plan.md): all values begin `--beras-`; include color page/surfaces/text/border/brand/focus/overlay, five status tones each with foreground/background/border, `--beras-data-1`…`--beras-data-8` plus grid/axis/tooltip, typography, 4px spacing/sizing, borders/radii/elevation, motion, layers, and 320/768/1024/1440 metadata. Baseline light anchors: `#011d4d`, `#034078`, `#1282a2`, `#22b8d4`, `#f2f4f9`, `#ffffff`; contrast correction must be documented in token metadata.

Fonts: Space Grotesk and IBM Plex Mono weights `400|500|600|700`; expose `--beras-font-sans`, `--beras-font-mono`, with system fallback. Build-time `next/font/google` integration is consumed by BU-P1-15; browser runtime has no remote font request.

Root CSS class formula is exact: each public visual export uses `.beras-<PascalCase converted to kebab-case>` on its outermost element (examples `.beras-button`, `.beras-date-range-field`, `.beras-data-table`, `.beras-stat-3d-scene`, `.beras-app-shell`). Supported state selectors are only `[data-beras-state]`, `[data-beras-tone]`, `[data-beras-size]`, `[data-beras-variant]`, `[aria-*]`, and native pseudo-classes. `className` follows the package root class on that same element only.

Case IDs:

- `foundation/typography/sans|mono|weights`;
- `foundation/light-theme/tokens|status|data-visualization|contrast`.

No dark/void/crimson selector, theme toggle, localStorage mutation, global reset, third-party selector, or consumer-descendant styling contract.

## Acceptance criteria

- [ ] All required semantic tokens, exact light families/weights, variants, layers, motion, and breakpoint metadata exist and are documented through public foundation exports.
- [ ] `BERAS_TOKEN_NAMES` exactly enumerates shipped public tokens; `berasLightTokenReference` contains the same keys.
- [ ] CSS uses `.beras-*`/`data-beras-*`; reset is scoped to `[data-beras-root]`; only token declarations use `:root`.
- [ ] `components.css` covers every frozen root class/state attribute without requiring consumer Tailwind scanning or internal selector customization.
- [ ] `prefers-reduced-motion: reduce` reduces duration to `1ms`, stops loops/parallax/shimmer/bounce/smooth scrolling, and preserves state meaning.
- [ ] Foundation cases are deterministic and import public foundation/style entrypoints; no void/crimson/dark output or runtime remote asset.
- [ ] Token/selector tests reject unprefixed public selector, forbidden reset/theme, missing token, and className/internal-style escape hatch.
- [ ] No Tere edit.

## Verification

```bash
node --test apps/beras-ui/tests/foundations.test.mjs
npm run lint --workspace=@krasnaya/beras-ui
npm run typecheck --workspace=@krasnaya/beras-ui
npm run verify:boundaries --workspace=@krasnaya/beras-ui
npm run build --workspace=@krasnaya/beras-ui
git diff --name-only 79927540a3c27d2c29b42d84c42b7e9abcb51800 -- apps/tere-project
```

Last command empty.

## Definition of Done

Foundation cases render at all four widths, token/selector/motion tests pass, contrast exceptions documented, reviewer returns `STATUS: CLEAN`.

## Commit

`feat(beras-ui): BU-P1-03 add light foundations (Beras UI Phase 1/MVP)`

Local task. No Jira transition.
