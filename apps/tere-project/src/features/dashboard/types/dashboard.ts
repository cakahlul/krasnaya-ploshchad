export interface WorkItem {
  member: string;
  team: string;
  /** SP-based productivity: (SP Total / (Working Days × 8)) × 100% */
  productivityRate: string;
  /** WP-based productivity: (Total WP / Target WP) × 100% */
  wpProductivity: string;
  devDefect: number;
  devDefectRate: string;
  totalWeightPoints: number;
  weightPointsProduct: number;
  weightPointsTechDebt: number;
  targetWeightPoints: number;
  issueKeys: string[];
  workingDays?: number;
  wpToHours?: number;
  spProduct?: number;
  spTechDebt?: number;
  /** Direct Story Points from meeting tickets (ALL-Meeting prefix). Not converted via WP. */
  spMeeting?: number;
  spTotal?: number;
  plannedWP?: number;
  leaveDays?: number;
  sickDays?: number;
}

export interface DashboardDto {
  issues: WorkItem[];
  totalWeightPointsProduct: number;
  totalWeightPointsTechDebt: number;
  productPercentage: string;
  techDebtPercentage: string;
  averageProductivity: string;
  totalWorkingDays?: number;
  averageWorkingDays?: number;
  averageWpPerHour?: number;
  totalWeightPoints?: number;
  totalSP?: number;
  targetSP?: number;
  spProductPercentage?: string;
  spTechDebtPercentage?: string;
  spMeetingPercentage?: string;
  totalLeave?: number;
  totalSick?: number;
  totalMemberWorkingDays?: number;
  sprintStartDate?: string;
  sprintEndDate?: string;
}

export interface DashhboardEntity {
  workItems: WorkItem[];
  totalWeightPointsProduct: number;
  totalWeightPointsTechDebt: number;
  productPercentage: string;
  techDebtPercentage: string;
  averageProductivity: string;
  totalWorkingDays?: number;
  averageWorkingDays?: number;
  averageWpPerHour?: number;
  totalWeightPoints?: number;
  totalSP?: number;
  targetSP?: number;
  spProductPercentage?: string;
  spTechDebtPercentage?: string;
  spMeetingPercentage?: string;
  totalLeave?: number;
  totalSick?: number;
  totalMemberWorkingDays?: number;
  sprintStartDate?: string;
  sprintEndDate?: string;
}

export interface DashboardFilter {
  sprint: string;
  project: string;
  startDate?: string;  // YYYY-MM-DD format
  endDate?: string;    // YYYY-MM-DD format
  epicId?: string[];
}

export interface EpicDto {
  id: string;
  key: string;
  name: string;
  summary: string;
  status?: string;
}

export interface SprintDto {
  id: number;
  self: string;
  state: string;
  name: string;
  startDate: string;
  endDate: string;
  completeDate: string;
  createdDate: string;
  originBoardId: number;
  boardId?: number;  // Added for multi-team sprint grouping
  goal: string;
}
