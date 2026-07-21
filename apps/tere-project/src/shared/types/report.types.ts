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

export interface JiraStatusEntity {
  name: string;
  statusCategory?: {
    key?: string;
    name?: string;
    colorName?: string;
  };
}

export interface JiraFieldEntity {
  summary: string;
  customfield_10005?: number;
  customfield_10865: JiraCustomFieldEntity;
  assignee: JiraAssigneeEntity;
  customfield_10796: JiraCustomFieldEntity;
  customfield_11015: JiraCustomFieldEntity;
  customfield_11444: JiraCustomFieldEntity;
  customfield_11312: JiraCustomFieldEntity;
  customfield_11543: JiraCustomFieldEntity[];
  /** Sprint field: array of sprint objects, chronological (Jira appends). */
  customfield_10020?: Array<{ name?: string; state?: string }>;
  issuetype: JiraIssueTypeEntity;
  created?: string;
  updated?: string;
  resolutiondate?: string;
  resolution?: { name: string };
  status?: JiraStatusEntity;
  /** ADF document (Atlassian Document Format) or plain string; sanitized to text before exposure. */
  description?: unknown;
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
  isSubtaskType?: boolean;
  isShowPlannedWP?: boolean;
}

export interface EpicDto {
  id: string;
  key: string;
  name: string;
  summary: string;
  status?: string;
}

export interface EpicBreakdownDto {
  productivityRate: string;
  wpProductivity: string;
  devDefect: number;
  devDefectRate: string;
  totalWeightPoints: number;
  weightPointsProduct: number;
  weightPointsTechDebt: number;
  issueKeys: string[];
  wpToHours?: number;
  spProduct?: number;
  spTechDebt?: number;
  spMeeting?: number;
  spTotal?: number;
}

export interface JiraIssueReportResponseDto {
  member: string;
  team: string;
  /** SP-based productivity: (SP Total / (Working Days × 8)) × 100% */
  productivityRate: string;
  /** WP-based productivity: (Total WP / Target WP) × 100% */
  wpProductivity: string;
  devDefect: number;
  devDefectRate: string;
  totalWeightPoints: number;
  level: Level;
  weightPointsProduct: number;
  weightPointsTechDebt: number;
  targetWeightPoints: number;
  issueKeys: string[];
  /**
   * Unique epic/parent keys associated with this member's issues.
   * Populated during report generation for client-side epic filtering.
   * Value 'null' (string) indicates issues with no parent epic.
   */
  epicKeys?: string[];
  epicBreakdown?: Record<string, EpicBreakdownDto>;
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
  epic?: EpicDto | null;
}

export interface SprintTrendTeamMetricsDto {
  team: string;
  velocity: number;
  targetWP: number;
  wpAttainment: number;
  totalSP: number;
  targetSP: number;
  spVelocity: number;
  activeMembers: number;
}

export interface SprintTrendPointDto {
  sprintId: string;
  sprintStartDate?: string;
  sprintEndDate?: string;
  teams: SprintTrendTeamMetricsDto[];
}

export interface SprintSlowdownAlertDto {
  team: string;
  consecutiveDeclines: number;
  declinePercent: number;
  latestVelocity: number;
  baselineVelocity: number;
}

export interface SprintTrendResponseDto {
  points: SprintTrendPointDto[];
  slowdownAlerts: SprintSlowdownAlertDto[];
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
  sprintName?: string;
  sprintId?: number;
}

// ── Epic Explorer (SLS-16795 / Epic SLS-16789) ───────────────────────────────
// Canonical FE/BE contract for the Epic Explorer feature. FE imports from here.

/** GET /api/report/epics?project=KEY (no sprint/date) → 200 ExplorerEpicListItem[] */
export interface ExplorerEpicListItem {
  key: string;
  summary: string;
  /** Jira status name, e.g. "In Progress". */
  status: string;
  /** Jira status category NAME: 'To Do' | 'In Progress' | 'Done'. */
  statusCategory: string;
}

/** Epic header info for the detail response (description already sanitized to plain text). */
export interface ExplorerEpicInfo {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  assignee: string | null;
  /** Plain text only — ADF sanitized server-side, never HTML. */
  description: string | null;
  created: string | null;
  updated: string | null;
}

/** 'product' | 'techDebt' — derived from the issue categorizer. */
export type ExplorerCategory = 'product' | 'techDebt';

/** A descendant issue under the epic (whole hierarchy). */
export interface ExplorerDescendant {
  key: string;
  summary: string;
  issueType: string;
  status: string;
  statusCategory: string;
  assignee: string | null;
  assigneeAccountId: string | null;
  /** Direct parent issue key (epic key for top-level children). */
  parentKey: string | null;
  /** Appendix WP level 'Very Low'|'Low'|'Medium'|'High', or null (meeting / no data). */
  appendixLevel: string | null;
  category: ExplorerCategory;
  /** Weight Points for this issue (meeting tickets contribute 0). */
  weightPoint: number;
  isMeeting: boolean;
  /** Raw Jira Story Points; null = N/A (unassigned or non-roster assignee, or no SP field). */
  storyPoint: number | null;
  /** Meeting Story Points (from ALL-Meeting appendix). */
  spMeeting: number;
  isDefect: boolean;
  /** true when the issue has no WP appendix data (customfield_11543 empty). */
  missingMetricData: boolean;
  /** Active sprint name; null = "No Sprint". Resolution: active state, else last element, else null. */
  sprint: string | null;
  /** ISO 8601, passthrough of Jira fields.updated ('' if absent). */
  updatedAt: string;
}

/** Weight Point roll-up (numeric legs, 0 allowed). */
export interface ExplorerWeightPoint {
  product: number;
  techDebt: number;
  total: number;
}

/** Story Point roll-up; any leg null = N/A (no attributable data). */
export interface ExplorerStoryPoint {
  product: number | null;
  techDebt: number | null;
  meeting: number | null;
  total: number | null;
}

export interface ExplorerStatusCounts {
  toDo: number;
  inProgress: number;
  done: number;
}

export interface ExplorerCompletionByCount {
  done: number;
  total: number;
  percent: number;
}

export interface ExplorerComposition {
  productPercent: number;
  techDebtPercent: number;
}

export interface ExplorerCoverage {
  withMetricData: number;
  total: number;
}

/** Aggregate metrics for the epic's (accessible) descendant tree. */
export interface ExplorerMetrics {
  statusCounts: ExplorerStatusCounts;
  completionByCount: ExplorerCompletionByCount;
  weightPoint: ExplorerWeightPoint;
  storyPoint: ExplorerStoryPoint;
  composition: ExplorerComposition;
  defectCount: number;
  coverage: ExplorerCoverage;
  missingMetricCount: number;
  /** Keys of descendants missing WP appendix data. */
  missingMetricData: string[];
}

/** Visibility info: descendants hidden because caller can't access their project. */
export interface ExplorerAuthz {
  hiddenCount: number;
  totalFetched: number;
}

/** WP weight config applied when computing the metrics. */
export interface ExplorerWpConfig {
  effectiveDate: string;
  weights: Record<string, number>;
}

/** GET /api/report/epics/[key]?project=KEY → 200 */
export interface EpicDetailResponse {
  epic: ExplorerEpicInfo;
  descendants: ExplorerDescendant[];
  metrics: ExplorerMetrics;
  authz: ExplorerAuthz;
  wpConfig: ExplorerWpConfig;
}

/** Error body for both Epic Explorer endpoints. */
export interface ExplorerErrorBody {
  message: string;
}
