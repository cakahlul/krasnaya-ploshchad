# Project Instructions — Krasnaya Ploshchad

## Steering documents (READ BEFORE EXECUTING)

This project ships **steering files** that describe what the codebase is, how it's built, and how it's organized. **Always consult the relevant steering file before scanning the repo.** Do not re-glob/grep the tree to relearn what these files already document.

| File | When to read | Priority |
|---|---|---|
| [.claude/steering/feature-index.md](.claude/steering/feature-index.md) | **ALWAYS — first stop for any task touching a specific feature.** Maps feature → exact file paths (page, feature module, API routes, server module, shared types). | 🥇 |
| [.claude/steering/structure.md](.claude/steering/structure.md) | When creating a NEW feature that isn't in the index yet, or when you need the generic "where does X go" lookup table. | 🥈 |
| [.claude/steering/tech.md](.claude/steering/tech.md) | Dependencies, versions, frameworks, build/lint/test tooling, env, auth, or external integrations (Firebase, Jira, Google APIs, MCP SDK). | 🥉 |
| [.claude/steering/product.md](.claude/steering/product.md) | Scope, user flows, business intent, feature flags. | 🥉 |

### Required workflow

1. **First action for ANY feature task**: open [feature-index.md](.claude/steering/feature-index.md), find the feature, read ONLY the listed files. No globbing the tree.
2. If the feature isn't in the index, fall back to `structure.md` for placement conventions, then add the new feature to the index.
3. Read `tech.md` only if the task involves dependencies/tooling/integrations.
4. Read `product.md` only if scope or intent is ambiguous.
5. You may still read specific source files for their contents — but discovery (figuring out *which* files exist) goes through the index.

### Update steering AFTER implementing

After completing a task that changed any of these, **update the matching steering file in the same response**:

| Changed | Update |
|---|---|
| **Added/moved/renamed/deleted ANY file** under `src/app/api/`, `src/server/`, `src/features/`, `src/app/dashboard/`, `src/components/`, `src/hooks/`, `src/lib/`, `src/shared/`, or `apps/mcp-server/src/` | **`feature-index.md`** (under the matching feature section). This is the most important update — stale pointers break the whole system. |
| Added/removed/renamed a top-level folder under `src/` or a new app under `apps/` | `structure.md` AND `feature-index.md` |
| Added a brand-new feature (page + API + server module) | `feature-index.md` (new section + add to Quick Nav), `structure.md` (if pattern is novel), `product.md` (Core Features) |
| Added/removed/upgraded a major dependency (Next.js, React, Tailwind, antd, Firebase, etc.) | `tech.md` |
| Changed auth strategy, RBAC roles, env vars, or external integrations | `tech.md` |
| Added/removed an MCP tool in `apps/mcp-server/src/tools/` | `feature-index.md` (MCP Server section) AND `product.md` (MCP tools list) |
| Introduced a new convention or removed an old one | `structure.md` (Conventions section) |
| Added/removed a feature flag with cross-cutting scope | `product.md` (Feature Flag Notes) |

Trivial changes (one-line bug fixes, copy edits, edits inside an already-indexed file) do NOT require steering updates. **But any new file path, moved file, or deleted file always requires a `feature-index.md` update.**

### Steering is the source of truth — keep it accurate

- If you find steering is **wrong or stale**, fix it before acting on the incorrect information. Do not silently work around it.
- If you find steering is **missing** information you had to discover by scanning, add it after the task so future-you doesn't repeat the scan.
- Never duplicate steering content into code comments — link to it instead.

## Other project conventions

- Monorepo via **npm workspaces** (no Turborepo). Do not introduce Turborepo, NestJS, or a `packages/` directory.
- The former `aioc-service` backend is gone — all server logic lives in `apps/tere-project/src/server/` and is exposed via `src/app/api/` route handlers.
- TypeScript everywhere. Prettier + ESLint via `npm run format` / `npm run lint`.
