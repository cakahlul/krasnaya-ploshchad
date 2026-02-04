export interface SearchTicketDto {
  key: string;
  summary: string;
  status: string;
  statusColor?: string;
  resolution?: string; // To Do, In Progress, Done - for SLS/DS
  assignee: string | null;
  assigneeAvatar?: string;
  priority: string;
  priorityIcon?: string;
  issueType: string;
  issueTypeIcon?: string;
  projectKey: string;
  updated: string;
}

export interface SearchResultDto {
  tickets: SearchTicketDto[];
  total?: number; // Total might not be available in token-based pagination
  hasMore: boolean;
  nextPageToken?: string;
}

export interface TicketDetailDto {
  key: string;
  summary: string;
  description: string | null;
  status: string;
  statusColor?: string;
  resolution?: string; // To Do, In Progress, Done
  assignee: string | null;
  assigneeAvatar?: string;
  reporter: string | null;
  reporterAvatar?: string;
  priority: string;
  priorityIcon?: string;
  issueType: string;
  issueTypeIcon?: string;
  labels: string[];
  created: string;
  updated: string;
  projectKey: string;
  projectName: string;
  sprint?: string;
  storyPoints?: number;
  appendixV3?: number | string | string[]; // Weight Complexity (formerly Appendix v3)
  webUrl?: string;
}

export interface SearchQueryDto {
  q: string;
  limit?: number;
  offset?: number; // Keep for backward compatibility if needed, but intended to be replaced
  nextPageToken?: string;
}
