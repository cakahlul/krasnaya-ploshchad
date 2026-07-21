'use client';

import { useThemeColors } from '@src/hooks/useTheme';
import type { ExplorerEpicInfo } from '../types/epic-explorer.types';
import { StatusBadge } from './StatusBadge';
import { AdfDescription, hasDescription } from '../utils/adfToReact';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

/** empty/absent value → em dash. */
function orDash(v: string | null | undefined): string {
  return v && v.trim() !== '' ? v : '—';
}

/**
 * Epic header card (SLS-16805). Metadata-first: key, status, assignee, dates
 * lead; the description is rendered LAST and as PLAIN TEXT only — never via
 * dangerouslySetInnerHTML.
 */
export default function EpicInfoCard({ epic }: { epic: ExplorerEpicInfo }) {
  const c = useThemeColors();

  const meta: { label: string; value: string; node?: React.ReactNode }[] = [
    { label: 'Key', value: orDash(epic.key) },
    { label: 'Status', value: orDash(epic.status), node: <StatusBadge status={epic.status} category={epic.statusCategory} /> },
    { label: 'Assignee', value: orDash(epic.assignee) },
    { label: 'Sprint', value: orDash(epic.sprint) },
    { label: 'Created', value: orDash(epic.created) },
    { label: 'Updated', value: orDash(epic.updated) },
  ];

  return (
    <section
      aria-label="Epic information"
      style={{
        background: c.cardBg,
        border: `1px solid ${c.cardBrd}`,
        borderRadius: 14,
        overflow: 'hidden',
        fontFamily: sans,
        boxShadow: `0 1px 0 ${c.cardBrd}`,
      }}
    >
      {/* Gradient accent header — epics are the top of the hierarchy, give them presence. */}
      <div
        style={{
          padding: '18px 20px',
          background: `linear-gradient(135deg, ${c.statusPurpleBg}, ${c.cardBg} 70%)`,
          borderBottom: `1px solid ${c.cardBrd}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: c.statusPurpleBg,
            border: `1px solid ${c.statusPurpleBrd}`,
            fontSize: 20,
          }}
        >
          🏛️
        </span>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: c.titleCol, margin: 0 }}>
          {orDash(epic.summary)}
        </h3>
      </div>
      <div style={{ padding: 20 }}>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px 24px',
          margin: 0,
        }}
      >
        {meta.map(m => (
          <div key={m.label}>
            <dt style={{ fontSize: 11, fontWeight: 600, color: c.subCol, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {m.label}
            </dt>
            <dd style={{ margin: '3px 0 0', fontSize: 13, color: c.rowCol }}>
              {m.node ?? m.value}
            </dd>
          </div>
        ))}
      </dl>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.subCol, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          Description
        </div>
        {/* ADF rendered to React elements — NO HTML injection (see adfToReact.tsx). */}
        <div style={{ margin: '6px 0 0', color: c.rowCol }}>
          {hasDescription(epic.description) ? <AdfDescription value={epic.description} /> : '—'}
        </div>
      </div>
      </div>
    </section>
  );
}
