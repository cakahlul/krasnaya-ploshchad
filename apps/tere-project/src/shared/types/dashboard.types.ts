export interface MemberSummaryDto {
  name: string;
  wpProductivity: string;
  totalWeightPoints: number;
  targetWeightPoints: number;
  spTotal: number;
}

export interface TeamSummaryDto {
  teamName: string;
  boardId: number;
  sprintName: string | null;
  sprintState: string | null;
  sprintStartDate: string | null;
  sprintEndDate: string | null;
  averageProductivity: string | null;
  averageWpPerHour: number | null;
  teamMembers: number;
  memberSummaries: MemberSummaryDto[];
  totalEpics: number;
  isStoryGrouping: boolean;
  productPercentage: string | null;
  techDebtPercentage: string | null;
  totalWorkingDays: number | null;
  totalWorkItems: number;
  closedWorkItems: number;
  averageHoursOpen: number | null;
}

export interface BugSummaryDto {
  totalBugs: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  averageDaysOpen: number;
}

export interface DashboardSummaryResponseDto {
  teams: TeamSummaryDto[];
  bugs?: BugSummaryDto;
  generatedAt: string;
}
