import type {
  ArchiveParseResult,
  ArchiveRowRejection,
  NormalizedArchiveRecord,
} from './archive-import.types';
import type { ReportingGroupSnapshot } from './archive-import.types';

export interface Green2025ArchiveRow {
  readonly sprintId?: unknown;
  readonly sprintName?: unknown;
  readonly sprintStartDate?: unknown;
  readonly sprintEndDate?: unknown;
  readonly boardId?: unknown;
  readonly boardName?: unknown;
  readonly reportingGroup?: unknown;
  readonly developerIdentity?: unknown;
  readonly developerName?: unknown;
  readonly developerLevel?: unknown;
  readonly mainRole?: unknown;
  readonly sourceTeam?: unknown;
  readonly status?: unknown;
  readonly spProduct?: unknown;
  readonly spTechDebt?: unknown;
  readonly spMeeting?: unknown;
  readonly spTotal?: unknown;
  readonly spCompleted?: unknown;
}

const NULL_MARKERS = new Set(['', '-']);
const GREEN_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const SP_RECONCILIATION_TOLERANCE = 0.000_001;

function nullableText(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  return NULL_MARKERS.has(text) ? null : text;
}

function requiredText(value: unknown): string | null {
  return nullableText(value);
}

function parseGreenDate(value: unknown): string | null {
  const text = nullableText(value);
  const match = text?.match(GREEN_DATE);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseNullableNumber(value: unknown, field: string, reasons: string[]): number | null {
  const text = nullableText(value);
  if (text === null) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    reasons.push(`INVALID_${field}`);
    return null;
  }
  if (parsed < 0) {
    reasons.push(`NEGATIVE_${field}`);
    return null;
  }
  return parsed;
}

function parseNullableInteger(value: unknown, field: string, reasons: string[]): number | null {
  const parsed = parseNullableNumber(value, field, reasons);
  if (parsed !== null && !Number.isInteger(parsed)) {
    reasons.push(`INVALID_${field}`);
    return null;
  }
  return parsed;
}

function parseReportingGroup(value: unknown, reasons: string[]): ReportingGroupSnapshot {
  const group = nullableText(value);
  if (group === null || group === 'Loan' || group === 'Transaction' || group === 'User') return group;
  reasons.push('INVALID_REPORTING_GROUP');
  return null;
}

function isBlankRow(row: Green2025ArchiveRow): boolean {
  return Object.values(row).every(value => nullableText(value) === null);
}

function targetMonth(endDate: string): string {
  return `${endDate.slice(0, 7)}-01`;
}

export function parseGreen2025Archive(rows: readonly Green2025ArchiveRow[]): ArchiveParseResult {
  const parsed: Array<{ rowIndex: number; record: NormalizedArchiveRecord }> = [];
  const rejections: ArchiveRowRejection[] = [];

  rows.forEach((row, rowIndex) => {
    const reasons: string[] = [];
    if (isBlankRow(row)) {
      rejections.push({ rowIndex, reasons: ['BLANK_ROW'] });
      return;
    }

    const sprintId = requiredText(row.sprintId);
    const sprintName = requiredText(row.sprintName);
    const startDate = parseGreenDate(row.sprintStartDate);
    const endDate = parseGreenDate(row.sprintEndDate);
    const identityRaw = typeof row.developerIdentity === 'string' ? row.developerIdentity : null;
    const identityNormalized = nullableText(identityRaw)?.toLowerCase() ?? null;
    const developerName = requiredText(row.developerName);
    if (sprintId === null) reasons.push('MISSING_SPRINT_ID');
    if (sprintName === null) reasons.push('MISSING_SPRINT_NAME');
    if (startDate === null) reasons.push('INVALID_SPRINT_START_DATE');
    if (endDate === null) reasons.push('INVALID_SPRINT_END_DATE');
    if (identityNormalized === null) reasons.push('MISSING_DEVELOPER_IDENTITY');
    if (developerName === null) reasons.push('MISSING_DEVELOPER_NAME');
    if (startDate !== null && endDate !== null && endDate < startDate) reasons.push('SPRINT_END_BEFORE_START');

    const boardIdSnapshot = parseNullableInteger(row.boardId, 'BOARD_ID', reasons);
    const reportingGroupSnapshot = parseReportingGroup(row.reportingGroup, reasons);
    const spProduct = parseNullableNumber(row.spProduct, 'SP_PRODUCT', reasons);
    const spTechDebt = parseNullableNumber(row.spTechDebt, 'SP_TECH_DEBT', reasons);
    const spMeeting = parseNullableNumber(row.spMeeting, 'SP_MEETING', reasons);
    const spTotal = parseNullableNumber(row.spTotal, 'SP_TOTAL', reasons);
    const spCompleted = parseNullableNumber(row.spCompleted, 'SP_COMPLETED', reasons);
    if (spProduct !== null && spTechDebt !== null && spMeeting !== null && spTotal !== null
      && Math.abs(spTotal - (spProduct + spTechDebt + spMeeting)) > SP_RECONCILIATION_TOLERANCE) {
      reasons.push('SP_TOTAL_RECONCILIATION_MISMATCH');
    }
    if (spCompleted !== null && spTotal !== null
      && spCompleted - spTotal > SP_RECONCILIATION_TOLERANCE) {
      reasons.push('SP_COMPLETED_EXCEEDS_TOTAL');
    }
    if (reasons.length > 0 || sprintId === null || sprintName === null || startDate === null || endDate === null
      || identityRaw === null || identityNormalized === null || developerName === null) {
      rejections.push({ rowIndex, reasons });
      return;
    }

    parsed.push({
      rowIndex,
      record: {
        archivedMonth: targetMonth(endDate), sprintId, sprintName, sprintStartDate: startDate, sprintEndDate: endDate,
        boardIdSnapshot, boardNameSnapshot: nullableText(row.boardName), reportingGroupSnapshot,
        developerIdentityRaw: identityRaw, developerIdentityNormalized: identityNormalized,
        developerNameSnapshot: developerName,
        developerLevelRaw: nullableText(row.developerLevel),
        developerLevelNormalized: nullableText(row.developerLevel)?.toLowerCase() ?? null,
        mainRoleRaw: nullableText(row.mainRole), mainRoleNormalized: nullableText(row.mainRole)?.toLowerCase() ?? null,
        sourceTeam: nullableText(row.sourceTeam), sourceFormat: 'green-2025', sourceStatus: nullableText(row.status),
        spTotal, spCompleted, spProvenance: 'green-2025', rawRecord: { ...row },
      },
    });
  });

  const seen = new Set<string>();
  for (const { rowIndex, record } of parsed) {
    const key = `${record.developerIdentityNormalized}\u0000${record.sprintId}\u0000${record.sprintStartDate}`;
    if (seen.has(key)) {
      rejections.push({ rowIndex, reasons: ['DUPLICATE_DEVELOPER_SPRINT_START'] });
    } else {
      seen.add(key);
    }
  }

  const months = new Set(parsed.map(item => item.record.archivedMonth));
  if (months.size > 1) {
    for (const { rowIndex } of parsed) rejections.push({ rowIndex, reasons: ['MIXED_TARGET_MONTHS'] });
  }

  const resultTargetMonth = [...months][0] ?? '';
  return {
    sourceFormat: 'green-2025', targetMonth: resultTargetMonth,
    records: rejections.length === 0 ? parsed.map(item => item.record) : [],
    rejections,
  };
}
