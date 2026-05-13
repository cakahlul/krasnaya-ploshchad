# Project Structure - Krasnaya Ploshchad

## Monorepo Layout
```
krasnaya-ploshchad/
├── apps/
│   ├── tere-project/    # Next.js 16 full-stack web app
│   └── mcp-server/      # MCP server (published as @esjn/mcp-tere-report)
├── .claude/             # Claude Code config, steering, specs, bugs
├── package.json         # npm workspaces root
├── package-lock.json
└── README.md
```

> No `packages/`, no `turbo.json`, no `aioc-service/`. Do NOT recreate them.

## Tere Project (`apps/tere-project/`)

### Top-level
```
apps/tere-project/
├── src/
├── public/
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
├── components.json    # shadcn-style config
├── package.json
└── README.md
```

### `src/` layout
```
src/
├── app/                # Next.js App Router (pages + API routes)
│   ├── api/            # Backend HTTP endpoints (route handlers)
│   ├── dashboard/
│   ├── sign-in/
│   ├── sign-up/
│   ├── user/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── icon.tsx
│   ├── globals.css
│   └── bug-monitoring.css
├── components/         # SHARED cross-feature UI components
├── features/           # Feature modules (UI side)
├── hooks/              # SHARED React hooks
├── lib/                # SHARED client/server utilities
├── server/             # ALL backend logic (called by app/api routes)
├── shared/             # Cross-cutting constants / types / utils
├── store/              # Zustand stores (shared)
├── types/              # Global TS types
└── middleware.ts       # Next.js edge middleware
```

### `src/app/api/` — API route handlers
One subdirectory per resource; each contains `route.ts` (and nested dynamic segments). Existing resources:
```
api/
├── api-keys/
├── auth/
├── boards/
├── bug-monitoring/
├── dashboard/
├── holidays/
├── members/
├── project/
├── report/
├── search/
├── talent-leave/
├── target-wp-config/
├── user-access/
└── wp-weight-config/
```
**Pattern**: route handlers are thin — they wrap a `src/server/modules/<name>/<name>.service.ts` call with the appropriate auth HOF from `src/server/auth/`.

### `src/server/` — backend layer
```
server/
├── auth/               # HOFs that wrap route handlers
│   ├── with-auth.ts
│   ├── with-api-key.ts
│   ├── with-auth-or-api-key.ts
│   └── with-role.ts
├── cache/              # In-process cache
├── lib/                # Server-only helpers (Firestore admin, Jira client, etc.)
├── modules/            # Per-feature backend logic
│   ├── api-keys/
│   ├── boards/
│   ├── bug-monitoring/
│   ├── dashboard/
│   ├── holidays/
│   ├── members/
│   ├── reports/
│   ├── search/
│   ├── sprint/
│   ├── talent-leave/   # includes repository, services, clients/, utils/
│   ├── target-wp-config/
│   ├── user-access/
│   └── wp-weight-config/
└── rate-limit/
```

**Module conventions** (varies; not enforced uniformly):
- `<feature>.service.ts` — business logic (always present)
- `<feature>.repository.ts` — Firestore data access (when persistence involved)
- `clients/` — external API clients (Jira, Google, etc.)
- `utils/` — feature-specific helpers
- No controllers — Next.js route handlers play that role.

### `src/features/` — frontend feature modules
```
features/
├── api-keys/
├── bug-monitoring/
├── dashboard/
├── holiday-management/
├── talent-leave/       # has components/, hooks/, repositories/, store/, types/, utils/, plus *.test.tsx and *.md docs
└── team-members/
```
**Subfolders inside a feature** (use what is needed; not all features need all):
- `components/` — feature-specific UI
- `hooks/` — feature-specific hooks
- `store/` — feature-local Zustand slice
- `types/` — feature TS types
- `utils/` — feature helpers
- `repositories/` — client-side data fetching wrappers around React Query
- `*.test.tsx` — colocated tests
- `*.md` — feature docs (e.g. `ACCESSIBILITY.md`, `INTEGRATION_CHECKLIST.md`, `TESTING_GUIDE.md` in `talent-leave/`)

### `src/components/` — SHARED components
Cross-feature, app-wide UI (sidebar, topbar, loading screens, theme toggle, auth UI, error interceptors). Feature-specific components live under `src/features/<name>/components/`.

### `src/lib/` — SHARED utilities
- `auth.ts` — auth helpers
- `axiosClient.ts` — configured axios instance
- `firebase.ts` — Firebase client SDK init
- `firebaseAdmin.ts` — Firebase Admin SDK init (server-only)
- `user-access.client.ts` — RBAC client helpers
- `utils.ts` — general helpers (cn, etc.)

### `src/shared/`
- `constants/`, `types/`, `utils/` — cross-cutting items used by both `features/` and `server/`.

### `src/hooks/`, `src/store/`, `src/types/`
- `hooks/`: `useTheme.tsx`, `useUser.ts`, `useUserAccess.ts`
- `store/`: `userStore.ts` (Zustand)
- `types/`: `user-access.types.ts`

## MCP Server (`apps/mcp-server/`)
```
apps/mcp-server/
├── src/
│   ├── index.ts           # MCP server entrypoint
│   ├── tools/             # One file per tool
│   │   ├── get-epics.ts
│   │   ├── get-open-sprint-report.ts
│   │   ├── get-productivity-summary.ts
│   │   ├── get-sprint-report.ts
│   │   └── list-sprints.ts
│   ├── lib/
│   │   ├── api-client.ts      # calls Tere API
│   │   ├── config.ts
│   │   └── sprint-resolver.ts
│   └── types/
├── dist/                  # tsc output (gitignored, shipped to npm)
├── package.json
├── tsconfig.json
└── README.md
```
- ESM module.
- Tools register with the MCP SDK in `index.ts`.
- Auth to Tere uses an API key.

## Conventions

### Naming
- React components: `PascalCase.tsx`
- Hooks: `useFoo.ts` / `useFoo.tsx`
- Services / repositories / utilities: `kebab-case.ts` (e.g. `talent-leave.service.ts`, `with-auth.ts`)
- Feature directories: `kebab-case`
- Tests: `<name>.test.tsx` colocated with source

### Imports
- External libs first, internal modules next, relative imports last.
- Use TS path aliases when configured (see `tsconfig.json`).

### Adding a new feature
1. **Backend**: create `src/server/modules/<feature>/` with `<feature>.service.ts` (and `<feature>.repository.ts` if it persists data).
2. **API**: create `src/app/api/<feature>/route.ts` that wraps the service with `with-auth`, `with-api-key`, or `with-auth-or-api-key` + optional `with-role`.
3. **Frontend**: create `src/features/<feature>/` with the subfolders you need (`components/`, `hooks/`, `store/`, `types/`, `utils/`, `repositories/`).
4. **Page**: add a route under `src/app/<feature>/page.tsx` if it has its own page.
5. **Shared types/constants**: put cross-cutting items in `src/shared/`.

### Adding a new MCP tool
1. Create `apps/mcp-server/src/tools/<tool-name>.ts` using zod for input schema.
2. Register it in `src/index.ts`.
3. If it needs a new Tere endpoint, add `src/lib/api-client.ts` method and ensure the Tere API route exists with `with-api-key`.
4. `npm run mcp:build` then publish via `npm run mcp:release[:minor|:major]`.

### Where things go (quick lookup)
| Need | Location |
|---|---|
| New page | `src/app/<route>/page.tsx` |
| New API endpoint | `src/app/api/<resource>/route.ts` |
| Backend service | `src/server/modules/<feature>/<feature>.service.ts` |
| Firestore data access | `src/server/modules/<feature>/<feature>.repository.ts` |
| External API client | `src/server/modules/<feature>/clients/` or `src/server/lib/` |
| Auth wrapper | `src/server/auth/` |
| Shared UI component | `src/components/` |
| Feature UI component | `src/features/<feature>/components/` |
| Shared hook | `src/hooks/` |
| Feature hook | `src/features/<feature>/hooks/` |
| Zustand store (global) | `src/store/` |
| Zustand store (feature) | `src/features/<feature>/store/` |
| Firebase client init | `src/lib/firebase.ts` |
| Firebase admin init | `src/lib/firebaseAdmin.ts` |
| Cross-cutting types | `src/shared/types/` or `src/types/` |
| Cross-cutting constants | `src/shared/constants/` |
| MCP tool | `apps/mcp-server/src/tools/` |

## Testing
- Jest-style `*.test.tsx` files exist colocated with code (e.g. `components/sidebar.test.tsx`, `features/talent-leave/*.test.tsx`).
- No root-level `test` script wired yet — confirm with the user before adding test infrastructure.

## Env & Secrets
- `apps/tere-project/.env` (from `.env.example`) — Firebase, Jira, Google config.
- Never commit `.env*` files (except `.env.example`).
- MCP server reads Tere API base URL + API key from its own env.
