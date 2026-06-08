import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';
import { resolveDateRange } from '../lib/date-range-resolver.js';
import type { TalentLeaveResponseDto } from '../types/report.types.js';


export function registerGetTalentLeave(server: McpServer) {
  server.tool(
    'get-talent-leave',
    'Get talent leave records for a date window. Accepts natural language like today, yesterday, tomorrow, this week, next week, last week, or YYYY-MM-DD ranges.',
    {
      date: z.string().optional().describe('Date expression or date range. Defaults to today.'),
      team: z.string().optional().describe('Filter by team name.'),
      status: z.enum(['Leave', 'Sick']).optional().describe('Filter by leave status.'),
    },
    async ({ date, team, status }) => {
      const range = resolveDateRange(date);
      const result = await apiGet<TalentLeaveResponseDto[]>('/api/talent-leave', {
        startDate: range.startDate,
        endDate: range.endDate,
        team,
        status,
      });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ range, result }, null, 2) }],
      };
    },
  );
}
