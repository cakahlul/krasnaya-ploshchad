import { Level } from 'src/shared/enums/level.enum';
import { JiraFieldEntity } from './report.entity';

export interface JiraSearchRequestDto {
  sprint: string;
  assignees: string[];
  project: string;
}

export interface JiraIssueReportResponseDto {
  member: string;
  productivityRate: string;
  devDefect: number;
  devDefectRate: string;
  totalWeightPoints: number;
  level: Level;
  weightPointsProduct: number;
  weightPointsTechDebt: number;
  targetWeightPoints: number; // Target WP based on level (junior=56, medior=68, senior/IC=80)
  issueKeys: string[]; // JIRA issue keys worked on by this member (for lazy-loading details)
  workingDays?: number; // Working days available for this member during sprint
  wpToHours?: number; // Weight points to hours ratio (totalWeightPoints / targetStoryPoints where target = workingDays * 8)
  epic?: EpicDto | null;
}

export interface EpicDto {
  id: string; // Epic Key (e.g., 'SLS-123')
  key: string;
  name: string;
  summary: string;
}

export interface GetReportResponseDto {
  issues: JiraIssueReportResponseDto[];
  totalWeightPointsProduct: number; // Sum of all members' weightPointsProduct
  totalWeightPointsTechDebt: number; // Sum of all members' weightPointsTechDebt
  productPercentage: string;
  techDebtPercentage: string;
  averageProductivity: string;
  totalWorkingDays?: number; // Total working days in the sprint (excluding weekends and holidays)
  averageWorkingDays?: number; // Average working days per team member
  averageWpPerHour?: number; // Average WP per hour across all team members
  totalWeightPoints?: number; // Total weight points for all team members in the sprint
  sprintStartDate?: string; // Sprint or date range start date
  sprintEndDate?: string; // Sprint or date range end date
  sprintName?: string; // Sprint name (used by dashboard summary)
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
