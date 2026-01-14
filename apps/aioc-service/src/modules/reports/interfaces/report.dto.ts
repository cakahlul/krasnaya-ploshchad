import { Level } from 'src/shared/enums/level.enum';
import { JiraFieldEntity } from './report.entity';

export interface JiraSearchRequestDto {
  sprint: string;
  assignees: string[];
  project: string;
}

export interface JiraIssueReportResponseDto {
  member: string;
  productPoint: number;
  techDebtPoint: number;
  totalPoint: number;
  productivityRate: string;
  averageComplexity: string;
  devDefect: number;
  devDefectRate: string;
  totalWeightPoints: number;
  level: Level;
  weightPointsProduct: number;
  weightPointsTechDebt: number;
  workingDays?: number; // Working days available for this member during sprint
}

export interface GetReportResponseDto {
  issues: JiraIssueReportResponseDto[];
  totalIssueProduct: number;
  totalIssueTechDebt: number;
  productPercentage: string;
  techDebtPercentage: string;
  averageProductivity: string;
  totalWorkingDays?: number; // Total working days across all team members
  averageWorkingDays?: number; // Average working days per team member
}

export interface JiraSearchResponseDto {
  isLast: boolean;
  nextPageToken?: string;
  issues: JiraIssueDto[];
}

export interface JiraIssueDto {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: JiraFieldEntity;
}
