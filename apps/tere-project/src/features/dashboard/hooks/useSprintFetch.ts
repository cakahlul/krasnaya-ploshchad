'use client';
import { jiraRepository } from '../repositories/jiraRepository';
import { useQuery } from '@tanstack/react-query';
import { useSprintFilterStore } from '../store/useSprintFilterStore';

export function useSprintFetch() {
  const { board } = useSprintFilterStore(state => state);

  return useQuery({
    queryKey: ['sprint', board?.id],
    queryFn: () => jiraRepository.fetchSprint(board.id),
    enabled: board.id !== 0,
  });
}
