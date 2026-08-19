import type { ReportSourceMetadata } from '../report-source-resolver/report-source-resolver';
import type { MonthSource } from './productivity-summary-range.service';

export interface ProductivitySummaryProvenance {
  sourceLabel: string;
  coverageLabel: string;
  warning: string | null;
}

export function sourceLabel(source: string, fallback = false): string {
  if (fallback && source === 'jira') return 'Jira Fallback';
  return ({ archive: 'Archived', snapshot: 'Captured Report Snapshot', jira: 'Live Jira', live: 'Live Jira', partial: 'Partial', unavailable: 'Unavailable', mixed: 'Mixed Sources' } as Record<string, string>)[source] ?? source;
}

export function coverageLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function metadataProvenance(metadata?: Pick<ReportSourceMetadata, 'source' | 'coverage' | 'fallback' | 'warning'>): ProductivitySummaryProvenance | null {
  if (!metadata) return null;
  return { sourceLabel: sourceLabel(metadata.source, metadata.fallback), coverageLabel: coverageLabel(metadata.coverage.status), warning: metadata.warning };
}

export function monthProvenance(month: { source: MonthSource; failures?: readonly { reason: string }[] }): ProductivitySummaryProvenance {
  const status = month.source === 'partial' ? 'partial' : month.source === 'unavailable' ? 'unavailable' : 'complete';
  return {
    sourceLabel: sourceLabel(month.source, month.source === 'partial' && (month.failures?.length ?? 0) > 0),
    coverageLabel: coverageLabel(status),
    warning: status === 'complete' ? null : 'Report coverage is incomplete',
  };
}
