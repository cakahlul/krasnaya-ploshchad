'use client';

import { useQuery } from '@tanstack/react-query';
import { epicExplorerApi } from '../api/epic-explorer.api';
import type {
  ExplorerEpicListItem,
  EpicDetailResponse,
} from '../types/epic-explorer.types';

/**
 * Epic list for a project (SLS-16797/16800). Pre-fetched once per project;
 * EpicSearch filters this list client-side (no per-keystroke fetch).
 * `retry: false` so a 4xx surfaces immediately for status branching.
 */
export function useEpicList(project: string | null) {
  return useQuery<ExplorerEpicListItem[]>({
    queryKey: ['epic-explorer', 'epics', project],
    queryFn: () => epicExplorerApi.getEpics(project as string),
    enabled: !!project,
    retry: false,
  });
}

/**
 * Epic detail (SLS-16797). The raw axios error propagates so the page can
 * branch on `error.response.status` (401/403/404/502) per SLS-16813.
 */
export function useEpicDetail(project: string | null, epicKey: string | null) {
  return useQuery<EpicDetailResponse>({
    queryKey: ['epic-explorer', 'detail', project, epicKey],
    queryFn: () =>
      epicExplorerApi.getEpicDetail(project as string, epicKey as string),
    enabled: !!project && !!epicKey,
    retry: false,
  });
}
