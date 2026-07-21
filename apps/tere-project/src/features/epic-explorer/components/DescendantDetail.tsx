'use client';

import { useThemeColors } from '@src/hooks/useTheme';
import type { ExplorerDescendant } from '../types/epic-explorer.types';
import { StatusBadge } from './StatusBadge';
import { spOrNA, num } from '../utils/format';
import { AdfDescription, hasDescription } from '../utils/adfToReact';
import { issueTypeStyle } from '../utils/issueTypeStyle';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

/** Detail panel for a selected descendant (SLS-16806). null SP legs → "N/A". */
export default function DescendantDetail({ item }: { item: ExplorerDescendant }) {
  const c = useThemeColors();

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Key', value: item.key || '—' },
    { label: 'Type', value: item.issueType || '—' },
    { label: 'Status', value: <StatusBadge status={item.status} category={item.statusCategory} /> },
    { label: 'Sprint', value: item.sprint && item.sprint.trim() !== '' ? item.sprint : '—' },
    { label: 'Assignee', value: item.assignee && item.assignee.trim() !== '' ? item.assignee : '—' },
    { label: 'Category', value: item.isMeeting ? 'Meeting' : item.category === 'techDebt' ? 'Tech-debt' : 'Product' },
    { label: 'Appendix level', value: item.appendixLevel && item.appendixLevel.trim() !== '' ? item.appendixLevel : '—' },
    { label: 'Weight Point', value: num(item.weightPoint) },
    { label: 'Story Point', value: spOrNA(item.storyPoint) },
    { label: 'Meeting SP', value: num(item.spMeeting) },
    { label: 'Defect', value: item.isDefect ? 'Yes' : 'No' },
    ...(item.missingMetricData
      ? [{ label: 'Note', value: 'Missing WP appendix data' as React.ReactNode }]
      : []),
  ];

  const ts = issueTypeStyle(item.issueType, c);

  return (
    <section
      aria-label={`Detail for ${item.key}`}
      style={{ background: c.cardBg, borderRadius: 12, overflow: 'hidden', fontFamily: sans }}
    >
      {/* Type-colored header — matches the hierarchy card's accent. */}
      <div
        style={{
          padding: '16px 18px',
          background: `linear-gradient(135deg, ${ts.bg}, ${c.cardBg} 75%)`,
          borderBottom: `1px solid ${c.cardBrd}`,
          borderLeft: `4px solid ${ts.accent}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span aria-hidden style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: ts.bg, fontSize: 16 }}>
          {ts.glyph}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ts.accent, letterSpacing: 0.2 }}>{item.key}</div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: c.titleCol, margin: '2px 0 0' }}>
            {item.summary || item.key}
          </h4>
        </div>
      </div>
      <div style={{ padding: 18 }}>
      <dl style={{ display: 'grid', gap: 8, margin: 0 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12.5 }}>
            <dt style={{ color: c.subCol }}>{r.label}</dt>
            <dd style={{ margin: 0, color: c.rowCol, fontWeight: 600, textAlign: 'right' }}>{r.value}</dd>
          </div>
        ))}
      </dl>

      {hasDescription(item.description) && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${c.cardBrd}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.subCol, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Description
          </div>
          {/* ADF rendered to React elements — NO HTML injection (see adfToReact.tsx). */}
          <div style={{ margin: '6px 0 0', color: c.rowCol }}>
            <AdfDescription value={item.description} />
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
