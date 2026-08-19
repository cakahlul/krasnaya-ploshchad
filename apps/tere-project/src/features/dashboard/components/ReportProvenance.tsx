import type { ReportSourceMetadata } from '@server/modules/report-source-resolver/report-source-resolver';
import { reportCoverageLabel, reportProvenanceText, reportSourceLabel } from '../utils/report-provenance';

export function ReportProvenance({ metadata }: { metadata?: ReportSourceMetadata }) {
  if (!metadata) return null;

  return (
    <div role="status" aria-label={reportProvenanceText(metadata)} style={{ fontSize: 12, lineHeight: 1.5 }}>
      <strong>Data source:</strong> {reportSourceLabel(metadata)} · {reportCoverageLabel(metadata)}
      {metadata.warning && <span> · Warning: {metadata.warning}</span>}
    </div>
  );
}
