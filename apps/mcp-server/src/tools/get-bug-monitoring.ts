import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';

export function registerGetBugMonitoring(server: McpServer) {
  server.tool(
    'get-bug-monitoring',
    'Get the Tere bug-monitoring summary or issue list for a board.',
    {
      boardId: z.number().int().positive().describe('Bug-monitoring board ID.'),
      detail: z.boolean().optional().describe('Return the issue list instead of the aggregate summary.'),
    },
    async ({ boardId, detail }) => {
      const result = await apiGet<unknown>(detail ? '/api/bug-monitoring/bugs' : '/api/bug-monitoring/summary', { boardId: String(boardId) });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );
}
