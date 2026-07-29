export type ArchiveSourceFormat = 'green-2025' | 'blue-2026';

export interface NormalizedArchiveRecord {
  readonly archivedMonth: string; readonly sourceFormat: ArchiveSourceFormat;
  readonly sprintId: string; readonly sprintName: string; readonly sprintStartDate: string; readonly sprintEndDate: string;
  readonly boardIdSnapshot: number | null; readonly boardNameSnapshot: string | null;
  readonly reportingGroupSnapshot: 'Loan' | 'Transaction' | 'User' | null;
  readonly developerIdentityRaw: string; readonly developerIdentityNormalized: string; readonly developerNameSnapshot: string;
  readonly developerLevelRaw: string | null; readonly developerLevelNormalized: string | null;
  readonly mainRoleRaw: string | null; readonly mainRoleNormalized: string | null;
  readonly sourceTeam: string | null; readonly sourceStatus: string | null;
  readonly spTotal: number | null; readonly spCompleted: number | null; readonly spProvenance: string | null;
  readonly rawRecord: Readonly<Record<string, unknown>>;
}

export interface ArchiveRowRejection {
  readonly rowIndex: number;
  readonly reasons: readonly string[];
  readonly evidence?: Readonly<Record<string, unknown>>;
}

export interface ArchiveParseResult {
  readonly sourceFormat: ArchiveSourceFormat;
  readonly targetMonth: string;
  readonly records: readonly NormalizedArchiveRecord[];
  readonly rejections: readonly ArchiveRowRejection[];
}
