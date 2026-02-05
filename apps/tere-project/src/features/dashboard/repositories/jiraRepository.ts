import { DashboardDto, SprintDto } from '../types/dashboard';
import axiosClient from '@src/lib/axiosClient';

const apiUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;
const baseUrl = `${apiUrl}`;

export const jiraRepository = {
  fetchTeamReport: async (
    sprint: string,
    project: string,
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardDto> => {
    // Build query params based on whether date range or sprint is provided
    const params = new URLSearchParams();
    params.append('project', project);
    
    if (startDate && endDate) {
      // Date range mode
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    } else if (sprint) {
      // Sprint mode
      params.append('sprint', sprint);
    }
    
    const response = await axiosClient.get(`${baseUrl}/report?${params.toString()}`);
    return response.data;
  },

  fetchSprint: async (boardId: number): Promise<SprintDto[]> => {
    const response = await axiosClient.get(
      `${baseUrl}/project/sprint?boardId=${boardId}`,
    );
    return response.data;
  },
};
