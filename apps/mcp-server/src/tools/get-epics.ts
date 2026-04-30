import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';
import { resolveSprintIds, isSprintId } from '../lib/sprint-resolver.js';

export function registerGetEpics(server: McpServer) {
  server.tool(
    'get-epics',
    'Get list of epics (parent issues) for a project within a sprint or date range. Useful for understanding what features/initiatives the team is working on.',
    {
      project: z.string().describe('Jira project key (e.g., "PROJ").'),
      sprint: z.string().optional().describe('Sprint name (e.g., "Sprint 25") or sprint ID.'),
      startDate: z.string().optional().describe('Start date (YYYY-MM-DD).'),
      endDate: z.string().optional().describe('End date (YYYY-MM-DD).'),
    },
    async ({ project, sprint, startDate, endDate }) => {
      let sprintId = sprint;
      if (sprint && !isSprintId(sprint)) {
        sprintId = await resolveSprintIds(sprint);
      }

      const result = await apiGet('/api/report/epics', {
        project,
        sprint: sprintId,
        startDate,
        endDate,
      });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
