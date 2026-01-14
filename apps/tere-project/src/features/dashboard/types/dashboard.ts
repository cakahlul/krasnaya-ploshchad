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
}

export interface DashboardFilter {
  sprint: string;
  project: string;
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
