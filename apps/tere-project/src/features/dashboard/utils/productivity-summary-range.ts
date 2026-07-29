import type { ReportingGroup } from '@src/shared/types/reporting-group.types';

export type ProductivityMetricBasis = 'WP' | 'SP';
export interface ProductivitySummaryParams {
  startMonth: string;
  endMonth: string;
  groups?: string;
  metricBasis: ProductivityMetricBasis;
}

export function inclusiveMonthCount(startMonth: string, endMonth: string): number {
  const [startYear, start] = startMonth.split('-').map(Number);
  const [endYear, end] = endMonth.split('-').map(Number);
  return (endYear - startYear) * 12 + end - start + 1;
}

export function validateProductivitySummaryRange(startMonth: string, endMonth: string): string | null {
  const count = inclusiveMonthCount(startMonth, endMonth);
  if (count < 1) return 'Start month must not be after end month.';
  if (count > 24) return 'Date range must not exceed 24 months.';
  return null;
}

export function buildProductivitySummaryParams(
  startMonth: string,
  endMonth: string,
  groups: ReportingGroup[],
  metricBasis: ProductivityMetricBasis,
): ProductivitySummaryParams {
  return {
    startMonth,
    endMonth,
    ...(groups.length ? { groups: groups.join(',') } : {}),
    metricBasis,
  };
}
