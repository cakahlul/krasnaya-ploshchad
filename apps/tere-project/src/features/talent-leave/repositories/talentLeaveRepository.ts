import axiosClient from '@src/lib/axiosClient';
import type {
  TalentLeaveResponse,
  TalentResponse,
  CreateLeaveRequest,
  UpdateLeaveRequest,
} from '../types/talent-leave.types';

const baseUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;

export const talentLeaveRepository = {
  /**
   * Fetch leave records with date range and optional filters
   * @param startDate - Start date for filtering (ISO 8601 or YYYY-MM-DD)
   * @param endDate - End date for filtering (ISO 8601 or YYYY-MM-DD)
   * @param filters - Optional filters for status and team
   * @returns Array of leave records
   */
  fetchLeaveRecords: async (
    startDate: string,
    endDate: string,
    filters?: { status?: string; team?: string }
  ): Promise<TalentLeaveResponse[]> => {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    // Add optional filters
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.team) {
      params.append('team', filters.team);
    }

    const response = await axiosClient.get(
      `${baseUrl}/talent-leave?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Fetch list of all talents with their team and role information
   * @returns Array of talent records
   */
  fetchTalentList: async (): Promise<TalentResponse[]> => {
    const response = await axiosClient.get(`${baseUrl}/talent-leave/talents`);
    return response.data;
  },

  /**
   * Create a new leave record
   * @param data - Leave record data to create
   * @returns Created leave record with ID
   */
  createLeave: async (
    data: CreateLeaveRequest
  ): Promise<TalentLeaveResponse> => {
    const response = await axiosClient.post(`${baseUrl}/talent-leave`, data);
    return response.data;
  },

  /**
   * Update an existing leave record
   * @param id - Leave record ID
   * @param data - Partial leave record data to update
   * @returns Updated leave record
   */
  updateLeave: async (
    id: string,
    data: UpdateLeaveRequest
  ): Promise<TalentLeaveResponse> => {
    const response = await axiosClient.put(
      `${baseUrl}/talent-leave/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a leave record
   * @param id - Leave record ID to delete
   */
  deleteLeave: async (id: string): Promise<void> => {
    await axiosClient.delete(`${baseUrl}/talent-leave/${id}`);
  },
};
