import React from 'react';
import { Alert, Table, Tag } from 'antd';
import type { ReportingGroup } from '@src/shared/types/reporting-group.types';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProductivitySummaryParams } from '../utils/productivity-summary-range';

interface ProductivitySummaryChartPoint {
  month: string;
  activeMembers: number | null;
  productivityMetric: number | null;
  bugsRaised: number | null;
}

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
  chart?: ProductivitySummaryChartPoint[];
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
      {data.range.monthCount > 1 && data.chart?.length ? (
        <ProductivitySummaryComparisonChart points={data.chart} metricBasis={data.metricBasis} />
      ) : null}
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

function ProductivitySummaryComparisonChart({
  points,
  metricBasis,
}: {
  points: ProductivitySummaryChartPoint[];
  metricBasis: CanonicalProductivitySummary['metricBasis'];
}) {
  return (
    <figure
      data-qa="productivity-summary-comparison-chart"
      aria-labelledby="productivity-summary-comparison-title"
      aria-describedby="productivity-summary-comparison-description"
      style={{
        background: 'var(--tere-card-bg)',
        border: '1px solid var(--tere-card-brd)',
        borderRadius: 12,
        color: 'var(--tere-title)',
        marginTop: 18,
        padding: 18,
      }}
    >
      <figcaption>
        <h3 id="productivity-summary-comparison-title" style={{ fontSize: 16, margin: 0 }}>
          Monthly comparison
        </h3>
        <p id="productivity-summary-comparison-description" style={{ color: 'var(--tere-sub)', fontSize: 12, margin: '4px 0 12px' }}>
          Active members, {metricBasis} productivity, and Bugs raised. Missing source values remain gaps.
        </p>
      </figcaption>
      <div style={{ minWidth: 0, overflowX: 'auto' }}>
        <div style={{ height: 320, minWidth: 560 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} accessibilityLayer>
              <CartesianGrid stroke="var(--tere-row-brd)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: 'var(--tere-sub)', fontSize: 11 }} />
              <YAxis yAxisId="count" allowDecimals={false} tick={{ fill: 'var(--tere-sub)', fontSize: 11 }} />
              <YAxis yAxisId="productivity" orientation="right" tick={{ fill: 'var(--tere-sub)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--tere-card-bg)',
                  border: '1px solid var(--tere-card-brd)',
                  color: 'var(--tere-title)',
                }}
              />
              <Legend wrapperStyle={{ color: 'var(--tere-sub)', fontSize: 12 }} />
              <Line yAxisId="count" dataKey="activeMembers" name="Active members" stroke="var(--color-accent)" strokeWidth={2} connectNulls={false} />
              <Line yAxisId="productivity" dataKey="productivityMetric" name={`${metricBasis} productivity`} stroke="var(--color-accent-light)" strokeWidth={2} connectNulls={false} />
              <Line yAxisId="count" dataKey="bugsRaised" name="Bugs raised" stroke="var(--tere-title)" strokeDasharray="2 3" strokeWidth={2} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <table className="sr-only">
        <caption>Monthly comparison values; N/A means source data is unavailable.</caption>
        <thead>
          <tr><th>Month</th><th>Active members</th><th>{metricBasis} productivity</th><th>Bugs raised</th></tr>
        </thead>
        <tbody>
          {points.map(point => (
            <tr key={point.month}>
              <th scope="row">{point.month}</th>
              <td>{value(point.activeMembers)}</td>
              <td>{value(point.productivityMetric)}</td>
              <td>{value(point.bugsRaised)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
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
