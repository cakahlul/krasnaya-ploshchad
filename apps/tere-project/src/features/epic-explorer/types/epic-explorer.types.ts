/**
 * Epic Explorer types (SLS-16797). Canonical shapes live in the BE-owned
 * `src/shared/types/report.types.ts`; this module re-exports them so the slice
 * has a stable local import path. Do NOT redefine shapes here.
 */
export type {
  ExplorerEpicListItem,
  ExplorerEpicInfo,
  ExplorerCategory,
  ExplorerDescendant,
  ExplorerWeightPoint,
  ExplorerStoryPoint,
  ExplorerStatusCounts,
  ExplorerCompletionByCount,
  ExplorerComposition,
  ExplorerCoverage,
  ExplorerMetrics,
  ExplorerAuthz,
  ExplorerWpConfig,
  EpicDetailResponse,
  ExplorerErrorBody,
} from '@shared/types/report.types';

/** Convenience alias — Jira status category name. */
export type StatusCategory = string;
