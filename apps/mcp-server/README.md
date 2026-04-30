# @esjn/mcp-tere-report

MCP (Model Context Protocol) server for accessing Tere team performance reports. Use this with Claude Code or any MCP-compatible client to query sprint reports, productivity summaries, and more.

## Setup

### 1. Get an API Key

Ask your team lead to generate an API key via the Tere dashboard (`POST /api/api-keys`).

### 2. Configure Claude Code

**Option A:** Run this command in your terminal:

```bash
claude mcp add-json tere-reports '{"type":"stdio","command":"npx","args":["-y","@esjn/mcp-tere-report"],"env":{"TERE_API_URL":"https://your-tere-app.vercel.app","TERE_API_KEY":"tere_your_api_key_here"}}'
```

Add `--scope user` to make it available globally, or `--scope project` for current project only.

**Option B:** Add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "tere-reports": {
      "command": "npx",
      "args": ["-y", "@esjn/mcp-tere-report"],
      "env": {
        "TERE_API_URL": "https://your-tere-app.vercel.app",
        "TERE_API_KEY": "tere_your_api_key_here"
      }
    }
  }
}
```

### 3. Start Using

Ask Claude things like:
- "Show me the sprint report for project PROJ sprint 123"
- "What's the current open sprint status for project PROJ?"
- "Get the productivity summary for March 2025"
- "List the epics for project PROJ this sprint"

## Available Tools

### `get-sprint-report`
Get team performance report for a specific sprint or date range.

**Parameters:**
- `project` (required) — Jira project key (e.g., "PROJ")
- `sprint` — Sprint ID (required if no date range)
- `startDate` / `endDate` — Date range in YYYY-MM-DD format
- `epicId` — Filter by epic key

### `get-open-sprint-report`
Get report for the currently active sprint.

**Parameters:**
- `project` (required) — Jira project key

### `get-epics`
List epics (parent issues) for a project.

**Parameters:**
- `project` (required) — Jira project key
- `sprint` — Sprint ID
- `startDate` / `endDate` — Date range

### `get-productivity-summary`
Get monthly productivity summary with WP and SP metrics.

**Parameters:**
- `month` (required) — Month number (1-12)
- `year` (required) — Year (e.g., 2025)
- `teams` — Comma-separated team names to filter

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TERE_API_URL` | Base URL of the Tere application (e.g., `https://your-app.vercel.app`) |
| `TERE_API_KEY` | API key for authentication (starts with `tere_`) |
