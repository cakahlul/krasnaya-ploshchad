'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';
import type { WPWeightConfig } from './WpWeightConfigPanel.api';

export interface WPWeightAuditEntry {
  id: string;
  entity_id: string;
  action: 'create' | 'delete';
  changed_by: string;
  old_value: WPWeightConfig | null;
  new_value: WPWeightConfig | null;
  changed_at: string;
}

interface WPWeightAuditPage {
  items: WPWeightAuditEntry[];
  next_cursor: string | null;
}

const QUERY_KEY = ['wp-weight-config', 'audit-log'] as const;

export function useWpWeightAuditLog() {
  return useInfiniteQuery({
    queryKey: QUERY_KEY,
    queryFn: async ({ pageParam }) =>
      (
        await axiosClient.get<WPWeightAuditPage>('/wp-weight-config/audit-log', {
          params: pageParam === undefined ? undefined : { cursor: pageParam },
        })
      ).data,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.next_cursor ?? undefined,
  });
}
