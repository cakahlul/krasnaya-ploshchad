import axios from 'axios';
import { Dashboard } from '../types/dashboard';

const apiUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;
const baseUrl = `${apiUrl}/report`;

export const jiraRepository = {
  fetchTeamReport: async (
    sprint: string,
    project: string,
  ): Promise<Dashboard> => {
    const response = await axios.get(
      `${baseUrl}?sprint=${sprint}&project=${project}`,
    );
    return response.data;
  },
};
