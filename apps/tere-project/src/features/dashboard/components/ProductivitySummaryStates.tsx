import React from 'react';
import { Alert, Table, Tag } from 'antd';
import type { ReportingGroup } from '@src/shared/types/reporting-group.types';
import type { ProductivitySummaryParams } from '../utils/productivity-summary-range';

type MonthSource = 'archive' | 'live' | 'partial' | 'unavailable';

export interface CanonicalProductivitySummary {
  range: { startMonth: string; endMonth: string; monthCount: number };
  selectedGroups?: ReportingGroup[];
  metricBasis: 'WP' | 'SP';
  coverage?: {
    complete: boolean;
    months: Array<{
      month: string;
      source: MonthSource;
      productivityAvailable: boolean;
      bugsAvailable: boolean;
    }>;
  };
  summary: {
    activeMembers: number;
    productivityMetric: number | null;
    bugsRaised: number | null;
  };
  details?: Array<{
    name: string;
    group: ReportingGroup;
    monthly: Array<{
      month: string;
      source: MonthSource;
      spTotal: number | null;
      wpTotal: number | null;
      workingDays: number | null;
    }>;
  }>;
}

const value = (metric: number | null) => metric === null ? 'N/A' : metric;

export function ProductivitySummaryCanonicalResult({ data }: { data: CanonicalProductivitySummary }) {
  const groups = data.selectedGroups?.length
    ? data.selectedGroups
    : [...new Set(data.details?.map(member => member.group) ?? [])];

  return (
    <section data-qa="productivity-summary-canonical-result" aria-label="Productivity summary result">
      <p>{data.range.startMonth} – {data.range.endMonth} · {data.range.monthCount} month{data.range.monthCount === 1 ? '' : 's'}</p>
      <p><Tag color="blue">{data.metricBasis} basis</Tag> selected by server</p>
      <dl>
        <div><dt>Active members</dt><dd>{data.summary.activeMembers}</dd></div>
        <div><dt>{data.metricBasis} total</dt><dd>{value(data.summary.productivityMetric)}</dd></div>
        <div><dt>Bugs raised</dt><dd>{value(data.summary.bugsRaised)}</dd></div>
      </dl>
      {data.coverage && (
        <section aria-labelledby="productivity-coverage-heading">
          <h3 id="productivity-coverage-heading">Coverage</h3>
          <Alert
            type={data.coverage.complete ? 'success' : 'warning'}
            showIcon
            message={data.coverage.complete ? 'Complete' : 'Partial coverage'}
            description={(
              <ul>
                {data.coverage.months.map(month => (
                  <li key={month.month}>
                    {month.month}: {month.source}; productivity {month.productivityAvailable ? 'available' : 'N/A'}; bugs {month.bugsAvailable ? 'available' : 'N/A'}
                  </li>
                ))}
              </ul>
            )}
          />
        </section>
      )}
      {groups.length > 0 && (
        <section aria-labelledby="productivity-groups-heading">
          <h3 id="productivity-groups-heading">Groups</h3>
          {groups.map(group => {
            const members = data.details?.filter(member => member.group === group) ?? [];
            const rows = members.map(member => ({
              key: member.name,
              member: member.name,
              children: member.monthly.map(month => ({
                key: `${member.name}-${month.month}`,
                month: month.month,
                metric: data.metricBasis === 'SP' ? month.spTotal : month.wpTotal,
                workingDays: month.workingDays,
              })),
            }));
            return (
              <section key={group} aria-labelledby={`productivity-group-${group}`}>
                <h4 id={`productivity-group-${group}`}>{group}</h4>
                {members.length ? (
                  <Table
                    size="small"
                    pagination={false}
                    defaultExpandAllRows
                    dataSource={rows}
                    columns={[
                      { title: 'Member', dataIndex: 'member' },
                      { title: 'Month', dataIndex: 'month' },
                      { title: data.metricBasis, dataIndex: 'metric', render: metric => metric === undefined ? '' : <span data-qa="productivity-member-metric">{value(metric)}</span> },
                      { title: 'Working days', dataIndex: 'workingDays', render: days => days === undefined ? '' : <span data-qa="productivity-member-working-days">{value(days)}</span> },
                    ]}
                  />
                ) : <p>No member data available.</p>}
              </section>
            );
          })}
        </section>
      )}
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
