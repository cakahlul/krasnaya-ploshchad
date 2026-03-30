import axiosClient from '@src/lib/axiosClient';
import { BugMonitoringData } from '../types/bug-monitoring.types';

export const bugMonitoringApi = {
  getBugs: async (boardId: number): Promise<BugMonitoringData> => {
    const response = await axiosClient.get<BugMonitoringData>('/bug-monitoring/bugs', { params: { boardId } });
    return response.data;
  },
};
