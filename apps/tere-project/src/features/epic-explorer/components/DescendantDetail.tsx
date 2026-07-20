'use client';

import { useThemeColors } from '@src/hooks/useTheme';
import type { ExplorerDescendant } from '../types/epic-explorer.types';
import { StatusBadge } from './StatusBadge';
import { spOrNA, num } from '../utils/format';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

/** Detail panel for a selected descendant (SLS-16806). null SP legs → "N/A". */
export default function DescendantDetail({ item }: { item: ExplorerDescendant }) {
  const c = useThemeColors();

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Key', value: item.key || '—' },
    { label: 'Type', value: item.issueType || '—' },
    { label: 'Status', value: <StatusBadge status={item.status} category={item.statusCategory} /> },
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

  return (
    <section
      aria-label={`Detail for ${item.key}`}
      style={{ background: c.cardBg, border: `1px solid ${c.cardBrd}`, borderRadius: 12, padding: 18, fontFamily: sans }}
    >
      <h4 style={{ fontSize: 14, fontWeight: 700, color: c.titleCol, margin: '0 0 12px' }}>
        {item.summary || item.key}
      </h4>
      <dl style={{ display: 'grid', gap: 8, margin: 0 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12.5 }}>
            <dt style={{ color: c.subCol }}>{r.label}</dt>
            <dd style={{ margin: 0, color: c.rowCol, fontWeight: 600, textAlign: 'right' }}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
