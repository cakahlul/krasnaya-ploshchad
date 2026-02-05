export interface WorkItem {
  member: string;
  productPoint: number;
  techDebtPoint: number;
  totalPoint: number;
  productivityRate: string;
  averageComplexity: string;
  devDefect: number;
  devDefectRate: string;
  totalWeightPoints: number;
  weightPointsProduct: number;
  weightPointsTechDebt: number;
  workingDays?: number;
  wpToHours?: number;
}

export interface DashboardDto {
  issues: WorkItem[];
  totalIssueProduct: number;
  totalIssueTechDebt: number;
  productPercentage: string;
  techDebtPercentage: string;
  averageProductivity: string;
  totalWorkingDays?: number;
  averageWorkingDays?: number;
  averageWpPerHour?: number;
  totalWeightPoints?: number;
}

export interface DashhboardEntity {
  workItems: WorkItem[];
  productTask: number;
  techDebtTask: number;
  productPercentage: string;
  techDebtPercentage: string;
  averageProductivity: string;
  totalWorkingDays?: number;
  averageWorkingDays?: number;
  averageWpPerHour?: number;
  totalWeightPoints?: number;
}

export interface DashboardFilter {
  sprint: string;
  project: string;
  startDate?: string;  // YYYY-MM-DD format
  endDate?: string;    // YYYY-MM-DD format
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
  goal: string;
}
