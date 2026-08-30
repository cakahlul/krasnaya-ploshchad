import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';
import { isSprintId, resolveSprintIds } from '../lib/sprint-resolver.js';

export function registerGetSprintTrend(server: McpServer) {
  server.tool(
    'get-sprint-trend',
    'Compare team performance across sprints. Returns the same sprint-trend data shown in the Tere dashboard, including source metadata for captured and live reports.',
    {
      project: z.string().describe('Jira project key (e.g., "PROJ").'),
      sprints: z.string().describe('Comma-separated sprint names or IDs (e.g., "Sprint 25,Sprint 26" or "123,124").'),
    },
    async ({ project, sprints }) => {
      const sprintIds = isSprintId(sprints) ? sprints : await resolveSprintIds(sprints);
      const result = await apiGet<unknown>('/api/report/sprint-trend', { project, sprints: sprintIds });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
