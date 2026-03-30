import axiosClient from '@src/lib/axiosClient';
import type {
  TalentLeaveResponse,
  TalentResponse,
  CreateLeaveRequest,
  UpdateLeaveRequest,
} from '../types/talent-leave.types';

export const talentLeaveRepository = {
  fetchLeaveRecords: async (
    startDate: string,
    endDate: string,
    filters?: { status?: string; team?: string }
  ): Promise<TalentLeaveResponse[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.team) params.append('team', filters.team);
    const response = await axiosClient.get(`/talent-leave?${params.toString()}`);
    return response.data;
  },

  fetchTalentList: async (): Promise<TalentResponse[]> => {
    const response = await axiosClient.get('/talent-leave/talents');
    return response.data;
  },

  createLeave: async (data: CreateLeaveRequest): Promise<TalentLeaveResponse> => {
    const response = await axiosClient.post('/talent-leave', data);
    return response.data;
  },

  updateLeave: async (id: string, data: UpdateLeaveRequest): Promise<TalentLeaveResponse> => {
    const response = await axiosClient.put(`/talent-leave/${id}`, data);
    return response.data;
  },

  deleteLeave: async (id: string): Promise<void> => {
    await axiosClient.delete(`/talent-leave/${id}`);
  },
};
