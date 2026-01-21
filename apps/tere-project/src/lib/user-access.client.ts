import axiosClient from './axiosClient';
import { UserAccess } from '@src/types/user-access.types';

export const userAccessClient = {
  getUserAccess: async (email: string): Promise<UserAccess> => {
    const response = await axiosClient.get<UserAccess>(`/user-access/${encodeURIComponent(email)}`);
    return response.data;
  },
};
