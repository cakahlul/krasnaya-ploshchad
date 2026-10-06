# Implementation Plan: Tere UI/UX Revamp

## Overview

Deliver the redesign in vertical slices. Shared theme and shell changes land first; role-specific home and existing route groups follow. No API/data-model changes are planned. Existing server authorization remains the source of truth.

## Architecture Decisions

- Replace `light | void | crimson` with `light | dark | system` in the existing theme provider; CSS variables provide semantic tokens and glass fallbacks.
- Keep route URLs and feature modules. Rebuild layouts and composition components around them rather than introducing a new router or component library.
- Keep role decisions at page/shell boundaries. APIs continue to determine actual access and privacy.
- Use progressive dashboard queries already introduced; UI must display partial results rather than block on a complete board set.
- Glass is a surface treatment, not a visual substitute for hierarchy: no decorative blur/gradient/emoji patterns.

## Dependency Graph

```text
Theme tokens + preference
        │
        ├── Shell, navigation, responsive chrome
        │       ├── Role-first Home
        │       ├── Delivery routes
        │       ├── Operations routes
        │       └── Administration routes
        └── Auth/loading/error states
                    │
                    └── Accessibility + visual QA
```

## Rollout Phases

### Phase 1: Foundations

1. Theme tokens and theme preference.
2. Dashboard shell, grouped navigation, and responsive chrome.

Checkpoint: light/dark/system work across the shell; every authorized route remains navigable.

### Phase 2: Role-first Home

3. Contributor Home: personal sprint/Kanban progress and next actions.
4. Lead/VP Home: risk/portfolio hierarchy and progressive board hydration.

Checkpoint: one authorized board and many authorized boards both remain useful during loading; non-Lead data stays personal.

### Phase 3: Feature Route Groups

5. Delivery: reports and productivity summary.
6. Delivery: epic explorer.
7. Operations: bug monitoring.
8. Operations: talent leave.
9. Administration: configuration, team members, and MCP connection.
10. Authentication, loading, empty/error states, and cross-route accessibility polish.

Checkpoint: all existing capabilities remain reachable and usable in both themes.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Huge dashboard page | High | Extract small role-home compositions before visual changes. |
| Inline legacy colors | High | Migrate shared shell first; replace page-local colors one route slice at a time. |
| Glass harms contrast/performance | High | Use tokenized opaque fallback, contrast checks, and blur only on shell surfaces. |
| Role/UI drift from API access | High | Retain server authorization; test non-Lead network data and hidden navigation together. |
| Existing lint/build blockers | Medium | Run focused lint/type checks and record unrelated blockers. |

## Non-goals

- No schema, reporting-calculation, or Jira integration rewrite.
- No new dependency or visual asset without approval.
- No route removal or access broadening.

## Approval Gate

Approve [tasks.md](tasks.md) before implementation starts.
