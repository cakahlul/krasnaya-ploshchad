'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { talentLeaveRepository } from '../repositories/talentLeaveRepository';
import { message } from 'antd';

export function useLeaveDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => talentLeaveRepository.deleteLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talentLeave'] });
      message.success('Leave record deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete leave record');
    },
  });
}
