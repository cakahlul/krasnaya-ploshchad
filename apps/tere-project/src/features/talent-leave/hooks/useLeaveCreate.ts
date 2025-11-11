'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { talentLeaveRepository } from '../repositories/talentLeaveRepository';
import type { CreateLeaveRequest } from '../types/talent-leave.types';

/**
 * Custom hook to create leave records using React Query mutation
 * Invalidates the talentLeave query cache on success and shows user feedback
 * @returns React Query mutation result
 */
export function useLeaveCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeaveRequest) =>
      talentLeaveRepository.createLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talentLeave'] });
      message.success('Leave record created successfully');
    },
    onError: () => {
      message.error('Failed to create leave record');
    },
  });
}
