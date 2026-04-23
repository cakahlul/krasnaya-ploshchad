'use client';

import {
  PieChartOutlined,
  RiseOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  AimOutlined,
  BarChartOutlined,
  TeamOutlined,
  FieldTimeOutlined,
  MedicineBoxOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useTeamReportTransform } from '../hooks/useTeamReportTransform';

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

/* ── Compact Stat Card ────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  subtitle,
  tooltip,
  icon,
  gradient,
  delay,
}: {
  label: string;
  value: string | number | undefined;
  subtitle?: string;
  tooltip: string;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
}) {
  return (
    <Tooltip title={tooltip} placement="bottom" mouseEnterDelay={0.4}>
      <div
        className={`relative overflow-hidden rounded-xl p-3 ${gradient} hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15 transition-all duration-200 cursor-default group animate-fade-in-up`}
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
      >
        <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all duration-300" />
        <div className="relative flex items-center gap-2 mb-1.5">
          <span className="text-white/80 text-sm">{icon}</span>
          <span className="text-white/80 text-[11px] font-medium tracking-wide">{label}</span>
        </div>
        <p className="relative text-xl font-bold text-white leading-tight">{value ?? '-'}</p>
        {subtitle && <p className="relative text-white/60 text-[10px] mt-0.5">{subtitle}</p>}
      </div>
    </Tooltip>
  );
}

/* ── Mini Progress Bar ────────────────────────────────────────────────────── */

function MiniBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-1 w-full rounded-full bg-white/15 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/* ── Enhanced Card (with breakdown rows) ──────────────────────────────────── */

function EnhancedCard({
  label,
  value,
  wpLabel,
  tooltip,
  icon,
  gradient,
  delay,
  rows,
}: {
  label: string;
  value: string | number | undefined;
  wpLabel?: string;
  tooltip: string;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
  rows: { label: string; value?: string; barColor: string; barPercent?: number }[];
}) {
  return (
    <Tooltip title={tooltip} placement="bottom" mouseEnterDelay={0.4}>
      <div
        className={`relative overflow-hidden rounded-xl p-3 ${gradient} hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15 transition-all duration-200 cursor-default group animate-fade-in-up`}
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
      >
        <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all duration-300" />
        <div className="relative flex items-center gap-2 mb-1.5">
          <span className="text-white/80 text-sm">{icon}</span>
          <span className="text-white/80 text-[11px] font-medium tracking-wide">{label}</span>
        </div>
        <div className="relative flex items-baseline gap-1.5 mb-2">
          <p className="text-xl font-bold text-white leading-tight">{value ?? '-'}</p>
          {wpLabel && <span className="text-white/40 text-[9px] uppercase font-semibold">{wpLabel}</span>}
        </div>
        <div className="relative space-y-1.5">
          {rows.map((row) => {
            const pct = row.barPercent ?? parsePercent(row.value);
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="text-white/60">{row.label}</span>
                  <span className="text-white/90 font-semibold">{row.value ?? '-'}</span>
                </div>
                <MiniBar percent={pct} color={row.barColor} />
              </div>
            );
          })}
        </div>
      </div>
    </Tooltip>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function TeamPerformance() {
  const { data } = useTeamReportTransform();
  const dateSubtitle = formatDateRange(data?.sprintStartDate, data?.sprintEndDate);

  const wpTotal = (data?.totalWeightPointsProduct ?? 0) + (data?.totalWeightPointsTechDebt ?? 0);

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-1 bg-gradient-to-b from-indigo-500 to-fuchsia-500 rounded-full" />
        <h2 className="text-lg font-bold text-gray-800">Sprint Performance</h2>
      </div>

      {/* Row 1 — Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard
          label="Total SP" value={data?.totalSP} icon={<BarChartOutlined />}
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600" delay={0}
          tooltip="Sum of all Story Points (SP Product + SP Tech Debt + SP Meeting) across active members. Only members with SP > 0 are included."
        />
        <StatCard
          label="Target SP" value={data?.targetSP} icon={<AimOutlined />}
          gradient="bg-gradient-to-br from-sky-500 to-blue-600" delay={60}
          tooltip="Sum of (Working Days x 8) for each active member. Represents total available hours as SP capacity. Working days exclude weekends, leaves, sick days, and national holidays."
        />
        <StatCard
          label="Avg Productivity" value={data?.averageProductivity} icon={<RiseOutlined />}
          gradient="bg-gradient-to-br from-violet-500 to-fuchsia-600" delay={120}
          tooltip="(Total SP / Target SP) x 100%. Measures how much of the team's SP capacity was actually delivered."
        />
        <StatCard
          label="Avg WP / Hour" value={data?.averageWpPerHour?.toFixed(2)} icon={<RocketOutlined />}
          gradient="bg-gradient-to-br from-fuchsia-500 to-rose-600" delay={180}
          tooltip="Total WP / (Total Working Days x 8). Average weight points delivered per available hour across all active members."
        />
      </div>

      {/* Row 2 — Composition */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <EnhancedCard
          label="Product %" value={data?.productPercentage} wpLabel="wp" icon={<PieChartOutlined />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600" delay={240}
          tooltip="WP: Product WP / (Product WP + Tech Debt WP) x 100%. SP Product: same ratio calculated from story points. Shows how much effort goes to product work vs tech debt."
          rows={[{ label: 'SP Product', value: data?.spProductPercentage, barColor: 'bg-emerald-300' }]}
        />
        <EnhancedCard
          label="Tech Debt %" value={data?.techDebtPercentage} wpLabel="wp" icon={<ToolOutlined />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600" delay={300}
          tooltip="WP: Tech Debt WP / (Product WP + Tech Debt WP) x 100%. SP Tech Debt: tech debt SP / Total SP. SP Meeting: meeting SP / Total SP. Meeting SP comes directly from ALL-Meeting tickets."
          rows={[
            { label: 'SP Tech Debt', value: data?.spTechDebtPercentage, barColor: 'bg-amber-300' },
            { label: 'SP Meeting', value: data?.spMeetingPercentage, barColor: 'bg-orange-300' },
          ]}
        />
        <EnhancedCard
          label="Total Weight Points" value={data?.totalWeightPoints} icon={<ThunderboltOutlined />}
          gradient="bg-gradient-to-br from-cyan-500 to-sky-600" delay={360}
          tooltip="Sum of all weight points across active members. Product WP comes from product tickets, Tech Debt WP from tech debt tickets. WP is calculated from issue complexity and weight config."
          rows={[
            { label: 'Product', value: String(data?.totalWeightPointsProduct ?? 0), barColor: 'bg-cyan-300', barPercent: wpTotal > 0 ? ((data?.totalWeightPointsProduct ?? 0) / wpTotal) * 100 : 0 },
            { label: 'Tech Debt', value: String(data?.totalWeightPointsTechDebt ?? 0), barColor: 'bg-sky-300', barPercent: wpTotal > 0 ? ((data?.totalWeightPointsTechDebt ?? 0) / wpTotal) * 100 : 0 },
          ]}
        />
      </div>

      {/* Row 3 — Team Capacity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard
          label="Selected Working Days" value={data?.totalWorkingDays} subtitle={dateSubtitle} icon={<FieldTimeOutlined />}
          gradient="bg-gradient-to-br from-slate-500 to-gray-600" delay={420}
          tooltip="Calendar working days within the sprint date range. Excludes weekends and national holidays. This is the sprint-level count, not per-member."
        />
        <StatCard
          label="Total Working Days" value={data?.totalMemberWorkingDays} icon={<TeamOutlined />}
          gradient="bg-gradient-to-br from-gray-500 to-zinc-600" delay={480}
          tooltip="Sum of effective working days across all members. Each member's working days exclude their personal leaves, sick days, weekends, and national holidays."
        />
        <StatCard
          label="Total Leave" value={data?.totalLeave} icon={<CoffeeOutlined />}
          gradient="bg-gradient-to-br from-blue-400 to-indigo-500" delay={540}
          tooltip="Sum of confirmed leave days (status: Confirmed) across all members within the sprint period. Only counts weekdays that are not national holidays."
        />
        <StatCard
          label="Total Sick" value={data?.totalSick} icon={<MedicineBoxOutlined />}
          gradient="bg-gradient-to-br from-rose-400 to-red-500" delay={600}
          tooltip="Sum of sick leave days (status: Sick) across all members within the sprint period. Only counts weekdays that are not national holidays."
        />
      </div>
    </div>
  );
}
