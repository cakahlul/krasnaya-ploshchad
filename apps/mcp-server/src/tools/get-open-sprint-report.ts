import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';

export function registerGetOpenSprintReport(server: McpServer) {
  server.tool(
    'get-open-sprint-report',
    'Get team performance report for the currently active/open sprint. Returns the same metrics as get-sprint-report but automatically targets the active sprint.',
    {
      project: z.string().describe('Jira project key (e.g., "PROJ").'),
    },
    async ({ project }) => {
      const result = await apiGet('/api/report/all', { project });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
