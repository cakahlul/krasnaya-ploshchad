'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import useUser from '@src/hooks/useUser';
import type { MemberResponse } from '@shared/types/member.types';

async function fetchMembers(): Promise<MemberResponse[]> {
  const response = await axiosClient.get('/members');
  return response.data;
}

export function useMembers() {
  const { user } = useUser();

  const { data, isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  return {
    members: data ?? [],
    isLoading,
    error,
  };
}
