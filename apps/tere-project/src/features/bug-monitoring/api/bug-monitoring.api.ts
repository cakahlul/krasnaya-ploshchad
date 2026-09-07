import axiosClient from '@src/lib/axiosClient';
import { BugMonitoringData } from '../types/bug-monitoring.types';

export const bugMonitoringApi = {
  getBugs: async (boardId?: number, nocP1CodeIssue = false): Promise<BugMonitoringData> => {
    const response = await axiosClient.get<BugMonitoringData>('/bug-monitoring/bugs', { params: { boardId, nocP1CodeIssue, allBoards: boardId === undefined } });
    return response.data;
  },
};
