import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';
import { resolveSprintIds, isSprintId } from '../lib/sprint-resolver.js';

export function registerGetSprintReport(server: McpServer) {
  server.tool(
    'get-sprint-report',
    'Get team performance report for a specific sprint or date range. Returns per-member metrics including weight points, story points, productivity rate, defect rate, working days, and leave days.',
    {
      project: z.string().describe('Jira project key (e.g., "PROJ"). Comma-separated for multiple projects.'),
      sprint: z.string().optional().describe('Sprint name (e.g., "Sprint 25") or sprint ID. Required if startDate/endDate not provided.'),
      startDate: z.string().optional().describe('Start date (YYYY-MM-DD). Use with endDate instead of sprint.'),
      endDate: z.string().optional().describe('End date (YYYY-MM-DD). Use with startDate instead of sprint.'),
      epicId: z.string().optional().describe('Filter by epic key. Comma-separated for multiple epics.'),
    },
    async ({ project, sprint, startDate, endDate, epicId }) => {
      let sprintId = sprint;
      if (sprint && !isSprintId(sprint)) {
        sprintId = await resolveSprintIds(sprint);
      }

      const result = await apiGet('/api/report', {
        project,
        sprint: sprintId,
        startDate,
        endDate,
        epicId,
      });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
