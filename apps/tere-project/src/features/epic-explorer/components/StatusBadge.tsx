'use client';

import { useThemeColors } from '@src/hooks/useTheme';
import type { StatusCategory } from '../types/epic-explorer.types';

/**
 * Status pill (SLS-16805/16806). Status is conveyed by TEXT + a shape glyph +
 * color together — never color alone (WCAG 1.4.1). The glyph differs per
 * category so colorblind users can still distinguish states.
 */
export function StatusBadge({
  status,
  category,
}: {
  status: string;
  category: StatusCategory;
}) {
  const c = useThemeColors();

  const norm = (category || '').toLowerCase();
  const style =
    norm === 'done'
      ? { bg: c.statusSuccessBg, fg: c.statusSuccess, brd: c.statusSuccessBrd, glyph: '✓' }
      : norm === 'in progress'
        ? { bg: c.statusInfoBg, fg: c.statusInfo, brd: c.statusInfoBrd, glyph: '◐' }
        : { bg: c.iconBg, fg: c.subCol, brd: c.cardBrd, glyph: '○' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: style.bg,
        color: style.fg,
        border: `1px solid ${style.brd}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden>{style.glyph}</span>
      {status && status.trim() !== '' ? status : '—'}
    </span>
  );
}
