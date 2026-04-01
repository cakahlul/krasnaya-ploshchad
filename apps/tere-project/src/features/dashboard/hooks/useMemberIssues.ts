'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import { TicketDetail } from './useTicketDetail';

const CHUNK_SIZE = 15;

async function fetchMemberIssuesBatch(keys: string[]): Promise<TicketDetail[]> {
  if (keys.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
    chunks.push(keys.slice(i, i + CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      axiosClient.post(`/search/tickets`, { keys: chunk }).then(res => res.data)
    )
  );

  return results.flat();
}

export function useMemberIssues(allKeys: string[], enabled: boolean = false) {
  const {
    data: issues,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['member-issues-all', allKeys],
    queryFn: () => fetchMemberIssuesBatch(allKeys),
    enabled: enabled && allKeys.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  return {
    issues: issues ?? [],
    isLoading,
    totalKeys: allKeys.length,
    error: error as Error | null,
  };
}
