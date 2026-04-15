import { firestore } from '@server/lib/firebase-admin';
import type { BoardEntity } from '@shared/types/board.types';

const COLLECTION = 'boards';

function mapDocToEntity(id: string, data: FirebaseFirestore.DocumentData): BoardEntity & { id: string } {
  return {
    id,
    boardId: data.boardId as number,
    name: data.name as string,
    shortName: data.shortName as string,
    isSubtaskType: data.isSubtaskType === true,
    isKanban: data.isKanban === true,
    isShowPlannedWP: data.isShowPlannedWP === true,
    isBugMonitoring: data.isBugMonitoring === true,
    bugIssueType: (data.bugIssueType as string) || undefined,
    isStoryGrouping: data.isStoryGrouping === true,
  };
}

export class BoardsRepository {
  async findAll(): Promise<(BoardEntity & { id: string })[]> {
    const snapshot = await firestore.collection(COLLECTION).orderBy('name').get();
    return snapshot.docs.map(doc => mapDocToEntity(doc.id, doc.data()));
  }
}

export const boardsRepository = new BoardsRepository();
