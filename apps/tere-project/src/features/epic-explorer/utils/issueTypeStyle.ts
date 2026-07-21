import type { useThemeColors } from '@src/hooks/useTheme';

type Colors = ReturnType<typeof useThemeColors>;

export interface IssueTypeStyle {
  /** Accent color for the left bar / icon chip. */
  accent: string;
  /** Soft background for the icon chip. */
  bg: string;
  /** Single-glyph emoji label — fun, distinguishes types at a glance. */
  glyph: string;
  /** Short label shown on the type chip. */
  label: string;
}

/**
 * Maps a Jira issue type to a color + glyph so the hierarchy reads at a glance
 * instead of a monotone table. Colors are pulled from the theme status palette
 * so all three themes (light / void / crimson) stay coherent.
 */
export function issueTypeStyle(issueType: string, c: Colors): IssueTypeStyle {
  const t = issueType.toLowerCase();
  if (t === 'epic') return { accent: c.statusPurple, bg: c.statusPurpleBg, glyph: '🏛️', label: 'Epic' };
  if (t === 'story') return { accent: c.statusSuccess, bg: c.statusSuccessBg, glyph: '📗', label: 'Story' };
  if (t === 'bug' || t === 'defect') return { accent: c.statusDanger, bg: c.statusDangerBg, glyph: '🐞', label: issueType };
  if (t === 'sub-task' || t === 'subtask') return { accent: c.statusInfo, bg: c.statusInfoBg, glyph: '↳', label: 'Sub-task' };
  if (t === 'task') return { accent: c.statusInfo, bg: c.statusInfoBg, glyph: '📘', label: 'Task' };
  // Fallback: accent brand color.
  return { accent: c.accent, bg: c.iconBg, glyph: '◆', label: issueType || 'Issue' };
}
