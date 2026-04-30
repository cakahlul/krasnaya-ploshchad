import { apiGet } from './api-client.js';

interface Board {
  boardId: number;
  shortName: string;
  [key: string]: unknown;
}

interface Sprint {
  id: number;
  name: string;
  state: string;
  startDate: string;
  endDate: string;
  boardId: number;
}

/**
 * Resolves sprint name(s) to sprint ID(s).
 * Fetches all boards, then all sprints, and matches by name (case-insensitive).
 * Returns comma-separated sprint IDs.
 */
export async function resolveSprintIds(sprintName: string): Promise<string> {
  const boards = await apiGet<Board[]>('/api/boards', {});
  const boardIds = boards.map(b => b.boardId).filter(Boolean);

  if (boardIds.length === 0) {
    throw new Error('No boards found. Cannot resolve sprint name.');
  }

  const sprints = await apiGet<Sprint[]>('/api/project/sprint/batch', {
    boardIds: boardIds.join(','),
  });

  const names = sprintName.split(',').map(n => n.trim().toLowerCase());
  const matched = sprints.filter(s =>
    names.some(n => s.name.toLowerCase().includes(n)),
  );

  if (matched.length === 0) {
    const available = [...new Set(sprints.map(s => s.name))].slice(0, 20);
    throw new Error(
      `No sprint found matching "${sprintName}". Available sprints: ${available.join(', ')}`,
    );
  }

  // Deduplicate by sprint ID (same sprint can appear from multiple boards)
  const uniqueIds = [...new Set(matched.map(s => String(s.id)))];
  return uniqueIds.join(',');
}

/**
 * Checks if a value looks like a sprint ID (numeric) or a sprint name.
 */
export function isSprintId(value: string): boolean {
  return value.split(',').every(v => /^\d+$/.test(v.trim()));
}
