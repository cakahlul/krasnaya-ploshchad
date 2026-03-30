import axiosClient from '@src/lib/axiosClient';
import type { Holiday, CreateHolidayRequest } from '../types/holiday-management.types';

export const holidayApi = {
  fetchHolidays: async (): Promise<Holiday[]> => {
    const response = await axiosClient.get('/holidays');
    return response.data;
  },

  createHoliday: async (data: CreateHolidayRequest): Promise<Holiday> => {
    const response = await axiosClient.post('/holidays', data);
    return response.data;
  },

  deleteHoliday: async (id: string): Promise<void> => {
    await axiosClient.delete(`/holidays/${id}`);
  },

  bulkCreateHolidays: async (data: CreateHolidayRequest[]): Promise<{ message: string; count: number }> => {
    const response = await axiosClient.post('/holidays/bulk', data);
    return response.data;
  },
};
