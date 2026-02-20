'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import { TicketDetail } from './useTicketDetail';

const apiUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;
const PAGE_SIZE = 7;

async function fetchMemberIssuesPage(keys: string[]): Promise<TicketDetail[]> {
  if (keys.length === 0) return [];
  const response = await axiosClient.post(`${apiUrl}/search/tickets/batch`, { keys });
  return response.data;
}

export function useMemberIssues(allKeys: string[], enabled: boolean = false) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['member-issues', allKeys],
    queryFn: async ({ pageParam = 0 }) => {
      const pageKeys = allKeys.slice(pageParam, pageParam + PAGE_SIZE);
      return fetchMemberIssuesPage(pageKeys);
    },
    getNextPageParam: (_lastPage, allPages) => {
      const loadedCount = allPages.length * PAGE_SIZE;
      return loadedCount < allKeys.length ? loadedCount : undefined;
    },
    initialPageParam: 0,
    enabled: enabled && allKeys.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const issues = data?.pages.flat() ?? [];

  return {
    issues,
    isLoading,
    isFetchingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    fetchMore: fetchNextPage,
    totalKeys: allKeys.length,
    error: error as Error | null,
  };
}
