import { DashboardDto, SprintDto } from '../types/dashboard';
import axiosClient from '@src/lib/axiosClient';

export const jiraRepository = {
  fetchTeamReport: async (
    sprint: string,
    project: string,
    startDate?: string,
    endDate?: string,
    epicId?: string,
  ): Promise<DashboardDto> => {
    const params = new URLSearchParams();
    params.append('project', project);
    if (startDate && endDate) {
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    } else if (sprint) {
      params.append('sprint', sprint);
    }
    if (epicId && epicId !== 'all') {
      params.append('epicId', epicId);
    }
    const response = await axiosClient.get(`/report?${params.toString()}`);
    return response.data;
  },

  fetchEpics: async (
    sprint: string,
    project: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append('project', project);
    if (sprint) params.append('sprint', sprint);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await axiosClient.get(`/report/epics?${params.toString()}`);
    return response.data;
  },

  fetchSprint: async (boardId: number): Promise<SprintDto[]> => {
    const response = await axiosClient.get(`/project/sprint?boardId=${boardId}`);
    return response.data;
  },

  /**
   * Fetch sprints for multiple board IDs in a single batch request
   * More efficient than calling fetchSprint() per team
   */
  fetchSprintsByBoardIds: async (boardIds: number[]): Promise<SprintDto[]> => {
    if (boardIds.length === 0) return [];
    const boardIdParams = boardIds.join(',');
    const response = await axiosClient.get(`/project/sprint/batch?boardIds=${boardIdParams}`);
    return response.data;
  },
};
