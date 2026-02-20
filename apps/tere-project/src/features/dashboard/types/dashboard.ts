export interface WorkItem {
  member: string;
  productivityRate: string;
  devDefect: number;
  devDefectRate: string;
  totalWeightPoints: number;
  weightPointsProduct: number;
  weightPointsTechDebt: number;
  targetWeightPoints: number;
  issueKeys: string[];
  workingDays?: number;
  wpToHours?: number;
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
