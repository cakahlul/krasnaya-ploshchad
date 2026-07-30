import type { ReportingBoardConfiguration } from './reporting-group.types';

export interface BoardEntity {
  boardId: number;
  name: string;
  shortName: string;
  isSubtaskType?: boolean;
  isKanban?: boolean;
  isShowPlannedWP?: boolean;
  isBugMonitoring?: boolean;
  bugIssueType?: string;
  bugJql?: string;
  isStoryGrouping?: boolean;
  kanbanCycleStartDate?: string | null;
  reportingGroup?: ReportingBoardConfiguration['reportingGroup'];
  reportingBoardLeadEmail?: ReportingBoardConfiguration['reportingBoardLeadEmail'];
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
  bugJql?: string;
  isStoryGrouping?: boolean;
  kanbanCycleStartDate?: string | null;
  reportingGroup?: ReportingBoardConfiguration['reportingGroup'];
  reportingBoardLeadEmail?: ReportingBoardConfiguration['reportingBoardLeadEmail'];
}
