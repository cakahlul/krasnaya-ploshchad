export type ReportingGroup = 'Loan' | 'Transaction' | 'User' | null;
export type MonthSource = 'archive' | 'live' | 'partial';

export interface ArchiveCoverage {
  readonly archivedMonth: string;
  readonly importBatchId: string;
  readonly rowCount: number;
}

export interface ArchiveDeveloperSprint {
  readonly archivedMonth: string;
  readonly importBatchId: string;
  readonly sprintId: string;
  readonly sprintStartDate: string;
  readonly sprintEndDate: string;
  readonly boardIdSnapshot: number | null;
  readonly boardNameSnapshot: string | null;
  readonly reportingGroupSnapshot: ReportingGroup;
  readonly developerIdentityNormalized: string;
  readonly developerNameSnapshot: string;
  readonly sourceStatus: string | null;
  readonly spTotal: number | null;
  readonly spTarget?: number | null;
  readonly workingDays?: number | null;
}

export interface ProductivityArchiveRepository {
  getWatermark(): Promise<string | null>;
  findCoverage(month: string): Promise<ArchiveCoverage | null>;
  findRows(month: string, importBatchId: string): Promise<readonly ArchiveDeveloperSprint[]>;
}

export interface MonthRoute {
  readonly source: MonthSource;
  readonly metricBasis: 'SP' | null;
  readonly rows: readonly ArchiveDeveloperSprint[] | null;
  readonly failure: {
    readonly scope: 'productivity';
    readonly reason: string;
    readonly expectedRowCount?: number;
    readonly actualRowCount?: number;
  } | null;
}

type InMemorySeed = {
  watermark?: string | null;
  coverage?: readonly ArchiveCoverage[];
  rows?: readonly ArchiveDeveloperSprint[];
};

const freezeCoverage = (value: ArchiveCoverage): ArchiveCoverage => Object.freeze({ ...value });
const freezeRow = (value: ArchiveDeveloperSprint): ArchiveDeveloperSprint => Object.freeze({ ...value });

export class InMemoryProductivityArchiveRepository implements ProductivityArchiveRepository {
  private readonly watermark: string | null;
  private readonly coverage: readonly ArchiveCoverage[];
  private readonly rows: readonly ArchiveDeveloperSprint[];

  constructor(seed: InMemorySeed = {}) {
    this.watermark = seed.watermark ?? null;
    this.coverage = Object.freeze((seed.coverage ?? []).map(freezeCoverage));
    this.rows = Object.freeze((seed.rows ?? []).map(freezeRow));
  }

  async getWatermark(): Promise<string | null> {
    return this.watermark;
  }

  async findCoverage(month: string): Promise<ArchiveCoverage | null> {
    return this.coverage.find(item => item.archivedMonth === month) ?? null;
  }

  async findRows(month: string, importBatchId: string): Promise<readonly ArchiveDeveloperSprint[]> {
    return Object.freeze(this.rows.filter(item =>
      item.archivedMonth === month && item.importBatchId === importBatchId,
    ).map(freezeRow));
  }
}

export async function routeProductivityMonth(
  month: string,
  repository: ProductivityArchiveRepository,
): Promise<MonthRoute> {
  const coverage = await repository.findCoverage(month);
  if (coverage) {
    const rows = await repository.findRows(month, coverage.importBatchId);
    if (rows.length === 0) {
      return {
        source: 'partial', metricBasis: 'SP', rows: null,
        failure: { scope: 'productivity', reason: 'ARCHIVE_COVERAGE_WITHOUT_ROWS' },
      };
    }
    if (rows.length !== coverage.rowCount) {
      return {
        source: 'partial', metricBasis: 'SP', rows: null,
        failure: {
          scope: 'productivity',
          reason: 'ARCHIVE_COVERAGE_ROW_COUNT_MISMATCH',
          expectedRowCount: coverage.rowCount,
          actualRowCount: rows.length,
        },
      };
    }
    return { source: 'archive', metricBasis: 'SP', rows, failure: null };
  }

  const watermark = await repository.getWatermark();
  if (watermark !== null && month <= watermark) {
    return {
      source: 'partial', metricBasis: 'SP', rows: null,
      failure: { scope: 'productivity', reason: 'ARCHIVE_WATERMARK_GAP' },
    };
  }
  return { source: 'live', metricBasis: null, rows: null, failure: null };
}

export function aggregateArchiveMonth(rows: readonly ArchiveDeveloperSprint[]) {
  const contributing = rows.filter(item => item.sourceStatus !== 'N' && (item.spTotal ?? 0) > 0);
  const identities = new Map<string, { name: string; group: ReportingGroup }>();
  for (const item of contributing) {
    identities.set(item.developerIdentityNormalized, {
      name: item.developerNameSnapshot,
      group: item.reportingGroupSnapshot,
    });
  }
  return {
    activeMembers: identities.size,
    spTotal: contributing.reduce((sum, item) => sum + (item.spTotal ?? 0), 0),
    members: [...identities.entries()].map(([identity, item]) => ({
      identity, name: item.name, group: item.group, resignDate: null as null,
    })),
  };
}
