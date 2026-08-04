import { boardsRepository, BoardsRepository } from './boards.repository';
import type { BoardResponse } from '@shared/types/board.types';
import { MemoryCache } from '@server/lib/cache';

const CACHE_KEY = 'all_boards';

export class BoardsService {
  private cache = new MemoryCache(60 * 60 * 1000); // 60 minutes

  constructor(private readonly repository: Pick<BoardsRepository, 'findAll'>) {}

  async findAll(): Promise<BoardResponse[]> {
    return this.cache.getOrLoad(CACHE_KEY, async () => {
      const entities = await this.repository.findAll();
      return entities.map(e => ({
        id: e.id,
        boardId: e.boardId,
        name: e.name,
        shortName: e.shortName,
        isSubtaskType: e.isSubtaskType,
        isKanban: e.isKanban,
        isShowPlannedWP: e.isShowPlannedWP,
        isBugMonitoring: e.isBugMonitoring,
        bugIssueType: e.bugIssueType,
        bugJql: e.bugJql,
        isStoryGrouping: e.isStoryGrouping,
        kanbanCycleStartDate: e.kanbanCycleStartDate,
        reportingGroup: e.reportingGroup,
        reportingBoardLeadEmail: e.reportingBoardLeadEmail,
      }));
    });
  }

  async getBoardIds(): Promise<number[]> {
    const boards = await this.findAll();
    return boards.filter(b => !b.isKanban).map(b => b.boardId);
  }

  async getBoardIdByShortName(shortName: string): Promise<number | null> {
    const boards = await this.findAll();
    return boards.find(b => b.shortName === shortName)?.boardId ?? null;
  }

  async hasSubtaskType(project: string): Promise<boolean> {
    const boards = await this.findAll();
    const projectList = project
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(Boolean);
    return boards.some(
      b =>
        projectList.includes(b.shortName.toLowerCase()) &&
        b.isSubtaskType === true,
    );
  }

  invalidateCache(): void {
    this.cache.invalidate();
  }
}

export const boardsService = new BoardsService(boardsRepository);
