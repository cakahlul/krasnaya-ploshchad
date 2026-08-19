import { createHash } from 'node:crypto';

export type SnapshotPeriodIdentity =
  | { readonly boardId: number; readonly periodKind: 'scrum'; readonly sprintId: string }
  | { readonly boardId: number; readonly periodKind: 'kanban'; readonly periodStartDate: string; readonly periodEndDate: string };

export type SnapshotPeriodIdentityInput = {
  readonly boardId: number;
  readonly periodKind: 'scrum' | 'kanban';
  readonly sprintId?: string | null;
  readonly periodStartDate: string;
  readonly periodEndDate: string;
};

export interface TeamReportingSnapshot {
  readonly id: string;
  readonly boardId: number;
  readonly boardName: string;
  readonly periodKind: 'scrum' | 'kanban';
  readonly sprintId: string | null;
  readonly sprintName: string | null;
  readonly periodStartDate: string;
  readonly periodEndDate: string;
  readonly reportingMonth: string;
  readonly rawJiraInput: unknown;
  readonly calculatedOutput: unknown;
  readonly rawInputCount: number;
  readonly calculatedOutputCount: number;
  readonly rawInputChecksum: string;
  readonly calculatedOutputChecksum: string;
  readonly integrityEvidence: unknown;
  readonly requiredSegmentCount: number;
  readonly capturedAt: Date;
}

export interface TeamReportingSnapshotCoverage {
  readonly segmentKey: string;
  readonly rawInputCount: number;
  readonly calculatedOutputCount: number;
  readonly checksum: string;
}

export interface TeamReportingSnapshotPublication {
  readonly snapshot: Omit<TeamReportingSnapshot, 'id' | 'requiredSegmentCount' | 'capturedAt'>;
  readonly coverage: readonly TeamReportingSnapshotCoverage[];
}

export interface TeamReportingSnapshotPublishOutcome {
  readonly kind: 'created' | 'unchanged' | 'replaced';
  readonly snapshot: TeamReportingSnapshot;
}

export interface TeamReportingSnapshotPublishOptions {
  readonly runId: string;
}

export interface TeamReportingSnapshotRepository {
  findByLogicalIdentity(identity: SnapshotPeriodIdentity): Promise<TeamReportingSnapshot | null>;
  findCoverage(snapshotId: string): Promise<readonly TeamReportingSnapshotCoverage[]>;
  publish(publication: TeamReportingSnapshotPublication): Promise<TeamReportingSnapshot>;
  publishWithOutcome(
    publication: TeamReportingSnapshotPublication,
    options: TeamReportingSnapshotPublishOptions,
  ): Promise<TeamReportingSnapshotPublishOutcome>;
}

export function snapshotLogicalIdentity(input: SnapshotPeriodIdentityInput): SnapshotPeriodIdentity {
  if (input.periodKind === 'scrum') {
    if (!input.sprintId?.trim()) throw new Error('SCRUM_SPRINT_ID_REQUIRED');
    return { boardId: input.boardId, periodKind: 'scrum', sprintId: input.sprintId };
  }
  return {
    boardId: input.boardId,
    periodKind: 'kanban',
    periodStartDate: input.periodStartDate,
    periodEndDate: input.periodEndDate,
  };
}

export function snapshotChecksum(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

export function isCompleteSnapshot(
  snapshot: TeamReportingSnapshot,
  coverage: readonly TeamReportingSnapshotCoverage[],
): boolean {
  try {
    snapshotLogicalIdentity(snapshot);
    const metadataValid = Number.isInteger(snapshot.boardId)
      && snapshot.boardId > 0
      && isIsoDate(snapshot.periodStartDate)
      && isIsoDate(snapshot.periodEndDate)
      && isIsoDate(snapshot.reportingMonth)
      && snapshot.periodStartDate <= snapshot.periodEndDate
      && snapshot.reportingMonth === `${snapshot.periodEndDate.slice(0, 7)}-01`
      && (snapshot.periodKind === 'scrum' || (snapshot.sprintId === null && snapshot.sprintName === null));
    return metadataValid
      && snapshot.boardName.trim() !== ''
      && snapshot.periodStartDate.trim() !== ''
      && snapshot.periodEndDate.trim() !== ''
      && snapshot.reportingMonth.trim() !== ''
      && snapshot.rawJiraInput !== null
      && snapshot.calculatedOutput !== null
      && snapshot.integrityEvidence !== null
      && snapshotChecksum(snapshot.integrityEvidence) !== ''
      && Number.isInteger(snapshot.rawInputCount)
      && Number.isInteger(snapshot.calculatedOutputCount)
      && snapshot.rawInputCount >= 0
      && snapshot.calculatedOutputCount >= 0
      && snapshot.requiredSegmentCount > 0
      && coverage.length === snapshot.requiredSegmentCount
      && snapshotChecksum(snapshot.rawJiraInput) === snapshot.rawInputChecksum
      && snapshotChecksum(snapshot.calculatedOutput) === snapshot.calculatedOutputChecksum
      && coverage.every(segment => Number.isInteger(segment.rawInputCount)
        && Number.isInteger(segment.calculatedOutputCount)
        && segment.rawInputCount >= 0
        && segment.calculatedOutputCount >= 0
        && segment.segmentKey.trim() !== ''
        && /^[a-f0-9]{64}$/.test(segment.checksum))
      && new Set(coverage.map(segment => segment.segmentKey)).size === coverage.length
      && coverage.reduce((sum, segment) => sum + segment.rawInputCount, 0) === snapshot.rawInputCount
      && coverage.reduce((sum, segment) => sum + segment.calculatedOutputCount, 0) === snapshot.calculatedOutputCount;
  } catch {
    return false;
  }
}

export function isCompleteSnapshotPublication(publication: TeamReportingSnapshotPublication): boolean {
  return isCompleteSnapshot({
    ...publication.snapshot,
    id: '',
    requiredSegmentCount: publication.coverage.length,
    capturedAt: new Date(0),
  }, publication.coverage);
}

function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`);
    return `{${entries.join(',')}}`;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('SNAPSHOT_NON_JSON_VALUE');
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  throw new Error('SNAPSHOT_NON_JSON_VALUE');
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}
