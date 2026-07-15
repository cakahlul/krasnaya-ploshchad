'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import axios, { type AxiosError } from 'axios';
import axiosClient from '@src/lib/axiosClient';

export type ConfigAuditEntityType = 'wp-weight-config' | 'holiday';

// entityType is the cache-key/domain name; API_PATH is the actual URL segment
// (e.g. 'holiday' entity → plural '/holidays' route). Keep both in sync when
// adding an entity.
const API_PATH: Record<ConfigAuditEntityType, string> = {
  'wp-weight-config': 'wp-weight-config',
  holiday: 'holidays',
};

export interface ConfigAuditEntry<T> {
  id: string;
  entity_id: string;
  action: 'create' | 'delete';
  changed_by: string;
  old_value: T | null;
  new_value: T | null;
  changed_at: string;
}

interface ConfigAuditPage<T> {
  items: ConfigAuditEntry<T>[];
  next_cursor: string | null;
}

interface ErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export function snapshot<T>(entry: ConfigAuditEntry<T>): T | null {
  return entry.action === 'create' ? entry.new_value : entry.old_value;
}

export function useConfigAuditLog<T>(entityType: ConfigAuditEntityType) {
  return useInfiniteQuery({
    queryKey: [entityType, 'audit-log'],
    queryFn: async ({ pageParam }) =>
      (
        await axiosClient.get<ConfigAuditPage<T>>(
          `/${API_PATH[entityType]}/audit-log`,
          {
            params: pageParam === undefined ? undefined : { cursor: pageParam },
          },
        )
      ).data,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.next_cursor ?? undefined,
  });
}

export function configAuditErrorMessage(error: unknown, label: string): string {
  if (!axios.isAxiosError<ErrorResponse>(error))
    return `Unable to load ${label} audit activity.`;

  const status = (error as AxiosError<ErrorResponse>).response?.status;
  const apiError = error.response?.data;
  if (status === 403)
    return `Only Leads can view ${label} audit activity.`;
  if (status && status >= 500)
    return 'The server could not complete the request. Please try again.';
  return apiError?.message || `Unable to load ${label} audit activity.`;
}
