'use client';

import { useThemeColors } from '@src/hooks/useTheme';
import type { ExplorerMetrics, ExplorerWpConfig } from '../types/epic-explorer.types';
import { spOrNA, num, pct, ratioPct } from '../utils/format';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <div style={{ background: c.headBg, border: `1px solid ${c.cardBrd}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: c.subCol, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: c.titleCol, marginTop: 3 }}>{value}</div>
    </div>
  );
}

/**
 * Aggregate metrics (SLS-16809). SP legs null → "N/A"; a coverage note reports
 * how much of the descendant tree carries WP appendix data (and which issues
 * lack it); the applied WP config (effective date + weights) is shown so the
 * numbers are traceable to a config version.
 */
export default function MetricsPanel({
  metrics,
  wpConfig,
}: {
  metrics: ExplorerMetrics;
  wpConfig: ExplorerWpConfig;
}) {
  const c = useThemeColors();
  const wp = metrics.weightPoint;
  const sp = metrics.storyPoint;
  const sc = metrics.statusCounts;
  const comp = metrics.composition;
  const cov = metrics.coverage;
  const missing = metrics.missingMetricData ?? [];

  return (
    <section
      aria-label="Epic metrics"
      style={{ background: c.cardBg, border: `1px solid ${c.cardBrd}`, borderRadius: 12, padding: 20, fontFamily: sans }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, color: c.titleCol, margin: '0 0 14px' }}>Metrics</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        <Stat
          label="Completion (by count)"
          value={`${pct(metrics.completionByCount?.percent)} (${num(metrics.completionByCount?.done)}/${num(metrics.completionByCount?.total)})`}
        />
        <Stat label="WP total" value={num(wp?.total)} />
        <Stat label="WP product / tech-debt" value={`${num(wp?.product)} / ${num(wp?.techDebt)}`} />
        <Stat label="SP total" value={spOrNA(sp?.total)} />
        <Stat label="SP product / tech-debt" value={`${spOrNA(sp?.product)} / ${spOrNA(sp?.techDebt)}`} />
        <Stat label="SP meeting" value={spOrNA(sp?.meeting)} />
        <Stat label="Defects" value={num(metrics.defectCount)} />
      </div>

      {/* Composition */}
      {comp && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.subCol, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Composition
          </div>
          <div style={{ fontSize: 12.5, color: c.rowCol, marginTop: 4 }}>
            Product {pct(comp.productPercent)} · Tech-debt {pct(comp.techDebtPercent)}
          </div>
        </div>
      )}

      {/* Status breakdown */}
      {sc && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.subCol, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Status breakdown
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 12, color: c.rowCol }}>To Do: <strong>{num(sc.toDo)}</strong></span>
            <span style={{ fontSize: 12, color: c.rowCol }}>In Progress: <strong>{num(sc.inProgress)}</strong></span>
            <span style={{ fontSize: 12, color: c.rowCol }}>Done: <strong>{num(sc.done)}</strong></span>
          </div>
        </div>
      )}

      {/* Coverage note */}
      <p role="note" style={{ marginTop: 14, fontSize: 12, color: c.subCol }}>
        WP data coverage: {ratioPct(num(cov?.withMetricData), num(cov?.total))} ({num(cov?.withMetricData)}/{num(cov?.total)} issues).
        {missing.length > 0
          ? ` ${missing.length} issue${missing.length === 1 ? '' : 's'} missing WP data (${missing
              .slice(0, 8)
              .join(', ')}${missing.length > 8 ? '…' : ''}) — WP totals exclude ${
              missing.length === 1 ? 'it' : 'them'
            }.`
          : ' All issues have WP data.'}
      </p>

      {/* WP config provenance */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${c.cardBrd}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.subCol, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          Applied WP config
        </div>
        <div style={{ fontSize: 12, color: c.rowCol, marginTop: 4 }}>
          Effective {wpConfig?.effectiveDate || '—'}
        </div>
        {wpConfig?.weights && Object.keys(wpConfig.weights).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {Object.entries(wpConfig.weights).map(([k, v]) => (
              <span key={k} style={{ fontSize: 11.5, color: c.subCol }}>
                {k}: <strong style={{ color: c.rowCol }}>{v}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
