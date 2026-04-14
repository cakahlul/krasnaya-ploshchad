export interface BoardEntity {
  boardId: number;
  name: string;
  shortName: string;
  isSubtaskType?: boolean;
  isKanban?: boolean;
  isShowPlannedWP?: boolean;
  isBugMonitoring?: boolean;
  bugIssueType?: string;
}

export interface BoardResponse {
  id: string;
  boardId: number;
  name: string;
  shortName: string;
  isSubtaskType?: boolean;
  isKanban?: boolean;
  isShowPlannedWP?: boolean;
  isBugMonitoring?: boolean;
  bugIssueType?: string;
}
