import React from 'react';
import { Alert, Table, Tag } from 'antd';
import { Activity, Bug, CheckCircle2, Users } from 'lucide-react';
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

const BUG_LINE_COLOR = '#ef4444';

interface ProductivitySummaryChartPoint {
  month: string;
  activeMembers: number | null;
  productivityMetric: number | null;
  productivityPercent?: number | null;
  workingDays?: number | null;
  bugsTotal?: number | null;
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
    productivityPercent?: number | null;
    bugsTotal?: number | null;
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

  const summaryCards = [
    { label: 'Active members', value: data.summary.activeMembers, icon: Users },
    { label: 'Productivity %', value: value(data.summary.productivityPercent ?? data.summary.productivityMetric), icon: Activity },
    { label: 'Total bugs', value: value(data.summary.bugsTotal ?? data.summary.bugsRaised), icon: Bug },
  ];

  return (
    <section data-qa="productivity-summary-canonical-result" aria-label="Productivity summary result" style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: 'var(--tere-title)', fontSize: 18, margin: 0 }}>Performance overview</h2>
          <p style={{ color: 'var(--tere-sub)', fontSize: 12, margin: '4px 0 0' }}>
            {data.range.startMonth} – {data.range.endMonth} · {data.range.monthCount} month{data.range.monthCount === 1 ? '' : 's'}
          </p>
        </div>
        <Tag color="blue" style={{ margin: 0 }}>{data.metricBasis} basis</Tag>
      </header>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: 0 }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{ background: 'var(--tere-card-bg)', border: '1px solid var(--tere-card-brd)', borderRadius: 12, padding: 16 }}>
            <dt style={{ alignItems: 'center', color: 'var(--tere-sub)', display: 'flex', fontSize: 11, fontWeight: 600, gap: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              <card.icon aria-hidden size={16} /> {card.label}
            </dt>
            <dd style={{ color: 'var(--tere-title)', fontSize: 28, fontWeight: 700, margin: '8px 0 0' }}>{card.value}</dd>
          </div>
        ))}
      </dl>
      {data.range.monthCount > 1 && data.chart?.length ? (
        <ProductivitySummaryComparisonChart points={data.chart} metricBasis={data.metricBasis} />
      ) : null}
      {data.coverage && (
        <section aria-labelledby="productivity-coverage-heading" style={{ background: 'var(--tere-card-bg)', border: '1px solid var(--tere-card-brd)', borderRadius: 12, padding: '12px 16px' }}>
          <details>
            <summary style={{ alignItems: 'center', color: 'var(--tere-title)', cursor: 'pointer', display: 'flex', fontSize: 13, fontWeight: 600, gap: 8 }}>
              <CheckCircle2 aria-hidden size={17} color={data.coverage.complete ? 'var(--color-accent)' : '#b45309'} />
              <span id="productivity-coverage-heading">{data.coverage.complete ? 'All selected months are available' : 'Some source data is unavailable'}</span>
              <span style={{ color: 'var(--tere-sub)', fontSize: 11, fontWeight: 400, marginLeft: 'auto' }}>Coverage details</span>
            </summary>
            {!data.coverage.complete ? <Alert type="warning" showIcon message="Partial coverage" style={{ marginTop: 12 }} /> : null}
            <ul style={{ color: 'var(--tere-sub)', columns: '220px', fontSize: 11, lineHeight: 1.8, margin: '12px 0 0', paddingLeft: 18 }}>
                {data.coverage.months.map(month => (
                  <li key={month.month}>
                    {month.month} · {month.source} · productivity {month.productivityAvailable ? 'ready' : 'N/A'} · bugs {month.bugsAvailable ? 'ready' : 'N/A'}
                  </li>
                ))}
            </ul>
          </details>
        </section>
      )}
      {groups.length > 0 && (
        <section aria-labelledby="productivity-groups-heading" style={{ display: 'grid', gap: 12 }}>
          <h3 id="productivity-groups-heading" style={{ color: 'var(--tere-title)', fontSize: 16, margin: '4px 0 0' }}>Member breakdown</h3>
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
              <section key={group} aria-labelledby={`productivity-group-${group}`} style={{ background: 'var(--tere-card-bg)', border: '1px solid var(--tere-card-brd)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ alignItems: 'center', borderBottom: '1px solid var(--tere-card-brd)', display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
                  <h4 id={`productivity-group-${group}`} style={{ color: 'var(--tere-title)', fontSize: 14, margin: 0 }}>{group}</h4>
                  <Tag style={{ margin: 0 }}>{members.length} members</Tag>
                </div>
                {members.length ? (
                  <Table
                    size="small"
                    pagination={false}
                    defaultExpandAllRows={data.range.monthCount === 1}
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
          Active members, productivity percentage, total active bugs, and bugs raised in month. Missing source values remain gaps.
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
              <Line yAxisId="productivity" dataKey="productivityPercent" name="Productivity %" stroke="var(--color-accent-light)" strokeWidth={2} connectNulls={false} />
              <Line yAxisId="count" dataKey="bugsTotal" name="Total bugs" stroke={BUG_LINE_COLOR} strokeWidth={2} connectNulls={false} />
              <Line yAxisId="count" dataKey="bugsRaised" name="Bugs raised" stroke="#f59e0b" strokeDasharray="2 3" strokeWidth={2} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <table className="sr-only">
        <caption>Monthly comparison values; N/A means source data is unavailable.</caption>
        <thead>
          <tr><th>Month</th><th>Active members</th><th>Productivity %</th><th>Total bugs</th><th>Bugs raised</th></tr>
        </thead>
        <tbody>
          {points.map(point => (
            <tr key={point.month}>
              <th scope="row">{point.month}</th>
              <td>{value(point.activeMembers)}</td>
              <td>{value(point.productivityPercent ?? null)}</td>
              <td>{value(point.bugsTotal ?? null)}</td>
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
