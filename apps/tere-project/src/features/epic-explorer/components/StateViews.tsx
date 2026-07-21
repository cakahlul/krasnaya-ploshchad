'use client';

import { useThemeColors } from '@src/hooks/useTheme';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

/**
 * Epic Explorer state views (SLS-16813). Each conveys a distinct branch of the
 * detail request. Errors use role="alert" (assertive); informational/empty
 * states use role="status" aria-live="polite" so screen readers announce the
 * change without stealing focus. Status is never color-only — every card leads
 * with a text label and icon glyph.
 */

interface StateCardProps {
  glyph: string;
  title: string;
  message: string;
  tone: 'error' | 'warning' | 'info' | 'neutral';
  assertive?: boolean;
}

function StateCard({ glyph, title, message, tone, assertive }: StateCardProps) {
  const c = useThemeColors();
  const toneMap = {
    error: { bg: c.statusDangerBg, brd: c.statusDangerBrd, fg: c.statusDanger },
    warning: { bg: c.statusWarningBg, brd: c.statusWarningBrd, fg: c.statusWarning },
    info: { bg: c.statusInfoBg, brd: c.statusInfoBrd, fg: c.statusInfo },
    neutral: { bg: c.cardBg, brd: c.cardBrd, fg: c.subCol },
  }[tone];

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      style={{
        background: toneMap.bg,
        border: `1px solid ${toneMap.brd}`,
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        fontFamily: sans,
        marginTop: 12,
      }}
    >
      <span aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>
        {glyph}
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: toneMap.fg }}>{title}</div>
        <p style={{ fontSize: 12.5, color: c.subCol, margin: '4px 0 0' }}>{message}</p>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <StateCard
      glyph="🔍"
      tone="warning"
      title="Epic not found"
      message="This epic does not exist in the selected project, or it may have been moved or deleted."
    />
  );
}

export function NoAccess() {
  return (
    <StateCard
      glyph="🔒"
      tone="warning"
      title="No access to this epic"
      message="You do not have permission to view this epic in Jira. Ask a project admin if you believe this is a mistake."
    />
  );
}

export function Unauthorized() {
  return (
    <StateCard
      glyph="⚠️"
      tone="error"
      assertive
      title="Session expired"
      message="Your session is no longer valid. Please sign in again to continue."
    />
  );
}

export function JiraError({ detail }: { detail?: string | null }) {
  return (
    <StateCard
      glyph="🛑"
      tone="error"
      assertive
      title="Could not load epic from Jira"
      message={
        detail ||
        'Jira is temporarily unavailable or returned an error. Please try again in a moment.'
      }
    />
  );
}

export function EmptyEpic() {
  return (
    <StateCard
      glyph="📭"
      tone="info"
      title="No child issues"
      message="This epic loaded successfully but has no stories, tasks, or sub-tasks under it yet."
    />
  );
}

export function PartialAuthzNote({ hiddenCount }: { hiddenCount: number }) {
  if (hiddenCount <= 0) return null;
  return (
    <StateCard
      glyph="👁️"
      tone="info"
      title={`${hiddenCount} item${hiddenCount === 1 ? '' : 's'} hidden`}
      message={`${hiddenCount} child issue${
        hiddenCount === 1 ? ' is' : 's are'
      } not shown because you do not have Jira access to ${
        hiddenCount === 1 ? 'it' : 'them'
      }. Metrics below exclude the hidden item${hiddenCount === 1 ? '' : 's'}.`}
    />
  );
}
