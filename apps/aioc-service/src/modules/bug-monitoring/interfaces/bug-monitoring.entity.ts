export interface JiraBugFieldsEntity {
  summary: string;
  status: {
    name: string;
  };
  priority: {
    name: string;
  } | null;
  assignee: {
    displayName: string;
    emailAddress: string;
  } | null;
  created: string;
  updated: string;
  resolution: {
    name: string;
  } | null;
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
  isLast?: boolean;
  nextPageToken?: string;
}
