'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import axiosClient from '@src/lib/axiosClient';

const apiUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;

export interface SearchTicket {
  key: string;
  summary: string;
  status: string;
  statusColor?: string;
  resolution?: string; // To Do, In Progress, Done - for SLS/DS
  assignee: string | null;
  assigneeAvatar?: string;
  priority: string;
  priorityIcon?: string;
  issueType: string;
  issueTypeIcon?: string;
  projectKey: string;
  updated: string;
}

interface SearchResult {
  tickets: SearchTicket[];
  total: number;
  hasMore: boolean;
  nextPageToken?: string;
}

async function searchTickets(
  query: string,
  limit: number,
  nextPageToken?: string,
): Promise<SearchResult> {
  if (!query || query.trim().length === 0) {
    return { tickets: [], total: 0, hasMore: false };
  }
  let url = `${apiUrl}/search/tickets?q=${encodeURIComponent(query)}&limit=${limit}`;
  if (nextPageToken) {
    url += `&nextPageToken=${encodeURIComponent(nextPageToken)}`;
  }
  
  const response = await axiosClient.get(url);
  return response.data;
}

export function useGlobalSearch(debounceMs: number = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentToken, setCurrentToken] = useState<string | undefined>(undefined);
  const [allTickets, setAllTickets] = useState<SearchTicket[]>([]);
  const limit = 50;

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentToken(undefined);
      setAllTickets([]);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['global-search', debouncedQuery, currentToken],
    queryFn: () => searchTickets(debouncedQuery, limit, currentToken),
    enabled: debouncedQuery.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Accumulate tickets when loading more
  useEffect(() => {
    if (data?.tickets) {
      if (!currentToken) {
        setAllTickets(data.tickets);
      } else {
        setAllTickets((prev) => [...prev, ...data.tickets]);
      }
    }
  }, [data, currentToken]);

  const fetchMore = useCallback(() => {
    if (data?.hasMore && !isFetching && data?.nextPageToken) {
      setCurrentToken(data.nextPageToken);
    }
  }, [data?.hasMore, data?.nextPageToken, isFetching]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setCurrentToken(undefined);
    setAllTickets([]);
  }, []);

  return {
    query,
    setQuery,
    results: allTickets,
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading: isLoading && debouncedQuery.length > 0,
    isFetching,
    error: error as Error | null,
    fetchMore,
    clearSearch,
  };
}
