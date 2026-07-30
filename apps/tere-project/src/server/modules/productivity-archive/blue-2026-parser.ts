import type {
  ArchiveParseResult,
  ArchiveRowRejection,
  NormalizedArchiveRecord,
  ReportingGroupSnapshot,
} from './archive-import.types';

export interface Blue2026ArchiveRow {
  readonly sprintId?: unknown;
  readonly sprintName?: unknown;
  readonly sprintStartDate?: unknown;
  readonly sprintEndDate?: unknown;
  readonly boardId?: unknown;
  readonly boardName?: unknown;
  readonly tribe?: unknown;
  readonly developerIdentity?: unknown;
  readonly developerName?: unknown;
  readonly developerLevel?: unknown;
  readonly mainRole?: unknown;
  readonly status?: unknown;
  readonly spTotal?: unknown;
  readonly spTarget?: unknown;
  readonly spCompleted?: unknown;
  readonly spProvenance?: unknown;
  readonly workingDays?: unknown;
  readonly workingDay?: unknown;
  readonly dayOfWork?: unknown;
}

const BLUE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SP_TOLERANCE = 0.01;

const text = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' || trimmed === '-' ? null : trimmed;
};

const rawText = (value: unknown): string | null => typeof value === 'string' ? value : null;

const normalizedText = (value: unknown): string | null => text(value)?.toLocaleLowerCase() ?? null;

const parseNumber = (value: unknown): number | null | 'invalid' => {
  if (value === null || value === undefined) return null;
  const normalized = typeof value === 'string' ? value.trim() : value;
  if (normalized === '' || normalized === '-') return null;
  const number = typeof normalized === 'number' ? normalized : typeof normalized === 'string' ? Number(normalized) : NaN;
  return Number.isFinite(number) && number >= 0 ? number : 'invalid';
};

const isRealBlueDate = (value: string | null): value is string => {
  if (value === null || !BLUE_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const archiveMonth = (date: string): string => `${date.slice(0, 7)}-01`;

const reportingGroupFor = (tribe: string | null): ReportingGroupSnapshot => {
  switch (tribe?.toLocaleLowerCase()) {
    case 'loan': return 'Loan';
    case 'transaction': return 'Transaction';
    case 'user': return 'User';
    default: return null;
  }
};

const isBlankRow = (row: Blue2026ArchiveRow): boolean => Object.values(row).every(value => text(value) === null);

const rejection = (rowIndex: number, reason: string): ArchiveRowRejection =>
  Object.freeze({ rowIndex, reasons: Object.freeze([reason]) });

/**
 * Pure, full-input validation for the Blue-2026 spreadsheet layout. A single
 * rejection prevents records from being handed to the import seam.
 */
export function parseBlue2026Archive(rows: readonly Blue2026ArchiveRow[]): ArchiveParseResult {
  const parsed: NormalizedArchiveRecord[] = [];
  const rejections: ArchiveRowRejection[] = [];
  const identities = new Set<string>();
  let targetMonth: string | null = null;

  rows.forEach((row, rowIndex) => {
    if (isBlankRow(row)) {
      rejections.push(rejection(rowIndex, 'BLANK_ROW'));
      return;
    }

    const sprintId = text(row.sprintId);
    const sprintName = text(row.sprintName);
    const startDate = text(row.sprintStartDate);
    const endDate = text(row.sprintEndDate);
    const developerIdentityRaw = rawText(row.developerIdentity) ?? '';
    const developerIdentity = normalizedText(row.developerIdentity);
    const developerName = text(row.developerName);

    if (!isRealBlueDate(startDate) || !isRealBlueDate(endDate)) {
      rejections.push(rejection(rowIndex, BLUE_DATE.test(startDate ?? '') && BLUE_DATE.test(endDate ?? '') ? 'INVALID_DATE' : 'INVALID_BLUE_DATE_FORMAT'));
      return;
    }
    if (endDate < startDate) {
      rejections.push(rejection(rowIndex, 'SPRINT_END_BEFORE_START'));
      return;
    }
    if (sprintId === null || sprintName === null || developerName === null) {
      rejections.push(rejection(rowIndex, 'MISSING_REQUIRED_FIELD'));
      return;
    }
    if (developerIdentity === null) {
      rejections.push(rejection(rowIndex, 'MISSING_DEVELOPER_IDENTITY'));
      return;
    }

    const duplicateKey = `${developerIdentity}\u0000${sprintId}\u0000${startDate}`;
    if (identities.has(duplicateKey)) {
      rejections.push(rejection(rowIndex, 'DUPLICATE_DEVELOPER_SPRINT_START'));
      return;
    }
    identities.add(duplicateKey);

    const spTotal = parseNumber(row.spTotal);
    const spTarget = parseNumber(row.spTarget);
    const spCompleted = parseNumber(row.spCompleted);
    const workingDaysValue = row.workingDays ?? row.workingDay ?? row.dayOfWork;
    const workingDays = parseNumber(workingDaysValue);
    if (spTotal === 'invalid' || spTarget === 'invalid' || spCompleted === 'invalid' || workingDays === 'invalid') {
      rejections.push(rejection(rowIndex, 'NONNEGATIVE_NUMBER_REQUIRED'));
      return;
    }
    if (spTotal !== null && spCompleted !== null && spCompleted - spTotal > SP_TOLERANCE) {
      rejections.push(rejection(rowIndex, 'SP_RECONCILIATION_FAILED'));
      return;
    }

    const month = archiveMonth(endDate);
    if (targetMonth !== null && targetMonth !== month) {
      rejections.push(rejection(rowIndex, 'TARGET_MONTH_MISMATCH'));
      return;
    }
    targetMonth = month;

    const tribe = text(row.tribe);
    const status = text(row.status);
    parsed.push(Object.freeze({
      archivedMonth: month, sprintId, sprintName, sprintStartDate: startDate, sprintEndDate: endDate,
      boardIdSnapshot: typeof row.boardId === 'number' && Number.isInteger(row.boardId) ? row.boardId : null,
      boardNameSnapshot: text(row.boardName), reportingGroupSnapshot: reportingGroupFor(tribe),
      developerIdentityRaw, developerIdentityNormalized: developerIdentity, developerNameSnapshot: developerName,
      developerLevelRaw: rawText(row.developerLevel), developerLevelNormalized: normalizedText(row.developerLevel),
      mainRoleRaw: rawText(row.mainRole), mainRoleNormalized: normalizedText(row.mainRole), sourceTeam: tribe,
      sourceFormat: 'blue-2026', sourceStatus: status, spTotal, ...(spTarget === null ? {} : { spTarget }), spCompleted, ...(workingDays === null ? {} : { workingDays }), spProvenance: text(row.spProvenance),
      rawRecord: Object.freeze({ ...row }),
    }));
  });

  if (rows.length === 0) rejections.push(rejection(0, 'EMPTY_INPUT'));
  return Object.freeze({
    sourceFormat: 'blue-2026', targetMonth: targetMonth ?? '',
    records: Object.freeze(rejections.length === 0 ? parsed : []),
    rejections: Object.freeze(rejections),
  });
}
