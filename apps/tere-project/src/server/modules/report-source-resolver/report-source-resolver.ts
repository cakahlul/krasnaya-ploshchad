import type { SnapshotPeriodIdentity } from '@server/modules/report-snapshots/report-snapshot';

export type ReportSource = 'archive' | 'snapshot' | 'jira';
export type ReportUnit =
  | { readonly kind: 'team-reporting-sprint'; readonly identity: SnapshotPeriodIdentity }
  | { readonly kind: 'productivity-month'; readonly month: string };

export interface SourceCoverage {
  /** Number of segments/records required for this unit. */
  readonly expected: number;
  /** Number of segments/records actually present and validated. */
  readonly covered: number;
  /** A cutoff is not complete coverage, even when its counts happen to match. */
  readonly cutoff: boolean;
}

export type CoverageStatus = 'complete' | 'partial' | 'unavailable';

export interface ReportCoverage {
  readonly status: CoverageStatus;
  readonly expected: number;
  readonly covered: number;
}

/** Additive, machine-readable provenance shared by report consumers. */
export interface ReportSourceMetadata {
  readonly source: ReportSource | 'partial' | 'unavailable' | 'mixed';
  readonly coverage: ReportCoverage;
  readonly fallback: boolean;
  readonly reason: string | null;
  readonly warning: string | null;
  readonly attemptedSources: readonly { source: ReportSource; detail: string | null }[];
  readonly snapshotTimestamp: string | null;
}

export function reportSourceMetadata(source: ReportSource, detail: string | null = null): ReportSourceMetadata {
  return {
    source,
    coverage: { status: 'complete', expected: 1, covered: 1 },
    fallback: false,
    reason: detail,
    warning: null,
    attemptedSources: [{ source, detail }],
    snapshotTimestamp: null,
  };
}

export function metadataFromResolution<T>(resolution: ReportSourceResolution<T>): ReportSourceMetadata {
  const selected = resolution.source === 'partial' || resolution.source === 'unavailable' ? null : resolution.source;
  return {
    source: resolution.source,
    coverage: resolution.coverage,
    fallback: selected !== null && resolution.attempts.some(attempt => attempt.source !== selected),
    reason: resolution.attempts.find(attempt => attempt.detail)?.detail ?? null,
    warning: resolution.source === 'partial' || resolution.source === 'unavailable' ? 'Report coverage is incomplete' : null,
    attemptedSources: resolution.attempts.map(attempt => ({ source: attempt.source, detail: attempt.detail ?? null })),
    snapshotTimestamp: null,
  };
}

export async function resolveJiraValue<T>(value: T, expected = 1): Promise<ReportSourceResolution<T>> {
  const reportUnits = Math.max(1, expected);
  return resolveReportSource(
    { kind: 'productivity-month', month: 'team-reporting' },
    [{
      source: 'jira',
      resolve: async () => ({ source: 'jira', coverage: { expected: reportUnits, covered: reportUnits, cutoff: false }, value }),
    }],
  );
}

export interface ReportSourceAttempt<T = unknown> {
  readonly source: ReportSource;
  readonly coverage?: SourceCoverage;
  readonly value?: T;
  readonly detail?: string;
}

export interface ReportSourcePort<U extends ReportUnit, T = unknown> {
  readonly source: ReportSource;
  resolve(unit: U): Promise<ReportSourceAttempt<T>>;
}

export type ReportSourceResolution<T = unknown> =
  | { readonly source: ReportSource; readonly value: T; readonly coverage: ReportCoverage; readonly attempts: readonly ReportSourceAttempt<T>[] }
  | { readonly source: 'partial' | 'unavailable'; readonly value: null; readonly coverage: ReportCoverage; readonly attempts: readonly ReportSourceAttempt<T>[] };

export function coverageStatus(coverage: SourceCoverage | undefined): CoverageStatus {
  if (!coverage || coverage.expected <= 0 || coverage.covered <= 0) return 'unavailable';
  if (!coverage.cutoff && coverage.covered === coverage.expected) return 'complete';
  return 'partial';
}

function coverageOf(attempts: readonly ReportSourceAttempt[]): ReportCoverage {
  const complete = attempts.find(attempt => coverageStatus(attempt.coverage) === 'complete');
  if (complete) return {
    status: 'complete',
    expected: complete.coverage!.expected,
    covered: complete.coverage!.covered,
  };
  const partial = attempts.find(attempt => coverageStatus(attempt.coverage) === 'partial');
  return partial ? {
    status: 'partial',
    expected: partial.coverage!.expected,
    covered: partial.coverage!.covered,
  } : { status: 'unavailable', expected: 0, covered: 0 };
}

const SOURCE_PRECEDENCE: readonly ReportSource[] = ['archive', 'snapshot', 'jira'];

export async function resolveReportSource<U extends ReportUnit, T = unknown>(
  unit: U,
  ports: readonly ReportSourcePort<U, T>[],
): Promise<ReportSourceResolution<T>> {
  const attempts: ReportSourceAttempt<T>[] = [];
  const orderedPorts = [...ports].sort((left, right) => SOURCE_PRECEDENCE.indexOf(left.source) - SOURCE_PRECEDENCE.indexOf(right.source));
  for (const port of orderedPorts) {
    let normalized: ReportSourceAttempt<T>;
    try {
      const attempt = await port.resolve(unit);
      const sourceMismatch = attempt.source !== port.source;
      // A detail is explicit rejection/corruption evidence, not selectable data.
      // Drop coverage so a malformed complete-looking attempt cannot win resolution.
      normalized = sourceMismatch || attempt.detail
        ? {
          ...attempt,
          source: port.source,
          coverage: undefined,
          detail: sourceMismatch ? `source identity mismatch: ${attempt.source}` : attempt.detail,
        }
        : attempt;
      if (!normalized.detail) {
        const status = coverageStatus(normalized.coverage);
        if (status === 'partial') normalized = { ...normalized, detail: normalized.coverage?.cutoff ? 'coverage is cutoff' : 'coverage is incomplete' };
        if (status === 'unavailable') normalized = { ...normalized, detail: 'no complete coverage evidence' };
      }
    } catch (error) {
      normalized = {
        source: port.source,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    attempts.push(normalized);
    if (coverageStatus(normalized.coverage) === 'complete') break;
  }
  const coverage = coverageOf(attempts);
  const complete = attempts.find(attempt => coverageStatus(attempt.coverage) === 'complete');
  if (complete) {
    return { source: complete.source, value: complete.value as T, coverage, attempts };
  }
  return { source: coverage.status === 'partial' ? 'partial' : 'unavailable', value: null, coverage, attempts };
}
