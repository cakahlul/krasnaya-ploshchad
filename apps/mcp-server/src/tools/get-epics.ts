import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';

export function registerGetEpics(server: McpServer) {
  server.tool(
    'get-epics',
    'Get list of epics (parent issues) for a project within a sprint or date range. Useful for understanding what features/initiatives the team is working on.',
    {
      project: z.string().describe('Jira project key (e.g., "PROJ").'),
      sprint: z.string().optional().describe('Sprint ID to filter by.'),
      startDate: z.string().optional().describe('Start date (YYYY-MM-DD).'),
      endDate: z.string().optional().describe('End date (YYYY-MM-DD).'),
    },
    async ({ project, sprint, startDate, endDate }) => {
      const result = await apiGet('/api/report/epics', {
        project,
        sprint,
        startDate,
        endDate,
      });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
