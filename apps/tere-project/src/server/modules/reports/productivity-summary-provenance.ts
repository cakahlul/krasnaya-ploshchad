import type { ReportSourceMetadata } from '../report-source-resolver/report-source-resolver';
import type { MonthSource } from './productivity-summary-range.service';

export interface ProductivitySummaryProvenance {
  sourceLabel: string;
  coverageLabel: string;
  warning: string | null;
}

export function sourceLabel(source: string, fallback = false): string {
  if (fallback && (source === 'jira' || source === 'live')) return 'Jira Fallback';
  return ({ archive: 'Archived', snapshot: 'Captured Report Snapshot', jira: 'Live Jira', live: 'Live Jira', partial: 'Partial', unavailable: 'Unavailable', mixed: 'Mixed Sources' } as Record<string, string>)[source] ?? source;
}

export function coverageLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function metadataProvenance(metadata?: Pick<ReportSourceMetadata, 'source' | 'coverage' | 'fallback' | 'warning'>): ProductivitySummaryProvenance | null {
  if (!metadata) return null;
  return { sourceLabel: sourceLabel(metadata.source, metadata.fallback), coverageLabel: coverageLabel(metadata.coverage.status), warning: metadata.warning };
}

export function monthProvenance(month: {
  source: MonthSource;
  fallback?: boolean;
  failures?: readonly { reason: string }[];
}): ProductivitySummaryProvenance {
  const fallback = month.fallback ?? false;
  const status = fallback ? 'fallback' : month.source === 'partial' ? 'partial' : month.source === 'unavailable' ? 'unavailable' : 'complete';
  return {
    sourceLabel: sourceLabel(month.source, fallback),
    coverageLabel: coverageLabel(status),
    warning: status === 'fallback' ? 'Using Jira after stored source fallback' : status === 'complete' ? null : 'Report coverage is incomplete',
  };
}
