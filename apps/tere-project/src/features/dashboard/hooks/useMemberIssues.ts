'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import { TicketDetail } from './useTicketDetail';

const apiUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;

async function fetchMemberIssues(keys: string[]): Promise<TicketDetail[]> {
  if (keys.length === 0) return [];
  const response = await axiosClient.post(`${apiUrl}/search/tickets/batch`, { keys });
  return response.data;
}

export function useMemberIssues(keys: string[], enabled: boolean = false) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['member-issues', keys],
    queryFn: () => fetchMemberIssues(keys),
    enabled: enabled && keys.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });

  return {
    issues: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
