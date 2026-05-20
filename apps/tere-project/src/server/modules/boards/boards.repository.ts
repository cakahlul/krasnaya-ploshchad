import { db } from '@server/lib/db';
import { boards } from '@server/db/schema';
import type { BoardEntity } from '@shared/types/board.types';

type Row = typeof boards.$inferSelect;

function rowToEntity(row: Row): BoardEntity & { id: string } {
  return {
    id: row.id,
    boardId: row.boardId,
    name: row.name,
    shortName: row.shortName,
    isSubtaskType: row.isSubtaskType,
    isKanban: row.isKanban,
    isShowPlannedWP: row.isShowPlannedWP,
    isBugMonitoring: row.isBugMonitoring,
    bugIssueType: row.bugIssueType ?? undefined,
    isStoryGrouping: row.isStoryGrouping,
  };
}

export class BoardsRepository {
  async findAll(): Promise<(BoardEntity & { id: string })[]> {
    const rows = await db.select().from(boards).orderBy(boards.name);
    return rows.map(rowToEntity);
  }
}

export const boardsRepository = new BoardsRepository();
