'use client';
import { jiraRepository } from '../repositories/jiraRepository';
import { useQuery } from '@tanstack/react-query';

export function useMultiTeamSprintFetch(boardIds: number[]) {
  return useQuery({
    queryKey: ['sprints-multi', [...boardIds].sort().join(',')],
    queryFn: () => jiraRepository.fetchSprintsByBoardIds(boardIds),
    enabled: boardIds.length > 0,
  });
}
