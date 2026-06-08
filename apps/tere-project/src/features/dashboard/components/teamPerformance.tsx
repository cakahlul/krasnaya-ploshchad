'use client';

import { Tooltip } from 'antd';
import { useTeamReportTransform } from '../hooks/useTeamReportTransform';
import { useThemeColors } from '@src/hooks/useTheme';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

function parsePercent(val?: string): number {
  if (!val) return 0;
  const n = parseFloat(val.replace('%', ''));
  return Number.isNaN(n) ? 0 : Math.min(n, 100);
}

function formatDateRange(startDate?: string, endDate?: string): string | undefined {
  if (!startDate || !endDate) return undefined;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(startDate)} — ${fmt(endDate)}`;
}

/* ── Gradient Stat Card ──────────────────────────────────────────────────── */

function GradientCard({
  label,
  value,
  subtitle,
  tooltip,
  gradient,
}: {
  label: string;
  value: string | number | undefined;
  subtitle?: string;
  tooltip: string;
  gradient: string;
}) {
  return (
    <Tooltip
      title={<span style={{ fontFamily: sans, fontSize: 11 }}>{tooltip}</span>}
      placement="bottom"
      mouseEnterDelay={0.4}
    >
      <div
        style={{
          background: gradient,
          borderRadius: 14,
          padding: '14px 16px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'default',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            right: -20,
            top: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            fontSize: 9.5,
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontFamily: sans,
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#fff',
            fontFamily: mono,
            letterSpacing: -0.5,
            position: 'relative',
          }}
        >
          {value ?? '-'}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.55)',
              fontFamily: sans,
              marginTop: 2,
              position: 'relative',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </Tooltip>
  );
}

/* ── Enhanced Gradient Card (with breakdown rows) ────────────────────────── */

function EnhancedGradientCard({
  label,
  value,
  wpLabel,
  tooltip,
  rows,
  gradient,
}: {
  label: string;
  value: string | number | undefined;
  wpLabel?: string;
  tooltip: string;
  rows: { label: string; value?: string; barPercent?: number }[];
  gradient: string;
}) {
  return (
    <Tooltip
      title={<span style={{ fontFamily: sans, fontSize: 11 }}>{tooltip}</span>}
      placement="bottom"
      mouseEnterDelay={0.4}
    >
      <div
        style={{
          background: gradient,
          borderRadius: 14,
          padding: '14px 16px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'default',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            right: -20,
            top: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            fontSize: 9.5,
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontFamily: sans,
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              fontFamily: mono,
              letterSpacing: -0.5,
              position: 'relative',
            }}
          >
            {value ?? '-'}
          </div>
          {wpLabel && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                fontFamily: sans,
                position: 'relative',
              }}
            >
              {wpLabel}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          {rows.map((row) => {
            const pct = row.barPercent ?? parsePercent(row.value);
            return (
              <div key={row.label}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.65)',
                      fontFamily: sans,
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.9)',
                      fontFamily: mono,
                    }}
                  >
                    {row.value ?? '-'}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 99,
                    background: 'rgba(255,255,255,0.15)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 99,
                      width: `${pct}%`,
                      background: 'rgba(255,255,255,0.9)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Tooltip>
  );
}

/* ── Gradient Palette ────────────────────────────────────────────────────── */

function buildGradients(T: ReturnType<typeof import('@src/hooks/useTheme').useThemeColors>) {
  return {
    totalSP: `linear-gradient(135deg, ${T.statusPurple}, ${T.accent})`,
    targetSP: `linear-gradient(135deg, ${T.statusInfo}, ${T.accent})`,
    avgProductivity: `linear-gradient(135deg, ${T.statusPurple}, ${T.statusOrange})`,
    avgWpHour: `linear-gradient(135deg, ${T.statusOrange}, ${T.statusDanger})`,
    product: `linear-gradient(135deg, ${T.statusSuccess}, ${T.accent})`,
    techDebt: `linear-gradient(135deg, ${T.statusWarning}, ${T.statusOrange})`,
    totalWP: `linear-gradient(135deg, ${T.accent}, ${T.accentL})`,
    selectedDays: 'linear-gradient(135deg, #64748b, #475569)',
    totalDays: 'linear-gradient(135deg, #6b7280, #4b5563)',
    totalLeave: `linear-gradient(135deg, ${T.statusInfo}, ${T.statusPurple})`,
    totalSick: `linear-gradient(135deg, ${T.statusDanger}, ${T.statusOrange})`,
  };
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function TeamPerformance() {
  const { data } = useTeamReportTransform();
  const { titleCol, ...T } = useThemeColors();
  const GRADIENTS = buildGradients(T as any);
  const dateSubtitle = formatDateRange(data?.sprintStartDate, data?.sprintEndDate);

  const wpTotal = (data?.totalWeightPointsProduct ?? 0) + (data?.totalWeightPointsTechDebt ?? 0);

  return (
    <div style={{ paddingTop: 16, paddingBottom: 16 }}>
      {/* Section Header */}
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: titleCol, fontFamily: sans }}>
          Sprint Performance
        </span>
      </div>

      {/* Row 1 — Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <GradientCard
          label="Total SP"
          value={data?.totalSP}
          tooltip="Sum of all Story Points (SP Product + SP Tech Debt + SP Meeting) across active members. Only members with SP > 0 are included."
          gradient={GRADIENTS.totalSP}
        />
        <GradientCard
          label="Target SP"
          value={data?.targetSP}
          tooltip="Sum of (Working Days x 8) for each active member. Represents total available hours as SP capacity. Working days exclude weekends, leaves, sick days, and national holidays."
          gradient={GRADIENTS.targetSP}
        />
        <GradientCard
          label="Avg Productivity"
          value={data?.averageProductivity}
          tooltip="(Total SP / Target SP) x 100%. Measures how much of the team's SP capacity was actually delivered."
          gradient={GRADIENTS.avgProductivity}
        />
        <GradientCard
          label="Avg WP / Hour"
          value={data?.averageWpPerHour?.toFixed(2)}
          tooltip="Total WP / (Total Working Days x 8). Average weight points delivered per available hour across all active members."
          gradient={GRADIENTS.avgWpHour}
        />
      </div>

      {/* Row 2 — Composition */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}
      >
        <EnhancedGradientCard
          label="Product %"
          value={data?.productPercentage}
          wpLabel="wp"
          tooltip="WP: Product WP / (Product WP + Tech Debt WP) x 100%. SP Product: same ratio calculated from story points. Shows how much effort goes to product work vs tech debt."
          rows={[{ label: 'SP Product', value: data?.spProductPercentage }]}
          gradient={GRADIENTS.product}
        />
        <EnhancedGradientCard
          label="Tech Debt %"
          value={data?.techDebtPercentage}
          wpLabel="wp"
          tooltip="WP: Tech Debt WP / (Product WP + Tech Debt WP) x 100%. SP Tech Debt: tech debt SP / Total SP. SP Meeting: meeting SP / Total SP. Meeting SP comes directly from ALL-Meeting tickets."
          rows={[
            { label: 'SP Tech Debt', value: data?.spTechDebtPercentage },
            { label: 'SP Meeting', value: data?.spMeetingPercentage },
          ]}
          gradient={GRADIENTS.techDebt}
        />
        <EnhancedGradientCard
          label="Total Weight Points"
          value={data?.totalWeightPoints}
          tooltip="Sum of all weight points across active members. Product WP comes from product tickets, Tech Debt WP from tech debt tickets. WP is calculated from issue complexity and weight config."
          rows={[
            {
              label: 'Product',
              value: String(data?.totalWeightPointsProduct ?? 0),
              barPercent: wpTotal > 0 ? ((data?.totalWeightPointsProduct ?? 0) / wpTotal) * 100 : 0,
            },
            {
              label: 'Tech Debt',
              value: String(data?.totalWeightPointsTechDebt ?? 0),
              barPercent: wpTotal > 0 ? ((data?.totalWeightPointsTechDebt ?? 0) / wpTotal) * 100 : 0,
            },
          ]}
          gradient={GRADIENTS.totalWP}
        />
      </div>

      {/* Row 3 — Team Capacity */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 10 }}
      >
        <GradientCard
          label="Selected Working Days"
          value={data?.totalWorkingDays}
          subtitle={dateSubtitle}
          tooltip="Calendar working days within the sprint date range. Excludes weekends and national holidays. This is the sprint-level count, not per-member."
          gradient={GRADIENTS.selectedDays}
        />
        <GradientCard
          label="Total Working Days"
          value={data?.totalMemberWorkingDays}
          tooltip="Sum of effective working days across all members. Each member's working days exclude their personal leaves, sick days, weekends, and national holidays."
          gradient={GRADIENTS.totalDays}
        />
        <GradientCard
          label="Total Leave"
          value={data?.totalLeave}
          tooltip="Sum of leave days (status: Leave) across all members within the sprint period. Only counts weekdays that are not national holidays."
          gradient={GRADIENTS.totalLeave}
        />
        <GradientCard
          label="Total Sick"
          value={data?.totalSick}
          tooltip="Sum of sick leave days (status: Sick) across all members within the sprint period. Only counts weekdays that are not national holidays."
          gradient={GRADIENTS.totalSick}
        />
      </div>
    </div>
  );
}
