import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';

export function registerGetProductivitySummary(server: McpServer) {
  server.tool(
    'get-productivity-summary',
    'Get monthly productivity summary for the team. Returns aggregated metrics including total/average WP produced vs expected, SP breakdown, and per-member productivity details.',
    {
      month: z.number().min(1).max(12).describe('Month number (1-12).'),
      year: z.number().min(2020).describe('Year (e.g., 2025).'),
      teams: z.string().optional().describe('Filter by team names, comma-separated (e.g., "TeamA,TeamB").'),
    },
    async ({ month, year, teams }) => {
      const result = await apiGet('/api/report/productivity-summary', {
        month: String(month),
        year: String(year),
        teams,
      });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
