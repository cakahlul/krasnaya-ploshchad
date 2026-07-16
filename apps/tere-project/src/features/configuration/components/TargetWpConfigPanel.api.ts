'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { type AxiosError } from 'axios';
import axiosClient from '@src/lib/axiosClient';

export type TargetWpRates = Record<string, number>;

export interface TargetWpConfig {
  id: string;
  effective_date: string;
  rates: TargetWpRates;
}

interface ErrorResponse {
  code?: string;
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}

const QUERY_KEY = ['target-wp-config'];

export function useTargetWpConfigs() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () =>
      (await axiosClient.get<TargetWpConfig[]>('/target-wp-config')).data,
  });
}

export function useCreateTargetWpConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { effective_date: string; rates: TargetWpRates }) =>
      (await axiosClient.post<TargetWpConfig>('/target-wp-config', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteTargetWpConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      axiosClient.delete(`/target-wp-config/${encodeURIComponent(id)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateTargetWpConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      effective_date: string;
      rates: TargetWpRates;
    }) =>
      (
        await axiosClient.put<TargetWpConfig>(
          `/target-wp-config/${encodeURIComponent(payload.id)}`,
          { effective_date: payload.effective_date, rates: payload.rates },
        )
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

// Mirrors target-wp-config.repository.ts getEffectiveRates(): the active
// config is the one with the greatest effective_date <= today. Given
// `sortedConfigs` already DESC by effective_date, that's just the first
// match — pure client-side derivation, no second endpoint/value-match needed.
export function findActiveConfig(
  sortedConfigs: TargetWpConfig[],
  today: string,
): TargetWpConfig | undefined {
  return sortedConfigs.find(config => config.effective_date <= today);
}

export function isPastDate(effectiveDate: string, today: string): boolean {
  return effectiveDate < today;
}

export function rateKeysFrom(configs: TargetWpConfig[]): string[] {
  const keys = new Set<string>();
  configs.forEach(config => Object.keys(config.rates).forEach(key => keys.add(key)));
  return Array.from(keys).sort();
}

export function errorMessage(
  error: unknown,
  action: 'load' | 'create' | 'update' | 'delete',
): string {
  if (!axios.isAxiosError<ErrorResponse>(error))
    return `Unable to ${action} target WP configuration.`;

  const status = (error as AxiosError<ErrorResponse>).response?.status;
  const apiError = error.response?.data;
  const fieldMessage = apiError?.fields
    ? Object.values(apiError.fields)[0]
    : undefined;
  if (status === 400)
    return (
      fieldMessage ||
      apiError?.message ||
      apiError?.error ||
      'The submitted values are invalid.'
    );
  if (status === 403)
    return 'Only Leads can manage target WP configurations.';
  if (status === 404)
    return 'This configuration no longer exists. Refresh the list and try again.';
  if (status && status >= 500)
    return 'The server could not complete the request. Please try again.';
  return (
    fieldMessage ||
    apiError?.message ||
    apiError?.error ||
    `Unable to ${action} target WP configuration.`
  );
}
