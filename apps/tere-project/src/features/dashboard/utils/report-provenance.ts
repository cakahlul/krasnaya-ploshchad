import type { ReportSourceMetadata } from '@server/modules/report-source-resolver/report-source-resolver';

export function reportSourceLabel(metadata: ReportSourceMetadata): string {
  if (metadata.fallback && metadata.source === 'jira') return 'Jira Fallback';
  if (metadata.source === 'archive') return 'Archived';
  if (metadata.source === 'snapshot') return 'Captured Report Snapshot';
  if (metadata.source === 'jira') return 'Live Jira';
  if (metadata.source === 'partial') return 'Partial data';
  if (metadata.source === 'unavailable') return 'Unavailable';
  return 'Mixed sources';
}

export function reportCoverageLabel(metadata: ReportSourceMetadata): string {
  switch (metadata.coverage.status) {
    case 'fallback':
      return 'Fallback coverage';
    case 'partial':
      return `Partial coverage (${metadata.coverage.covered} of ${metadata.coverage.expected})`;
    case 'unavailable':
      return 'Unavailable';
    default:
      return 'Complete coverage';
  }
}

export function reportProvenanceText(metadata: ReportSourceMetadata): string {
  const warning = metadata.warning ? ` Warning: ${metadata.warning}.` : '';
  return `${reportSourceLabel(metadata)}. ${reportCoverageLabel(metadata)}.${warning}`;
}
