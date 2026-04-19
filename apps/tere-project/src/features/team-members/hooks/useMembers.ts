'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import type {
  MemberResponse,
  CreateMemberRequest,
  UpdateMemberRequest,
} from '@shared/types/member.types';

const MEMBERS_QUERY_KEY = ['members'];

async function fetchMembers(): Promise<MemberResponse[]> {
  const response = await axiosClient.get('/members');
  return response.data;
}

export function useMembers() {
  const { data, isLoading, error } = useQuery({
    queryKey: MEMBERS_QUERY_KEY,
    queryFn: fetchMembers,
    staleTime: 10 * 60 * 1000,
  });

  return { members: data ?? [], isLoading, error };
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMemberRequest) => {
      const response = await axiosClient.post('/members', payload);
      return response.data as MemberResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: string } & UpdateMemberRequest) => {
      const response = await axiosClient.put(`/members/${id}`, payload);
      return response.data as MemberResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
    },
  });
}
