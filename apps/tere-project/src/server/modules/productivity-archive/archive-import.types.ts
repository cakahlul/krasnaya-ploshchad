export type ArchiveSourceFormat = 'green-2025' | 'blue-2026';
export type ReportingGroupSnapshot = 'Loan' | 'Transaction' | 'User' | null;

export interface NormalizedArchiveRecord {
  readonly archivedMonth: string;
  readonly sprintId: string;
  readonly sprintName: string;
  readonly sprintStartDate: string;
  readonly sprintEndDate: string;
  readonly boardIdSnapshot: number | null;
  readonly boardNameSnapshot: string | null;
  readonly reportingGroupSnapshot: ReportingGroupSnapshot;
  readonly developerIdentityRaw: string;
  readonly developerIdentityNormalized: string;
  readonly developerNameSnapshot: string;
  readonly developerLevelRaw: string | null;
  readonly developerLevelNormalized: string | null;
  readonly mainRoleRaw: string | null;
  readonly mainRoleNormalized: string | null;
  readonly sourceTeam: string | null;
  readonly sourceFormat: ArchiveSourceFormat;
  readonly sourceStatus: string | null;
  readonly spTotal: number | null;
  readonly spCompleted: number | null;
  readonly workingDays?: number | null;
  readonly spProvenance: string | null;
  readonly rawRecord: Readonly<Record<string, unknown>>;
}

export interface ArchiveRowRejection {
  readonly rowIndex: number;
  readonly reasons: readonly string[];
  readonly evidence?: unknown;
}

export interface ArchiveParseResult {
  readonly sourceFormat: ArchiveSourceFormat;
  readonly targetMonth: string;
  readonly records: readonly NormalizedArchiveRecord[];
  readonly rejections: readonly ArchiveRowRejection[];
}
