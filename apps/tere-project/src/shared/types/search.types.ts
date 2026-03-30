export interface SearchTicketDto {
  key: string;
  summary: string;
  status: string;
  statusColor?: string;
  resolution?: string;
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
  total?: number;
  hasMore: boolean;
  nextPageToken?: string;
}

export interface TicketDetailDto {
  key: string;
  summary: string;
  description: string | null;
  status: string;
  statusColor?: string;
  resolution?: string;
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
  spType?: string;
  appendixV3?: number | string | string[];
  totalWeightPoints?: number;
  webUrl?: string;
}

export interface SearchQueryDto {
  q: string;
  limit?: number;
  offset?: number;
  nextPageToken?: string;
}
