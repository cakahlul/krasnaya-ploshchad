'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { type AxiosError } from 'axios';
import axiosClient from '@src/lib/axiosClient';

export const WEIGHT_KEYS = ['Very Low', 'Low', 'Medium', 'High'] as const;
export type WeightKey = (typeof WEIGHT_KEYS)[number];
export type WPWeights = Record<WeightKey, number>;

export interface WPWeightConfig {
  id: string;
  effective_date: string;
  weights: WPWeights;
}

interface ErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

const QUERY_KEY = ['wp-weight-config'];

export function useWpWeightConfigs() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () =>
      (await axiosClient.get<WPWeightConfig[]>('/wp-weight-config')).data,
  });
}

export function useCreateWpWeightConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<WPWeightConfig, 'id'>) =>
      (await axiosClient.post<WPWeightConfig>('/wp-weight-config', payload))
        .data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteWpWeightConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      axiosClient.delete(`/wp-weight-config/${encodeURIComponent(id)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function errorMessage(
  error: unknown,
  action: 'load' | 'create' | 'delete',
): string {
  if (!axios.isAxiosError<ErrorResponse>(error))
    return `Unable to ${action} weight configuration.`;

  const status = (error as AxiosError<ErrorResponse>).response?.status;
  const apiError = error.response?.data;
  const fieldMessage = apiError?.fields
    ? Object.values(apiError.fields)[0]
    : undefined;
  if (status === 400)
    return (
      fieldMessage || apiError?.message || 'The submitted values are invalid.'
    );
  if (status === 403)
    return 'Only Leads can view or manage weight configurations.';
  if (status === 404)
    return 'This configuration no longer exists. Refresh the list and try again.';
  if (status === 409 && apiError?.code === 'EFFECTIVE_DATE_CONFLICT') {
    return 'A configuration already exists for this effective date.';
  }
  if (status === 409 && apiError?.code === 'IMMUTABLE_CONFIG') {
    return 'Active or historical configurations cannot be deleted.';
  }
  if (status && status >= 500)
    return 'The server could not complete the request. Please try again.';
  return (
    fieldMessage ||
    apiError?.message ||
    `Unable to ${action} weight configuration.`
  );
}
