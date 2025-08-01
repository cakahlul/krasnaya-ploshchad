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
}

export interface GetReportResponseDto {
  issues: JiraIssueReportResponseDto[];
  totalIssueProduct: number;
  totalIssueTechDebt: number;
  productPercentage: string;
  techDebtPercentage: string;
  averageProductivity: string;
}

export interface JiraSearchResponseDto {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssueDto[];
}

export interface JiraIssueDto {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: JiraFieldEntity;
}
