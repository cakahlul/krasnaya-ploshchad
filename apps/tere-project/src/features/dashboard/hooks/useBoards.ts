'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import type { BoardResponse } from '@shared/types/board.types';

async function fetchBoards(): Promise<BoardResponse[]> {
  const response = await axiosClient.get('/boards');
  return response.data;
}

export function useBoards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: fetchBoards,
    staleTime: 10 * 60 * 1000, // boards rarely change
  });

  return {
    boards: data ?? [],
    isLoading,
    error,
  };
}
