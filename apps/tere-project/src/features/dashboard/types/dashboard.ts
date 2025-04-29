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
}

export interface Dashboard {
  issues: WorkItem[];
  totalIssueProduct: number;
  totalIssueTechDebt: number;
  productPercentage: string;
  techDebtPercentage: string;
  averageProductivity: string;
}

export interface DashboardFilter {
  sprint: string;
  project: string;
}
