/** SP legs may be null → render "N/A" (SLS-16809). 0 is a real value, kept. */
export function spOrNA(v: number | null | undefined): string {
  return v === null || v === undefined ? 'N/A' : String(v);
}

/** Numeric WP/count — 0 is valid; nullish falls back to 0. */
export function num(v: number | null | undefined): number {
  return v ?? 0;
}

/** Already-a-percentage value (0..100) → "NN%". */
export function pct(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return 'N/A';
  return `${Math.round(v)}%`;
}

/** Ratio n/d → "NN%" (0 total → "N/A"). */
export function ratioPct(n: number, d: number): string {
  if (!d) return 'N/A';
  return `${Math.round((n / d) * 100)}%`;
}
