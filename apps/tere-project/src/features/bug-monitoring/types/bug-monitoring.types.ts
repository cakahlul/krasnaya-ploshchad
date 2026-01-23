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
  allBugs: Bug[];  // All bugs for time series charts
}
