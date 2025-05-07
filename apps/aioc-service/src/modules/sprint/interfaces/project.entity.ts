export interface Sprint {
  id: number;
  self: string;
  state: string;
  name: string;
  startDate: string;
  endDate: string;
  completeDate: string;
  createdDate: string;
  originBoardId: number;
  goal: string;
}

export interface SprintEntity {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: Sprint[];
}

export interface ProjectEntity {
  self: string;
  id: string;
  key: string;
  name: string;
}
