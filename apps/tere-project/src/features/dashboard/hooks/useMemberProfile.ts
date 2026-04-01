'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import type { MemberResponse } from '@shared/types/member.types';
import useUser from '@src/hooks/useUser';

async function fetchMemberProfile(): Promise<MemberResponse | null> {
  const res = await axiosClient.get('/members/me');
  return res.data;
}

export function useMemberProfile() {
  const { user } = useUser();

  const { data, isLoading } = useQuery<MemberResponse | null>({
    queryKey: ['member-profile', user?.email],
    queryFn: fetchMemberProfile,
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  return {
    member: data ?? null,
    teams: data?.teams ?? [],
    level: data?.level ?? null,
    isLoading,
  };
}
