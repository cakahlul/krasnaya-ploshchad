import axiosClient from '@src/lib/axiosClient';
import type { Holiday, CreateHolidayRequest } from '../types/holiday-management.types';

const baseUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;

export const holidayApi = {
  fetchHolidays: async (): Promise<Holiday[]> => {
    const response = await axiosClient.get(`${baseUrl}/holidays`);
    return response.data;
  },

  createHoliday: async (data: CreateHolidayRequest): Promise<Holiday> => {
    const response = await axiosClient.post(`${baseUrl}/holidays`, data);
    return response.data;
  },

  deleteHoliday: async (id: string): Promise<void> => {
    await axiosClient.delete(`${baseUrl}/holidays/${id}`);
  },

  bulkCreateHolidays: async (data: CreateHolidayRequest[]): Promise<{ message: string; count: number }> => {
    const response = await axiosClient.post(`${baseUrl}/holidays/bulk`, data);
    return response.data;
  },
};
