export interface Bug {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee: string | null;
  created: string;
  updated: string;
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
