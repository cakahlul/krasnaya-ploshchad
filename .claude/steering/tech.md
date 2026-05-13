# Technology Stack - Krasnaya Ploshchad

## Architecture Overview
Monorepo using **npm workspaces** (no Turborepo). Two workspaces under `apps/*`:
- **`apps/tere-project`** — Full-stack Next.js 16 app (frontend + API routes; backend logic lives in `src/server/`).
- **`apps/mcp-server`** — Standalone TypeScript MCP server, published to npm as `@esjn/mcp-tere-report`.

There is **no separate backend service**. All server-side logic for Tere runs inside the Next.js app.

## Root Tooling
- **Node.js**: `>=18`
- **Package manager**: `npm@10.9.2`
- **TypeScript**: `5.8.2` (root devDep)
- **Prettier**: `^3.5.3` (root devDep)
- **Workspaces**: `apps/*`

### Root scripts
- `npm run dev` → tere-project dev
- `npm run build` → tere-project build
- `npm run lint` → tere-project lint
- `npm run format` → prettier on `**/*.{ts,tsx,md}`
- `npm run mcp:build` / `mcp:start` / `mcp:release[:minor|:major]` → mcp-server

## Tere Project Stack (`apps/tere-project`, v2.0.0)

### Framework / Runtime
- **Next.js**: `16.0.8` (App Router)
- **React**: `19.2.1` / **React DOM**: `19.2.1`
- **TypeScript**: `^5`
- **ESLint**: `^9` with `eslint-config-next`

### UI / Styling
- **Tailwind CSS**: `^3.4.1` (+ `tw-animate-css`, `tailwind-merge`, `class-variance-authority`, `clsx`)
- **Ant Design**: `antd ^5.24.9`, `@ant-design/icons ^5.6.1`
- **Lucide React**: `^0.508.0`
- **Framer Motion**: `^12.23.24`
- **Recharts**: `^2.15.3` (+ `@types/recharts`)
- **TanStack Table**: `^8.21.3`
- **React Responsive**: `^10.0.1`
- **PostCSS** + **Autoprefixer**
- **Vercel Analytics**: `@vercel/analytics` — mounted via `<Analytics />` in `src/app/layout.tsx`

### State / Data
- **Zustand**: `^5.0.3` (client state)
- **TanStack React Query**: `^5.74.8` (server state)
- **Axios**: `^1.9.0`

### Backend Integrations (server-side)
- **Firebase**: `^11.6.1` (client SDK) — Firestore + Auth
- **Firebase Admin**: `^13.7.0` (server SDK)
- **Google APIs**: `googleapis ^166.0.0`
- **Jira**: REST API (no SDK dependency; calls via axios in `src/server/`)

### Auth
- Firebase Authentication (Google sign-in)
- Session enforcement via `middleware.ts` and `src/server/auth/` HOFs:
  - `with-auth.ts` — session-required wrapper
  - `with-api-key.ts` — API-key wrapper
  - `with-auth-or-api-key.ts` — either accepted
  - `with-role.ts` — role-gating

## MCP Server Stack (`apps/mcp-server`, v1.3.0)
- **Package name**: `@esjn/mcp-tere-report` (public on npm)
- **Module type**: ESM (`"type": "module"`)
- **Build**: `tsc` → `dist/`
- **SDK**: `@modelcontextprotocol/sdk ^1.29.0`
- **Validation**: `zod ^3.25.0`
- **Node**: `>=18`
- **Bin**: `mcp-tere-report` → `dist/index.js`

## Data Stores
- **Firestore collections** (accessed from `src/server/`):
  - `talent-leave` — leave records (id, name, team, dateFrom, dateTo, status, role, createdAt, updatedAt)
  - `talent` — team roster (name, team, role)
  - Plus collections for api-keys, user-access, holidays, configs, bug monitoring data, etc.
- **Cache**: in-process cache layer in `src/server/cache/`
- **Rate limiting**: `src/server/rate-limit/`

## Security
- Jira credentials and Firebase service-account keys live in env vars; never commit `.env`.
- API-key auth supported for programmatic access (used by MCP server).
- RBAC enforced via `with-role` HOF.
- Sensitive Jira data must not be exposed publicly.

## Development Workflow
- `npm run dev` for hot reload (tere-project).
- Type-check via `tsc --noEmit` (no dedicated script at root; Next.js does it during build).
- Lint: `npm run lint`.
- Format: `npm run format` (prettier).
- Tests: Jest-style `.test.tsx` files exist for some features (e.g. `sidebar.test.tsx`, `talent-leave/accessibility.test.tsx`, `talent-leave/integration.test.tsx`), but no test runner script is wired at the root — verify before assuming a `test` script exists.

## Notable Removed Tech (do NOT reintroduce without intent)
- Turborepo — not used.
- NestJS — backend was removed; do not add NestJS patterns.
- `packages/` directory — does not exist.
- Docker / Docker Compose — not currently in repo.
