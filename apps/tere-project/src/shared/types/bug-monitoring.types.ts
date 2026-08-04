export interface Bug {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee: string | null;
  created: string;
  updated: string;
  /**
   * `YYYY-MM-DD` the bug actually closed, or null while it is still open. Sourced from Jira's
   * `resolutiondate` unless `bug_close_override` holds a row for this key, in which case the
   * override already replaced it inside the repository — see `applyCloseOverrides`.
   */
  closedDate: string | null;
  daysOpen: number;
}

export interface BugsByStatus {
  status: string;
  bugs: Bug[];
  count: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
}

export interface BugStatistics {
  totalCount: number;
  countByStatus: Record<string, number>;
  priorityDistribution: PriorityDistribution[];
  averageDaysOpen: number;
  assigneeDistribution: Record<string, number>;
}

export interface BugMonitoringData {
  bugsByStatus: BugsByStatus[];
  statistics: BugStatistics;
  allBugs: Bug[];
}

// ── Jira raw shapes (server-only but defined here for type safety) ────────────

export interface JiraBugFieldsEntity {
  summary: string;
  status: { name: string };
  priority: { name: string } | null;
  assignee: { displayName: string; emailAddress: string } | null;
  created: string;
  updated: string;
  resolution: { name: string } | null;
  resolutiondate?: string | null;
}

export interface JiraBugEntity {
  id: string;
  key: string;
  fields: JiraBugFieldsEntity;
}

export interface JiraBugSearchResponseDto {
  issues: JiraBugEntity[];
  maxResults: number;
  startAt: number;
  total: number;
}
