# 🚀 Krasnaya Ploshchad

**Krasnaya Ploshchad** is a monorepo using **npm workspaces**.

## 🧱 Current Architecture

This repository currently contains:

- ⚡ **apps/tere-project**: Main web app built with [Next.js](https://nextjs.org/) (Team Reporting).
- 🔌 **apps/mcp-server**: MCP server package used for MCP build/start/release workflows.

> Note: `aioc-service` is no longer part of this repository.

---

## 📦 Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-repo/krasnaya-ploshchad.git
   cd krasnaya-ploshchad
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create environment file for Tere Project:

   ```sh
   cp apps/tere-project/.env.example apps/tere-project/.env
   ```

---

## 🚀 Development

Run Tere Project in dev mode:

```sh
npm run dev
```

---

## 🛠 Scripts

From repository root:

- `npm run dev` → run `apps/tere-project` in development mode
- `npm run build` → build `apps/tere-project`
- `npm run lint` → lint `apps/tere-project`
- `npm run format` → format `*.ts`, `*.tsx`, `*.md`

MCP server scripts:

- `npm run mcp:build`
- `npm run mcp:start`
- `npm run mcp:release`
- `npm run mcp:release:minor`
- `npm run mcp:release:major`

---

## ⚙️ Tech Stack

- **Monorepo**: npm Workspaces
- **Frontend**: Next.js (`apps/tere-project`)
- **Language/Tooling**: TypeScript, Prettier

---

## 📜 License

This project is licensed under the MIT License.
