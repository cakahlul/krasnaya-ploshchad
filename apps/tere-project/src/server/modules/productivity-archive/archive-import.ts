import type { ArchiveParseResult, ArchiveRowRejection, NormalizedArchiveRecord } from './archive-import.types';
export type { ArchiveParseResult, ArchiveRowRejection, ArchiveSourceFormat, NormalizedArchiveRecord } from './archive-import.types';

/** Both actors are required: an operator submits, and the data owner approves the period replacement. */
export interface ArchiveImportApproval {
  readonly operatorId: string;
  readonly dataOwnerApprovedBy?: string;
}

export interface ImportedArchiveRecord extends NormalizedArchiveRecord {
  readonly importBatchId: string;
}

export interface ArchiveCoverageRecord {
  readonly archivedMonth: string;
  readonly importBatchId: string;
  readonly rowCount: number;
}

export interface ArchiveReconciliation {
  readonly targetMonth: string;
  readonly previousRowCount: number;
  readonly writtenRowCount: number;
  readonly replacedRowCount: number;
}

export interface RejectedArchiveEvidence {
  readonly targetMonth: string;
  readonly sourceFormat: ArchiveParseResult['sourceFormat'];
  readonly rejections?: readonly ArchiveRowRejection[];
  readonly reason?: 'DATA_OWNER_APPROVAL_REQUIRED' | 'PARSE_REJECTIONS' | 'EMPTY_ARCHIVE_IMPORT' | 'RECORD_CONTRACT_MISMATCH';
  readonly operatorId: string;
  readonly dataOwnerApprovedBy?: string;
}

export interface WrittenArchiveEvidence {
  readonly importBatchId: string;
  readonly targetMonth: string;
  readonly sourceFormat: ArchiveParseResult['sourceFormat'];
  readonly operatorId: string;
  readonly dataOwnerApprovedBy: string;
  readonly contentFingerprint: string;
  readonly reconciliation: ArchiveReconciliation;
}

export interface ArchiveImportTransaction {
  findSuccessfulImport(targetMonth: string, contentFingerprint: string): Promise<string | null>;
  createImportBatchId(): Promise<string>;
  countRows(targetMonth: string): Promise<number>;
  replaceTargetPeriod(targetMonth: string, records: readonly ImportedArchiveRecord[]): Promise<void>;
  upsertCoverage(coverage: ArchiveCoverageRecord): Promise<void>;
  advanceWatermark(targetMonth: string): Promise<void>;
  writeRejectedEvidence(evidence: RejectedArchiveEvidence): Promise<void>;
  writeImportedEvidence(evidence: WrittenArchiveEvidence): Promise<void>;
}

/** Transaction-only persistence seam. Production adapters implement this port; this module never opens a database connection. */
export interface ArchiveImportPort {
  transaction<T>(work: (transaction: ArchiveImportTransaction) => Promise<T>): Promise<T>;
}

export type ArchiveImportResult =
  | { readonly status: 'IMPORTED'; readonly importBatchId: string; readonly reconciliation: ArchiveReconciliation }
  | { readonly status: 'IDEMPOTENT'; readonly importBatchId: string }
  | { readonly status: 'REJECTED'; readonly reason: 'DATA_OWNER_APPROVAL_REQUIRED' | 'PARSE_REJECTIONS' | 'EMPTY_ARCHIVE_IMPORT' | 'RECORD_CONTRACT_MISMATCH' };

export class ArchiveImportService {
  constructor(private readonly port: ArchiveImportPort) {}

  async import(parsed: ArchiveParseResult, approval: ArchiveImportApproval): Promise<ArchiveImportResult> {
    if (!approval.dataOwnerApprovedBy?.trim()) {
      await this.port.transaction(transaction => transaction.writeRejectedEvidence({
        targetMonth: parsed.targetMonth,
        sourceFormat: parsed.sourceFormat,
        reason: 'DATA_OWNER_APPROVAL_REQUIRED',
        operatorId: approval.operatorId,
      }));
      return { status: 'REJECTED', reason: 'DATA_OWNER_APPROVAL_REQUIRED' };
    }
    const dataOwnerApprovedBy = approval.dataOwnerApprovedBy;

    if (parsed.rejections.length > 0) {
      await this.port.transaction(transaction => transaction.writeRejectedEvidence({
        targetMonth: parsed.targetMonth,
        sourceFormat: parsed.sourceFormat,
        rejections: parsed.rejections,
        reason: 'PARSE_REJECTIONS',
        operatorId: approval.operatorId,
        dataOwnerApprovedBy,
      }));
      return { status: 'REJECTED', reason: 'PARSE_REJECTIONS' };
    }

    if (parsed.records.length === 0) {
      await this.port.transaction(transaction => transaction.writeRejectedEvidence({
        targetMonth: parsed.targetMonth,
        sourceFormat: parsed.sourceFormat,
        reason: 'EMPTY_ARCHIVE_IMPORT',
        operatorId: approval.operatorId,
        dataOwnerApprovedBy,
      }));
      return { status: 'REJECTED', reason: 'EMPTY_ARCHIVE_IMPORT' };
    }

    const contractRejections: ArchiveRowRejection[] = parsed.records.flatMap((record, rowIndex) => {
      const reasons = [
        ...(record.archivedMonth === parsed.targetMonth ? [] : ['ARCHIVED_MONTH_MISMATCH']),
        ...(record.sourceFormat === parsed.sourceFormat ? [] : ['SOURCE_FORMAT_MISMATCH']),
      ];
      return reasons.length === 0 ? [] : [{
        rowIndex,
        reasons,
        evidence: {
          recordArchivedMonth: record.archivedMonth,
          targetMonth: parsed.targetMonth,
          recordSourceFormat: record.sourceFormat,
          parseSourceFormat: parsed.sourceFormat,
        },
      }];
    });
    if (contractRejections.length > 0) {
      await this.port.transaction(transaction => transaction.writeRejectedEvidence({
        targetMonth: parsed.targetMonth,
        sourceFormat: parsed.sourceFormat,
        rejections: contractRejections,
        reason: 'RECORD_CONTRACT_MISMATCH',
        operatorId: approval.operatorId,
        dataOwnerApprovedBy,
      }));
      return { status: 'REJECTED', reason: 'RECORD_CONTRACT_MISMATCH' };
    }

    const contentFingerprint = stableJson({
      sourceFormat: parsed.sourceFormat,
      targetMonth: parsed.targetMonth,
      records: parsed.records,
    });
    return this.port.transaction(async transaction => {
      const existingBatchId = await transaction.findSuccessfulImport(parsed.targetMonth, contentFingerprint);
      if (existingBatchId) return { status: 'IDEMPOTENT', importBatchId: existingBatchId };
      const importBatchId = await transaction.createImportBatchId();

      const previousRowCount = await transaction.countRows(parsed.targetMonth);
      const reconciliation: ArchiveReconciliation = {
        targetMonth: parsed.targetMonth,
        previousRowCount,
        writtenRowCount: parsed.records.length,
        replacedRowCount: previousRowCount,
      };
      const records = parsed.records.map(record => ({
        ...record,
        importBatchId,
      }));

      await transaction.replaceTargetPeriod(parsed.targetMonth, records);
      await transaction.upsertCoverage({ archivedMonth: parsed.targetMonth, importBatchId, rowCount: records.length });
      await transaction.advanceWatermark(parsed.targetMonth);
      await transaction.writeImportedEvidence({
        importBatchId,
        targetMonth: parsed.targetMonth,
        sourceFormat: parsed.sourceFormat,
        operatorId: approval.operatorId,
        dataOwnerApprovedBy,
        contentFingerprint,
        reconciliation,
      });
      return { status: 'IMPORTED', importBatchId, reconciliation };
    });
  }
}

type InMemorySeed = {
  readonly watermark?: string | null;
  readonly coverage?: readonly ArchiveCoverageRecord[];
  readonly rows?: readonly ImportedArchiveRecord[];
  readonly failOn?: 'replaceTargetPeriod' | 'upsertCoverage' | 'advanceWatermark' | 'writeImportedEvidence';
};

type InMemoryState = {
  watermark: string | null;
  nextImportBatchSequence: number;
  coverage: ArchiveCoverageRecord[];
  rows: ImportedArchiveRecord[];
  rejectedEvidence: RejectedArchiveEvidence[];
  writtenEvidence: WrittenArchiveEvidence[];
};

export class InMemoryArchiveImportPort implements ArchiveImportPort {
  private state: InMemoryState;
  private readonly failOn: InMemorySeed['failOn'];

  constructor(seed: InMemorySeed = {}) {
    this.state = {
      watermark: seed.watermark ?? null,
      nextImportBatchSequence: 1,
      coverage: clone([...(seed.coverage ?? [])]),
      rows: clone([...(seed.rows ?? [])]),
      rejectedEvidence: [],
      writtenEvidence: [],
    };
    this.failOn = seed.failOn;
  }

  async transaction<T>(work: (transaction: ArchiveImportTransaction) => Promise<T>): Promise<T> {
    const draft = clone(this.state);
    const result = await work(this.transactionFor(draft));
    this.state = draft;
    return result;
  }

  async snapshot(): Promise<Pick<InMemoryState, 'watermark' | 'coverage' | 'rows'>> {
    const { watermark, coverage, rows } = this.state;
    return clone({ watermark, coverage, rows });
  }

  rejectionEvidence(): readonly RejectedArchiveEvidence[] { return clone(this.state.rejectedEvidence); }
  writtenEvidence(): readonly WrittenArchiveEvidence[] { return clone(this.state.writtenEvidence); }

  private transactionFor(state: InMemoryState): ArchiveImportTransaction {
    const fail = (operation: NonNullable<InMemorySeed['failOn']>) => {
      if (this.failOn === operation) throw new Error(`${operation} failed`);
    };
    return {
      findSuccessfulImport: async (targetMonth, contentFingerprint) =>
        state.writtenEvidence.find(item => item.targetMonth === targetMonth && item.contentFingerprint === contentFingerprint)?.importBatchId ?? null,
      createImportBatchId: async () => `batch-${state.nextImportBatchSequence++}`,
      countRows: async targetMonth => state.rows.filter(item => item.archivedMonth === targetMonth).length,
      replaceTargetPeriod: async (targetMonth, records) => {
        fail('replaceTargetPeriod');
        state.rows = [...state.rows.filter(item => item.archivedMonth !== targetMonth), ...clone(records)];
      },
      upsertCoverage: async coverage => {
        fail('upsertCoverage');
        state.coverage = [...state.coverage.filter(item => item.archivedMonth !== coverage.archivedMonth), clone(coverage)];
      },
      advanceWatermark: async targetMonth => {
        fail('advanceWatermark');
        if (state.watermark === null || targetMonth > state.watermark) state.watermark = targetMonth;
      },
      writeRejectedEvidence: async evidence => { state.rejectedEvidence.push(clone(evidence)); },
      writeImportedEvidence: async evidence => {
        fail('writeImportedEvidence');
        state.writtenEvidence.push(clone(evidence));
      },
    };
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
