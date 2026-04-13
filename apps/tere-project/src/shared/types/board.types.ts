export interface BoardEntity {
  boardId: number;
  name: string;
  shortName: string;
  isSubtaskType?: boolean;
  isKanban?: boolean;
}

export interface BoardResponse {
  id: string;
  boardId: number;
  name: string;
  shortName: string;
  isSubtaskType?: boolean;
  isKanban?: boolean;
}
