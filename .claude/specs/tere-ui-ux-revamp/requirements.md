# Spec: Tere UI/UX Revamp

## Objective

Rebuild Tere's UI, UX, and layouts into one role-aware product with a modern glass design language. Contributors must see personal sprint/Kanban progress first; Leads and Managers, team risks; VPs, portfolio health. Every current capability remains available, while navigation becomes smaller and detail is revealed only when requested.

Success means a signed-in user immediately knows their priority, their permitted actions, and where to go next—without exposing boards or teammate metrics beyond existing authorization rules.

## Tech Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS, Ant Design, Framer Motion, Lucide.
- Reuse existing React Query, Zustand, API routes, RBAC, and dashboard authorization.
- Use CSS custom properties, `backdrop-filter`, and existing dependencies; do not add a design-system dependency.

## Commands

- Dev: `npm run dev`
- Type check: `cd apps/tere-project && npx tsc --noEmit`
- Lint: `cd apps/tere-project && npm run lint`
- Build: `cd apps/tere-project && npm run build`

## Project Structure

- `apps/tere-project/src/app/dashboard/` — authenticated routes and shell.
- `apps/tere-project/src/components/` — shared navigation and chrome.
- `apps/tere-project/src/features/` — feature-owned views, hooks, and UI.
- `apps/tere-project/src/hooks/useTheme.tsx` — light/dark/follow-system preference.
- `apps/tere-project/src/styles/` — shared theme tokens and component styling.
- `.claude/specs/tere-ui-ux-revamp/` — this approved revamp specification and subsequent plan/tasks.

## Information Architecture

1. **Home** — role-specific priority view: My Progress, Team Risks, or Portfolio Health.
2. **Delivery** — Team Reports, Productivity Summary, and Epic Explorer.
3. **Operations** — Bug Monitoring and Talent Leave.
4. **Administration** — Team Members, Configuration, and MCP Connection; show only where authorized.
5. Keep routes and capabilities intact during the rollout; navigation labels and grouping may change.

## Requirements

### 1. Shared Product Shell

#### 1.1 Navigation
**User Story:** As a user, I want a small, understandable navigation structure, so that I know where each task belongs.

WHEN the authenticated shell loads THEN it SHALL group all existing destinations into Home, Delivery, Operations, and Administration.

WHEN a destination is unavailable to the role THEN it SHALL be absent rather than disabled.

WHEN the viewport is narrow THEN navigation SHALL collapse into an accessible mobile control without losing routes.

#### 1.2 Themes
**User Story:** As a user, I want light, dark, and system themes, so that Tere is comfortable in my working environment.

WHEN a theme is selected THEN all shell, surface, text, border, chart, and status colors SHALL use its semantic tokens.

THE system SHALL support only light, dark, and follow-system; the crimson/Soviet theme and its copy SHALL be removed.

### 2. Role-first Home

#### 2.1 Contributor home
**User Story:** As a contributor, I want my own sprint/Kanban progress first, so that I know what to act on.

WHEN a non-Lead opens Home THEN it SHALL show only their authorized boards and personal metrics, with a next-action cue for each board.

#### 2.2 Lead/Manager home
**User Story:** As a Lead or Manager, I want risks before detail, so that I can resolve the most important team issue.

WHEN a Lead opens Home THEN it SHALL prioritize at-risk delivery signals, followed by assigned-board summaries and drill-down actions.

#### 2.3 VP home
**User Story:** As a VP, I want portfolio health first, so that I can scan assigned-board status without waiting for every board.

WHEN a VP opens Home THEN it SHALL show cached headline status immediately and hydrate assigned board cards progressively.

### 3. Glass Visual Language

#### 3.1 Surfaces and hierarchy
WHEN a view renders THEN it SHALL use a restrained layered-glass system: translucent surfaces, low-contrast borders, soft depth, and readable fallback surfaces where blur is unavailable.

WHEN content is actionable or exceptional THEN hierarchy SHALL come from spacing, typography, status color, and clear labels—not decorative effects alone.

#### 3.2 Accessibility
THE system SHALL preserve keyboard navigation, visible focus, semantic buttons/labels, non-color status cues, and WCAG AA contrast for text and controls in both themes.

THE system SHALL respect reduced-motion preferences; animation SHALL never block interaction.

#### 3.3 No generic AI aesthetic or copy
THE redesign SHALL use a deliberate visual system, not stock gradients, decorative blur, random glow, emoji, or interchangeable SaaS copy.

WHEN UI copy is added THEN it SHALL name the concrete metric, state, or next action. It SHALL avoid slogans, hype, filler, and wording that could be moved unchanged into another product.

### 4. Progressive Detail and Performance

WHEN dashboard data loads THEN shell content and cached cards SHALL render before slow Jira-backed cards.

WHEN a user has multiple boards THEN card requests SHALL remain bounded and each completed card SHALL render independently.

WHEN a table or report is dense THEN summary, filters, and the next likely action SHALL appear before secondary columns or controls.

### 5. Authorization and Privacy

THE UI SHALL never imply access to a route, board, or action that its API denies.

Non-Leads SHALL see only their own metrics on assigned boards. Leads and VPs SHALL see only assigned boards; their team-level detail follows role authorization.

## Code Style

Use semantic tokens and minimal role branching at the composition boundary:

```tsx
const home = member.isLead ? <TeamHome /> : <MyProgressHome />;
return <AppShell>{home}</AppShell>;
```

- Prefer existing components/hooks before adding a parallel abstraction.
- Keep data authorization on the server; UI conditions are presentation only.
- Use descriptive feature-local component names and narrow props.

## Testing Strategy

- Keep/extend colocated unit tests for role selection, privacy filtering, and token/theme behavior.
- Type-check every slice with `cd apps/tere-project && npx tsc --noEmit`.
- Run targeted ESLint for touched files; record pre-existing global lint/build blockers separately.
- Manually verify light, dark, system, keyboard navigation, mobile navigation, and each role's Home state.

## Boundaries

- Always: preserve existing capabilities, routes, APIs, and authorization while freely rewriting UI, UX, and layouts; meet accessibility basics and use existing dependencies.
- Always: use specific product language and purposeful visual hierarchy; reject generic AI-style copy and decoration.
- Ask first: schema/API contract changes, new dependencies, visual assets, or removal of an existing capability.
- Never: expose teammate metrics to non-Leads, reintroduce the crimson/Soviet theme, weaken authorization, or perform a big-bang rewrite.

## Success Criteria

- Every existing destination is reachable through the consolidated navigation for authorized users.
- Each role lands on its specified priority view.
- Light, dark, and system themes are available; crimson/Soviet visuals and copy are gone.
- Dashboard cards appear progressively for multi-board users.
- Non-Lead network responses and UI contain no teammate dashboard metrics.
- Core routes remain usable on mobile and keyboard-only navigation.

## Open Questions

- No new product requirements are needed before planning. Exact visual tokens and rollout slices belong in the technical plan.
