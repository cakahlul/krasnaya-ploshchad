export class GetBugsRequestDto {
  boardId?: number;
  status?: string;
}

export class BugDto {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee: string | null;
  created: string;
  updated: string;
  daysOpen: number;
}

export class BugStatusGroupDto {
  status: string;
  bugs: BugDto[];
  count: number;
}

export class PriorityDistributionDto {
  priority: string;
  count: number;
}

export class BugStatisticsDto {
  totalCount: number;
  countByStatus: Record<string, number>;
  priorityDistribution: PriorityDistributionDto[];
  averageDaysOpen: number;
  assigneeDistribution: Record<string, number>;
}

export class GetBugsResponseDto {
  bugsByStatus: BugStatusGroupDto[];  // Active bugs only (for table)
  statistics: BugStatisticsDto;        // Statistics from all bugs
  allBugs: BugDto[];                   // All bugs (for time series charts)
}
