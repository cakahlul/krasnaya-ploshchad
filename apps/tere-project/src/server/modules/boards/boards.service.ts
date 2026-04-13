import { boardsRepository, BoardsRepository } from './boards.repository';
import type { BoardResponse } from '@shared/types/board.types';

class BoardsService {
  constructor(private readonly repository: BoardsRepository) {}

  async findAll(): Promise<BoardResponse[]> {
    const entities = await this.repository.findAll();
    return entities.map(e => ({
      id: e.id,
      boardId: e.boardId,
      name: e.name,
      shortName: e.shortName,
      isSubtaskType: e.isSubtaskType,
      isKanban: e.isKanban,
    }));
  }

  async getBoardIds(): Promise<number[]> {
    const boards = await this.repository.findAll();
    return boards.filter(b => !b.isKanban).map(b => b.boardId);
  }

  async getBoardIdByShortName(shortName: string): Promise<number | null> {
    const boards = await this.repository.findAll();
    return boards.find(b => b.shortName === shortName)?.boardId ?? null;
  }

  async hasSubtaskType(project: string): Promise<boolean> {
    const boards = await this.repository.findAll();
    const projectList = project.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
    return boards.some(b => projectList.includes(b.shortName.toLowerCase()) && b.isSubtaskType === true);
  }

  async getAbadiShortNames(): Promise<string[]> {
    const boards = await this.repository.findAll();
    return boards
      .filter(b => b.name.startsWith('ABADI -'))
      .map(b => b.shortName);
  }
}

export const boardsService = new BoardsService(boardsRepository);
