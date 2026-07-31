'use client';

import { useState } from 'react';
import { Alert, DatePicker, Select, Table, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ProductivitySummaryExportButton } from './ProductivitySummaryExportButton';
import { useThemeColors } from '@src/hooks/useTheme';
import { REPORTING_GROUPS, type ReportingGroup } from '@src/shared/types/reporting-group.types';
import {
  buildProductivitySummaryParams,
  inclusiveMonthCount,
  type ProductivitySummaryParams,
  validateProductivitySummaryRange,
} from '../utils/productivity-summary-range';
import {
  type CanonicalProductivitySummary,
  ProductivitySummaryCanonicalResult,
  ProductivitySummaryComparisonChart,
  ProductivitySummaryRetry,
} from './ProductivitySummaryStates';
import {
  type SummaryChartPoint,
  streamProductivitySummary,
} from '../utils/productivity-summary-stream';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

interface ProductivitySummaryMemberDto {
  name: string;
  wpProduct: number;
  wpTech: number;
  wpTotal: number;
  workingDays: number;
  averageWp: number;
  expectedAverageWp: number;
  spProduct: number;
  spTechDebt: number;
  spMeeting: number;
  spTotal: number;
  wpProductivity: string;
  productivityRate: string;
}

interface ProductivitySummaryData {
  summary: {
    totalDaysOfWorks: number;
    totalWpExpected: number;
    averageWpExpected: number;
    productivityExpected: number;
    totalWpProduced: number;
    averageWpProduced: number;
    productivityProduced: number;
    productivityProduceVsExpected: number;
  };
  details: ProductivitySummaryMemberDto[];
}

export default function ProductivitySummary() {
  const [selectedRange, setSelectedRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs(), dayjs()]);
  const [selectedGroups, setSelectedGroups] = useState<ReportingGroup[]>([]);
  const [data, setData] = useState<ProductivitySummaryData | CanonicalProductivitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryRequest, setRetryRequest] = useState<ProductivitySummaryParams | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [partialChart, setPartialChart] = useState<SummaryChartPoint[]>([]);
  const T = useThemeColors();

  const startMonth = selectedRange[0].format('YYYY-MM');
  const endMonth = selectedRange[1].format('YYYY-MM');
  const monthCount = inclusiveMonthCount(startMonth, endMonth);
  const request = buildProductivitySummaryParams(startMonth, endMonth, selectedGroups, 'SP');

  const fetchData = async (request: ProductivitySummaryParams) => {
    const validationError = validateProductivitySummaryRange(request.startMonth, request.endMonth);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    setRetryRequest(request);
    setProgress(null);
    setPartialChart([]);
    try {
      let failed = false;
      await streamProductivitySummary(request as unknown as Record<string, string>, (event) => {
        switch (event.type) {
          case 'month':
            setProgress({ completed: event.completed, total: event.total });
            break;
          case 'point':
            setProgress({ completed: event.completed, total: event.total });
            setPartialChart(points => [...points, event.point].sort((a, b) => a.month.localeCompare(b.month)));
            break;
          case 'complete':
            setData(event.data as CanonicalProductivitySummary);
            break;
          case 'error':
            failed = true;
            setError(event.message);
            break;
        }
      });
      if (failed) setPartialChart([]);
    } catch (error) {
      console.error('Failed to fetch productivity summary:', error);
      setError('Unable to load productivity data. Please try again.');
      setPartialChart([]);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handleCalculate = () => void fetchData(request);

  const canonicalData = data && 'range' in data ? data : null;
  const legacyData = data && !('range' in data) ? data : null;

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: T.rowCol, fontFamily: sans, fontSize: 13 }}>{text}</span>
      ),
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'SP Product',
      dataIndex: 'spProduct',
      key: 'spProduct',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ fontWeight: 600, color: T.accent, fontFamily: mono, fontSize: 13 }}>{val.toFixed(2)}</span>
      ),
      sorter: (a: any, b: any) => a.spProduct - b.spProduct,
    },
    {
      title: 'SP Tech Debt',
      dataIndex: 'spTechDebt',
      key: 'spTechDebt',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ fontWeight: 600, color: T.accent, fontFamily: mono, fontSize: 13 }}>{val.toFixed(2)}</span>
      ),
      sorter: (a: any, b: any) => a.spTechDebt - b.spTechDebt,
    },
    {
      title: 'SP Meeting',
      dataIndex: 'spMeeting',
      key: 'spMeeting',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ fontWeight: 600, color: T.accent, fontFamily: mono, fontSize: 13 }}>{(val ?? 0).toFixed(2)}</span>
      ),
      sorter: (a: any, b: any) => (a.spMeeting ?? 0) - (b.spMeeting ?? 0),
    },
    {
      title: 'SP Total',
      dataIndex: 'spTotal',
      key: 'spTotal',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ fontWeight: 700, color: T.titleCol, fontFamily: mono, fontSize: 13 }}>{val.toFixed(2)}</span>
      ),
      sorter: (a: any, b: any) => a.spTotal - b.spTotal,
    },
    {
      title: 'Productivity Rate',
      dataIndex: 'productivityRate',
      key: 'productivityRate',
      align: 'center' as const,
      render: (val: string) => {
        const num = parseFloat(val);
        const color = num >= 100 ? T.statusSuccess : T.statusDanger;
        return <span style={{ fontWeight: 700, color, fontFamily: mono, fontSize: 13 }}>{val}</span>;
      },
      sorter: (a: any, b: any) => parseFloat(a.productivityRate) - parseFloat(b.productivityRate),
    },
    {
      title: 'Working Days',
      dataIndex: 'workingDays',
      key: 'workingDays',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: T.rowCol, fontFamily: mono, fontSize: 13 }}>{val}</span>
      ),
      sorter: (a: any, b: any) => a.workingDays - b.workingDays,
    },
    {
      title: 'WP Product',
      dataIndex: 'wpProduct',
      key: 'wpProduct',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: T.rowCol, fontFamily: mono, fontSize: 13 }}>{val}</span>
      ),
      sorter: (a: any, b: any) => a.wpProduct - b.wpProduct,
    },
    {
      title: 'WP Tech',
      dataIndex: 'wpTech',
      key: 'wpTech',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: T.rowCol, fontFamily: mono, fontSize: 13 }}>{val}</span>
      ),
      sorter: (a: any, b: any) => a.wpTech - b.wpTech,
    },
    {
      title: 'WP Total',
      dataIndex: 'wpTotal',
      key: 'wpTotal',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{
          fontWeight: 700, color: T.titleCol, fontFamily: mono, fontSize: 13,
          background: T.iconBg,
          padding: '3px 8px', borderRadius: 6,
        }}>
          {val.toFixed(2)}
        </span>
      ),
      sorter: (a: any, b: any) => a.wpTotal - b.wpTotal,
    },
    {
      title: 'Avg WP / Day',
      dataIndex: 'averageWp',
      key: 'averageWp',
      align: 'center' as const,
      render: (val: number, record: any) => {
        const isAboveTarget = val >= record.expectedAverageWp;
        return (
          <Tooltip title={`Target: ${record.expectedAverageWp.toFixed(2)}`}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{
                fontSize: 13, fontWeight: 700, fontFamily: mono,
                color: isAboveTarget ? T.statusSuccess : T.statusDanger,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {val.toFixed(2)}
                {isAboveTarget ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              </span>
            </div>
          </Tooltip>
        );
      },
      sorter: (a: any, b: any) => a.averageWp - b.averageWp,
    },
    {
      title: 'Expected Avg WP',
      dataIndex: 'expectedAverageWp',
      key: 'expectedAverageWp',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: T.subCol, fontFamily: mono, fontSize: 13 }}>{val.toFixed(2)}</span>
      ),
      sorter: (a: any, b: any) => a.expectedAverageWp - b.expectedAverageWp,
    },
  ];

  // Derived values for productivity cards
  const vsExpected = legacyData ? legacyData.summary.productivityProduceVsExpected * 100 : 0;
  const isPositiveDiff = vsExpected >= 0;

  // Color map for KPI card tinting
  const colorMap = {
    default: { bg: T.cardBg, val: T.titleCol, border: T.cardBrd },
    success: { bg: T.statusSuccessBg, val: T.statusSuccess, border: T.statusSuccessBrd },
    danger: { bg: T.statusDangerBg, val: T.statusDanger, border: T.statusDangerBrd },
  };

  // KPI cards configuration
  const kpiCards = legacyData ? [
    { label: 'Working Days', value: legacyData.summary.totalDaysOfWorks, unit: 'days', theme: 'default' as const },
    { label: 'Avg WP Expected', value: legacyData.summary.averageWpExpected.toFixed(2), unit: '/ day', theme: 'default' as const },
    { label: 'Avg WP Produced', value: legacyData.summary.averageWpProduced.toFixed(2), unit: '/ day', theme: 'default' as const },
    { label: 'Total WP Expected', value: legacyData.summary.totalWpExpected.toFixed(1), unit: 'WP', theme: 'default' as const },
    { label: 'Total WP Produced', value: legacyData.summary.totalWpProduced.toFixed(1), unit: 'WP', theme: isPositiveDiff ? 'success' as const : 'danger' as const },
    { label: 'vs Expected', value: `${vsExpected >= 0 ? '+' : ''}${vsExpected.toFixed(2)}%`, unit: 'diff', theme: isPositiveDiff ? 'success' as const : 'danger' as const },
  ] : [];

  return (
    <div className="tere-table tere-input" style={{ padding: 24, fontFamily: sans }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.titleCol, margin: 0, fontFamily: sans, letterSpacing: -0.3 }}>
            Productivity Summary
          </h2>
          <p style={{ color: T.subCol, margin: '4px 0 0', fontSize: 12.5, fontFamily: sans }}>
            Productivity overview by reporting Group
          </p>
        </div>
        <ProductivitySummaryExportButton
          month={selectedRange[0].month() + 1}
          year={selectedRange[0].year()}
          request={request}
        />
      </div>

      {/* Filter Row */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12,
        background: T.cardBg, borderRadius: 12, padding: '14px 16px',
        border: `1px solid ${T.cardBrd}`, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{
            fontSize: 9.5, fontWeight: 600, color: T.subCol,
            textTransform: 'uppercase', letterSpacing: 1, fontFamily: sans,
          }}>
            Month range
          </label>
          <DatePicker.RangePicker
            data-qa="productivity-summary-range"
            picker="month"
            minDate={dayjs('2025-01-01')}
            maxDate={dayjs()}
            value={selectedRange}
            onChange={(dates) => {
              if (dates?.[0] && dates[1]) setSelectedRange([dates[0], dates[1]]);
            }}
            format="MMMM YYYY"
            allowClear={false}
            className="text-sm font-medium min-w-[280px]"
            aria-label="Productivity summary month range"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{
            fontSize: 9.5, fontWeight: 600, color: T.subCol,
            textTransform: 'uppercase', letterSpacing: 1, fontFamily: sans,
          }}>
            Groups
          </label>
          <Select<ReportingGroup[]>
            data-qa="productivity-summary-group-filter"
            mode="multiple"
            value={selectedGroups}
            onChange={setSelectedGroups}
            options={REPORTING_GROUPS.map(group => ({
              value: group,
              label: group,
            }))}
            placeholder="All groups"
            aria-label="Reporting groups"
            style={{ minWidth: 220 }}
          />
        </div>
        <button
          type="button"
          data-qa="productivity-summary-calculate"
          onClick={handleCalculate}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 20px', borderRadius: 10,
            background: T.accent, color: '#fff',
            fontWeight: 700, fontSize: 13, fontFamily: sans,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          Calculate
        </button>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 20 }}
          action={(
            retryRequest && <ProductivitySummaryRetry request={retryRequest} onRetry={fetchData} />
          )}
        />
      )}

      {loading ? (
        /* Loading State */
        <div data-qa="productivity-summary-progress" aria-live="polite" aria-busy="true" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 400, background: T.cardBg, borderRadius: 14,
          border: `1px solid ${T.cardBrd}`,
        }}>
          <div
            className="animate-spin"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `3px solid ${T.cardBrd}`, borderTopColor: T.accent,
            }}
          />
          <p style={{ color: T.subCol, marginTop: 16, fontFamily: sans, fontSize: 13 }}>
            {progress
              ? `Calculating month ${progress.completed} of ${progress.total}...`
              : `Calculating ${monthCount} month${monthCount === 1 ? '' : 's'}...`}
          </p>
          {partialChart.length > 1 ? (
            <div style={{ marginTop: 20, width: '100%' }}>
              <ProductivitySummaryComparisonChart
                points={partialChart}
                metricBasis={partialChart[0].metricBasis}
              />
            </div>
          ) : null}
        </div>
      ) : canonicalData ? (
        <ProductivitySummaryCanonicalResult data={canonicalData} />
      ) : legacyData ? (
        <div>
          {/* KPI Stat Cards - 6 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
            {kpiCards.map((card) => {
              const colors = colorMap[card.theme];
              return (
                <KpiCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  unit={card.unit}
                  T={T}
                  bgColor={colors.bg}
                  borderColor={colors.border}
                  valueColor={colors.val}
                />
              );
            })}
          </div>

          {/* Two Large Productivity Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {/* Expected */}
            <div style={{
              background: T.cardBg, borderRadius: 14, padding: '20px 22px',
              border: `1px solid ${T.cardBrd}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: T.subCol, fontFamily: sans, letterSpacing: 0.8, marginBottom: 10 }}>
                Productivity Expected
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, fontFamily: mono, color: T.accent, letterSpacing: -1, lineHeight: 1 }}>
                {legacyData.summary.productivityExpected.toFixed(3)}
              </div>
              <div style={{ fontSize: 11, color: T.subCol, fontFamily: sans, marginTop: 6 }}>
                WP per hour
              </div>
            </div>
            {/* Produced */}
            <div style={{
              background: T.cardBg, borderRadius: 14, padding: '20px 22px',
              border: `1px solid ${T.cardBrd}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: T.subCol, fontFamily: sans, letterSpacing: 0.8, marginBottom: 10 }}>
                Productivity Produced
              </div>
              <div style={{
                fontSize: 36, fontWeight: 700, fontFamily: mono, letterSpacing: -1, lineHeight: 1,
                color: isPositiveDiff ? T.statusSuccess : T.statusDanger,
              }}>
                {legacyData.summary.productivityProduced.toFixed(3)}
              </div>
              <div style={{ fontSize: 11, color: T.subCol, fontFamily: sans, marginTop: 6 }}>
                WP per hour
              </div>
            </div>
          </div>

          {/* Member Breakdown Table */}
          <div style={{
            background: T.cardBg, borderRadius: 14,
            border: `1px solid ${T.cardBrd}`, overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.cardBrd}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.titleCol, margin: 0, fontFamily: sans }}>
                Member Breakdown
              </h3>
            </div>
            <Table
              dataSource={legacyData.details}
              columns={columns}
              rowKey="name"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 'max-content' }}
              className="tere-table"
            />
          </div>
        </div>
      ) : (
        /* Empty State */
        <div style={{
          background: T.cardBg, borderRadius: 14,
          border: `1px solid ${T.cardBrd}`,
          padding: '60px 24px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: T.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.iconStr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <p style={{ color: T.subCol, fontSize: 13, fontWeight: 500, fontFamily: sans, margin: 0 }}>
            Select a month range and optional groups, then click Calculate
          </p>
        </div>
      )}
    </div>
  );
}

/* ── KPI Stat Card ── */
function KpiCard({ label, value, T, unit, valueColor, bgColor, borderColor }: {
  label: string;
  value: string | number;
  T: ReturnType<typeof useThemeColors>;
  unit?: string;
  valueColor?: string;
  bgColor?: string;
  borderColor?: string;
}) {
  return (
    <div style={{
      background: bgColor ?? T.cardBg, borderRadius: 12, padding: '16px 14px',
      border: `1px solid ${borderColor ?? T.cardBrd}`,
    }}>
      <div style={{
        fontSize: 9.5, fontWeight: 600, color: T.subCol,
        textTransform: 'uppercase', letterSpacing: 1, fontFamily: sans,
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24, fontWeight: 700, color: valueColor ?? T.titleCol,
        fontFamily: mono, letterSpacing: -0.5, lineHeight: 1,
      }}>
        {value}
      </div>
      {unit && (
        <div style={{ fontSize: 10, color: T.subCol, fontFamily: sans, marginTop: 4 }}>
          {unit}
        </div>
      )}
    </div>
  );
}
