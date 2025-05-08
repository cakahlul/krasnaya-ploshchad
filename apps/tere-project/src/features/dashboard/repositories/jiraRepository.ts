import { DashboardDto, SprintDto } from '../types/dashboard';
import axiosClient from '@src/lib/axiosClient';

const apiUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;
const baseUrl = `${apiUrl}`;

export const jiraRepository = {
  fetchTeamReport: async (
    sprint: string,
    project: string,
  ): Promise<DashboardDto> => {
    const response = await axiosClient.get(
      `${baseUrl}/report?sprint=${sprint}&project=${project}`,
    );
    return response.data;
  },

  fetchSprint: async (boardId: number): Promise<SprintDto[]> => {
    const response = await axiosClient.get(
      `${baseUrl}/project/sprint?boardId=${boardId}`,
    );
    return response.data;
  },
};
