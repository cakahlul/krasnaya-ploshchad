import { Level } from './common.types';

// ── Jira API raw shapes ──────────────────────────────────────────────────────

interface JiraCustomFieldEntity {
  self: string;
  value: string;
  id: string;
}

export interface JiraAssigneeEntity {
  self: string;
  accountId: string;
  emailAddress: string;
  displayName: string;
  active: boolean;
  timeZone: string;
  accountType: string;
}

export interface JiraIssueTypeEntity {
  self: string;
  id: string;
  description: string;
  name: string;
}

export interface JiraParentEntity {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    priority: { name: string; id: string };
    status: { name: string; id: string };
    issuetype: { id: string; description: string; name: string; subtask: boolean; hierarchyLevel: number };
  };
}

export interface JiraFieldEntity {
  summary: string;
  customfield_10005: number;
  customfield_10865: JiraCustomFieldEntity;
  assignee: JiraAssigneeEntity;
  customfield_10796: JiraCustomFieldEntity;
  customfield_11015: JiraCustomFieldEntity;
  customfield_11444: JiraCustomFieldEntity;
  customfield_11312: JiraCustomFieldEntity;
  customfield_11543: JiraCustomFieldEntity[];
  issuetype: JiraIssueTypeEntity;
  created?: string;
  resolutiondate?: string;
  resolution?: { name: string };
  parent?: JiraParentEntity;
}

export interface JiraIssueEntity {
  id: string;
  key: string;
  summary: string;
  fields: JiraFieldEntity;
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

// ── Report DTOs ──────────────────────────────────────────────────────────────

export interface JiraSearchRequestDto {
  sprint: string;
  assignees: string[];
  project: string;
}

export interface EpicDto {
  id: string;
  key: string;
  name: string;
  summary: string;
}

export interface JiraIssueReportResponseDto {
  member: string;
  team: string;
  productivityRate: string;
  devDefect: number;
  devDefectRate: string;
  totalWeightPoints: number;
  level: Level;
  weightPointsProduct: number;
  weightPointsTechDebt: number;
  targetWeightPoints: number;
  issueKeys: string[];
  workingDays?: number;
  wpToHours?: number;
  spProduct?: number;
  spTechDebt?: number;
  spTotal?: number;
  epic?: EpicDto | null;
}

export interface GetReportResponseDto {
  issues: JiraIssueReportResponseDto[];
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
  sprintName?: string;
}
