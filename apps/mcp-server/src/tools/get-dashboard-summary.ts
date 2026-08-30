import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';

export function registerGetDashboardSummary(server: McpServer) {
  server.tool(
    'get-dashboard-summary',
    'Get the Tere dashboard team summary for a date range. The API key sees the same board access as its creator.',
    {
      startDate: z.string().optional().describe('Start date (YYYY-MM-DD).'),
      endDate: z.string().optional().describe('End date (YYYY-MM-DD).'),
    },
    async ({ startDate, endDate }) => {
      const result = await apiGet<unknown>('/api/dashboard/summary', { startDate, endDate });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
