import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';
import { resolveDateRange } from '../lib/date-range-resolver.js';
import type { TalentLeaveResponseDto } from '../types/report.types.js';


export function registerGetTalentDateLeave(server: McpServer) {
  server.tool(
    'get-talent-date-leave',
    'Get talent leave records for an exact date or date window with the same natural-language date support as get-talent-leave.',
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

      const dates = result.flatMap(record =>
        record.leaveDate.map(leave => ({
          memberId: record.memberId,
          name: record.name,
          team: record.team,
          dateFrom: leave.dateFrom,
          dateTo: leave.dateTo,
          status: leave.status,
        })),
      );

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ range, dates }, null, 2) }],
      };
    },
  );
}
