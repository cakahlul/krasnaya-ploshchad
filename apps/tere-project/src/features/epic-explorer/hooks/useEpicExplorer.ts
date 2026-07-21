'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { epicExplorerApi } from '../api/epic-explorer.api';
import { useExplorerStore } from '../store/explorerStore';
import {
  readSelection,
  toQueryString,
  selectionEquals,
} from '../utils/explorerParams';
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

/**
 * Deep-link URL⇄state sync (SLS-16894 / FR-10). The Zustand store stays the
 * source of truth; the URL only mirrors it.
 *
 * - Hydrate ONCE from the initial `?project=&epicKey=` (setProject THEN
 *   setEpicKey — setProject clears epicKey, so order matters). This drives the
 *   existing `useEpicDetail`, which re-runs the Phase-1 server-side authz; no
 *   backend change and no new error UI (edge cases fall through the existing
 *   StateViews branches in page.tsx).
 * - Mirror store→URL via `router.replace` (no history spam, no scroll). Guarded
 *   by value-equality against the current params so our own replace can't feed
 *   back into a hydrate→URL→hydrate loop.
 *
 * Must be called inside a <Suspense> boundary (uses useSearchParams).
 */
export function useExplorerUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const project = useExplorerStore(s => s.project);
  const epicKey = useExplorerStore(s => s.epicKey);
  const setProject = useExplorerStore(s => s.setProject);
  const setEpicKey = useExplorerStore(s => s.setEpicKey);
  const hydrated = useRef(false);
  const didInitialSync = useRef(false);

  // URL → store, once on mount.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const sel = readSelection(searchParams);
    if (sel.project) {
      setProject(sel.project); // clears epicKey
      if (sel.epicKey) setEpicKey(sel.epicKey);
    }
  }, [searchParams, setProject, setEpicKey]);

  // store → URL, after hydration and only on a real change. Skip the FIRST run:
  // on the mount commit this effect still closes over the pre-hydration store
  // (null,null) while `searchParams` already holds the deep-link, so its guard
  // would wrongly `replace` to the bare path and strip the query. The store
  // update from the hydrate effect re-runs this effect on the next commit with
  // the correct values.
  useEffect(() => {
    if (!hydrated.current) return;
    if (!didInitialSync.current) {
      didInitialSync.current = true;
      return;
    }
    if (selectionEquals(readSelection(searchParams), { project, epicKey })) return;
    const qs = toQueryString({ project, epicKey });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [project, epicKey, pathname, router, searchParams]);
}
