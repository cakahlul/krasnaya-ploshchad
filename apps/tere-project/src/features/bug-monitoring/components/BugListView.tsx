'use client';

import { useState, useMemo } from 'react';
import { useBugMonitoring } from '../hooks/useBugMonitoring';
import { useThemeColors } from '@src/hooks/useTheme';
import { Spin } from 'antd';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

function getSeverityStyle(priority: string, isDark: boolean, accent: string) {
  const p = priority.toLowerCase();
  if (p.includes('highest') || p.includes('critical'))
    return { bg: isDark ? '#3a0f0f' : '#fff1f1', col: '#ef4444', brd: '#ef444430', label: 'Critical' };
  if (p.includes('high'))
    return { bg: isDark ? '#2e1f08' : '#fff8ed', col: '#f59e0b', brd: '#f59e0b30', label: 'High' };
  if (p.includes('medium'))
    return { bg: isDark ? '#0f2030' : '#f0f7ff', col: accent, brd: accent + '30', label: 'Medium' };
  return { bg: isDark ? '#0d1f14' : '#f0fdf7', col: '#10b981', brd: '#10b98130', label: 'Low' };
}

function getStatusDot(status: string, subCol: string) {
  const s = status.toLowerCase();
  if (s.includes('to do') || s.includes('open') || s.includes('detected')) return '#ef4444';
  if (s.includes('progress') || s.includes('review')) return '#f59e0b';
  if (s.includes('done') || s.includes('fixed') || s.includes('resolved') || s.includes('test')) return '#10b981';
  return subCol;
}

interface BugListViewProps {
  boardId: number;
}

export default function BugListView({ boardId }: BugListViewProps) {
  const { data, isLoading, error } = useBugMonitoring(boardId);
  const { isDark, accent, cardBg, cardBrd, titleCol, subCol, rowCol } = useThemeColors();
  const [filter, setFilter] = useState('All');

  const allBugs = data?.allBugs ?? [];

  // Build status counts from allBugs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allBugs.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return counts;
  }, [allBugs]);

  // Get unique statuses for filter buttons
  const statuses = useMemo(() => {
    const uniqueStatuses = Object.keys(statusCounts);
    return ['All', ...uniqueStatuses];
  }, [statusCounts]);

  const filtered = useMemo(() => {
    if (filter === 'All') return allBugs;
    return allBugs.filter(b => b.status === filter);
  }, [allBugs, filter]);

  // Priority count for critical
  const criticalCount = allBugs.filter(b => {
    const p = b.priority.toLowerCase();
    return p.includes('highest') || p.includes('critical');
  }).length;

  const kpis = [
    { label: 'Total', value: allBugs.length },
    { label: 'Critical', value: criticalCount, red: true },
    ...Object.entries(statusCounts).slice(0, 4).map(([status, count]) => ({
      label: status, value: count,
    })),
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48, background: cardBg, borderRadius: 14, border: '1px solid ' + cardBrd }}>
        <Spin size="large" />
        <span style={{ color: subCol, marginLeft: 12, fontFamily: sans }}>Loading bugs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: cardBg, borderRadius: 14, border: '1px solid #ef444430', padding: '24px', color: '#ef4444', fontFamily: sans, fontSize: 13 }}>
        Failed to load bug data. Please try again.
      </div>
    );
  }

  if (allBugs.length === 0) {
    return (
      <div style={{ background: cardBg, borderRadius: 14, border: '1px solid ' + cardBrd, padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>&#127881;</div>
        <div style={{ color: subCol, fontSize: 13, fontFamily: sans }}>No bugs found. Great job!</div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(kpis.length, 6)}, 1fr)`, gap: 10, marginBottom: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: cardBg, borderRadius: 12, padding: 14, border: '1px solid ' + (k.red ? '#ef444430' : cardBrd) }}>
            <div style={{ fontSize: 9.5, color: subCol, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontFamily: sans, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.red ? '#ef4444' : titleCol, fontFamily: mono, letterSpacing: -0.5 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Status Filter Bar */}
      <div style={{ background: cardBg, borderRadius: 12, padding: '10px 14px', border: '1px solid ' + cardBrd, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: subCol, fontFamily: sans, fontWeight: 500 }}>Status:</span>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '4px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: sans,
            background: filter === s ? accent : (isDark ? 'rgba(255,255,255,0.06)' : '#f2f4f8'),
            color: filter === s ? '#fff' : subCol,
            transition: 'all 0.15s',
          }}>
            {s}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: subCol, fontFamily: mono }}>
          {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Bug Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((bug) => {
          const sev = getSeverityStyle(bug.priority, isDark, accent);
          const dotColor = getStatusDot(bug.status, subCol);
          return (
            <div key={bug.key} style={{
              background: cardBg, borderRadius: 12, padding: '14px 16px',
              border: '1px solid ' + cardBrd, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ fontFamily: mono, fontSize: 11.5, color: subCol, width: 80, flexShrink: 0 }}>{bug.key}</div>
              <div style={{ background: sev.bg, border: '1px solid ' + sev.brd, borderRadius: 6, padding: '2px 9px', flexShrink: 0 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: sev.col, fontFamily: sans }}>{sev.label}</span>
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: rowCol, fontFamily: sans, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.summary}</div>
              <div style={{ fontSize: 11.5, color: subCol, fontFamily: sans, width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.assignee || 'Unassigned'}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: subCol, width: 40, textAlign: 'right', flexShrink: 0 }}>{bug.daysOpen}d</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, boxShadow: '0 0 6px ' + dotColor + '80', flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: dotColor, fontFamily: sans, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
