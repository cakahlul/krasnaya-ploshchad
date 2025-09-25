export interface SprintDto {
  id: number;
  state: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface ProjectDto {
  id: string;
  key: string;
  name: string;
}
