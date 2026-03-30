export interface TeamSummaryDto {
  teamName: string;
  boardId: number;
  sprintName: string | null;
  sprintState: string | null;
  averageProductivity: string | null;
  averageWpPerHour: number | null;
  teamMembers: number;
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
  ds: TeamSummaryDto;
  sls: TeamSummaryDto;
  bugs?: BugSummaryDto;
  generatedAt: string;
}
