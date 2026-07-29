import React from 'react';
import type { ProductivitySummaryParams } from '../utils/productivity-summary-range';

export interface CanonicalProductivitySummary {
  range: { startMonth: string; endMonth: string; monthCount: number };
  metricBasis: 'WP' | 'SP';
  summary: {
    activeMembers: number;
    productivityMetric: number | null;
    bugsRaised: number | null;
  };
}

const value = (metric: number | null) => metric === null ? 'N/A' : metric;

export function ProductivitySummaryCanonicalResult({ data }: { data: CanonicalProductivitySummary }) {
  return (
    <section data-qa="productivity-summary-canonical-result" aria-label="Productivity summary result">
      <p>{data.range.startMonth} – {data.range.endMonth} · {data.range.monthCount} month{data.range.monthCount === 1 ? '' : 's'}</p>
      <dl>
        <div><dt>Active members</dt><dd>{data.summary.activeMembers}</dd></div>
        <div><dt>{data.metricBasis} total</dt><dd>{value(data.summary.productivityMetric)}</dd></div>
        <div><dt>Bugs raised</dt><dd>{value(data.summary.bugsRaised)}</dd></div>
      </dl>
    </section>
  );
}

export function ProductivitySummaryRetry({
  request,
  onRetry,
}: {
  request: ProductivitySummaryParams;
  onRetry: (request: ProductivitySummaryParams) => void;
}) {
  return (
    <button type="button" data-qa="productivity-summary-retry" onClick={() => onRetry(request)}>
      Retry
    </button>
  );
}
