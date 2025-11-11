'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { talentLeaveRepository } from '../repositories/talentLeaveRepository';
import type { UpdateLeaveRequest } from '../types/talent-leave.types';

/**
 * Custom hook to update leave records using React Query mutation
 * Invalidates the talentLeave query cache on success and shows user feedback
 * @returns React Query mutation result
 */
export function useLeaveUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeaveRequest }) =>
      talentLeaveRepository.updateLeave(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talentLeave'] });
      message.success('Leave record updated successfully');
    },
    onError: () => {
      message.error('Failed to update leave record');
    },
  });
}
