'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import type {
  ApiKeyResponse,
  CreateApiKeyResponse,
} from '@shared/types/api-key.types';

const API_KEYS_QUERY_KEY = ['api-keys'];

async function fetchApiKeys(): Promise<ApiKeyResponse[]> {
  const response = await axiosClient.get('/api-keys');
  return response.data;
}

export function useApiKeys() {
  const { data, isLoading, error } = useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: fetchApiKeys,
    staleTime: 5 * 60 * 1000,
  });

  return { apiKeys: data ?? [], isLoading, error };
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await axiosClient.post('/api-keys', { name });
      return response.data as CreateApiKeyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}
