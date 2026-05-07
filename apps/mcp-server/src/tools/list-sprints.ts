import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from '../lib/api-client.js';
import type { SprintDto } from '../types/report.types.js';

interface Board {
  boardId: number;
  shortName: string;
}

interface RawSprint {
  id: number;
  name: string;
  state: string;
  startDate: string;
  endDate: string;
  boardId: number;
}

export function registerListSprints(server: McpServer) {
  server.tool(
    'list-sprints',
    'List available sprints. Use this to find sprint names before querying reports. Returns sprint name, ID, state (active/closed), and dates.',
    {
      project: z.string().optional().describe('Filter by project key (e.g., "SLS"). If omitted, returns sprints from all boards.'),
      state: z.enum(['active', 'closed', 'all']).optional().describe('Filter by sprint state. Defaults to "all".'),
    },
    async ({ project, state }) => {
      const boards = await apiGet<Board[]>('/api/boards', {});
      let filteredBoards = boards;

      if (project) {
        const projectLower = project.toLowerCase();
        filteredBoards = boards.filter(b => b.shortName.toLowerCase() === projectLower);
        if (filteredBoards.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No board found for project "${project}". Available projects: ${boards.map(b => b.shortName).join(', ')}`,
              },
            ],
          };
        }
      }

      const boardIds = filteredBoards.map(b => b.boardId).filter(Boolean);
      const sprints = await apiGet<RawSprint[]>('/api/project/sprint/batch', {
        boardIds: boardIds.join(','),
      });

      let result = sprints;
      if (state && state !== 'all') {
        result = sprints.filter(s => s.state === state);
      }

      // Sort: active first, then by startDate descending (newest first)
      result.sort((a, b) => {
        if (a.state === 'active' && b.state !== 'active') return -1;
        if (b.state === 'active' && a.state !== 'active') return 1;
        return (b.startDate || '').localeCompare(a.startDate || '');
      });

      const formatted: SprintDto[] = result.map(s => ({
        id: s.id,
        name: s.name,
        state: s.state,
        startDate: s.startDate?.split('T')[0] ?? '',
        endDate: s.endDate?.split('T')[0] ?? '',
        boardId: s.boardId,
      }));

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(formatted, null, 2) }],
      };
    },
  );
}
