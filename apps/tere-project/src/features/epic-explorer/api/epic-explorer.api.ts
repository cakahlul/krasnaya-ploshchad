import axiosClient from '@src/lib/axiosClient';
import type {
  ExplorerEpicListItem,
  EpicDetailResponse,
} from '../types/epic-explorer.types';

/**
 * Epic Explorer API client (SLS-16797). axiosClient baseURL is '/api'.
 * Errors are NOT swallowed here — the raw axios error (carrying
 * `error.response.status`) propagates so React Query consumers can branch on
 * the HTTP status (401/403/404/502) per SLS-16813.
 */
export const epicExplorerApi = {
  getEpics: async (project: string): Promise<ExplorerEpicListItem[]> => {
    const res = await axiosClient.get<ExplorerEpicListItem[]>('/report/epics', {
      params: { project },
    });
    return res.data;
  },

  getEpicDetail: async (
    project: string,
    key: string,
  ): Promise<EpicDetailResponse> => {
    const res = await axiosClient.get<EpicDetailResponse>(
      `/report/epics/${encodeURIComponent(key)}`,
      { params: { project } },
    );
    return res.data;
  },
};
