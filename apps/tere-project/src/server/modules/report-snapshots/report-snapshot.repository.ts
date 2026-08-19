import { and, eq } from 'drizzle-orm';
import { db } from '@server/lib/db';
import { teamReportingSnapshotCoverage, teamReportingSnapshots } from '@server/db/schema';
import { insertCaptureSnapshotAudit } from '@server/modules/report-capture/report-capture-audit.repository';
import { isCompleteSnapshot, isCompleteSnapshotPublication, snapshotChecksum, snapshotLogicalIdentity } from './report-snapshot';
import type {
  SnapshotPeriodIdentity,
  TeamReportingSnapshot,
  TeamReportingSnapshotCoverage,
  TeamReportingSnapshotPublishOptions,
  TeamReportingSnapshotPublishOutcome,
  TeamReportingSnapshotPublication,
  TeamReportingSnapshotRepository,
} from './report-snapshot';
import type { CaptureSnapshotAuditChange, NewCaptureSnapshotAudit } from '@server/modules/report-capture/report-capture-audit';

function toSnapshot(row: typeof teamReportingSnapshots.$inferSelect): TeamReportingSnapshot {
  return {
    id: row.id,
    boardId: row.boardId,
    boardName: row.boardName,
    periodKind: row.periodKind as 'scrum' | 'kanban',
    sprintId: row.sprintId,
    sprintName: row.sprintName,
    periodStartDate: row.periodStartDate,
    periodEndDate: row.periodEndDate,
    reportingMonth: row.reportingMonth,
    rawJiraInput: row.rawJiraInput,
    calculatedOutput: row.calculatedOutput,
    rawInputCount: row.rawInputCount,
    calculatedOutputCount: row.calculatedOutputCount,
    rawInputChecksum: row.rawInputChecksum,
    calculatedOutputChecksum: row.calculatedOutputChecksum,
    integrityEvidence: row.integrityEvidence,
    requiredSegmentCount: row.requiredSegmentCount,
    capturedAt: row.capturedAt,
  };
}

export class DrizzleTeamReportingSnapshotRepository implements TeamReportingSnapshotRepository {
  constructor(private readonly database: typeof db = db) {}

  async findByLogicalIdentity(identity: SnapshotPeriodIdentity): Promise<TeamReportingSnapshot | null> {
    const where = identity.periodKind === 'scrum'
      ? and(eq(teamReportingSnapshots.boardId, identity.boardId), eq(teamReportingSnapshots.periodKind, 'scrum'), eq(teamReportingSnapshots.sprintId, identity.sprintId))
      : and(eq(teamReportingSnapshots.boardId, identity.boardId), eq(teamReportingSnapshots.periodKind, 'kanban'), eq(teamReportingSnapshots.periodStartDate, identity.periodStartDate), eq(teamReportingSnapshots.periodEndDate, identity.periodEndDate));
    const [row] = await this.database.select().from(teamReportingSnapshots).where(where).limit(1);
    if (!row) return null;
    const snapshot = toSnapshot(row);
    return isCompleteSnapshot(snapshot, await this.findCoverage(snapshot.id)) ? snapshot : null;
  }

  async findCoverage(snapshotId: string): Promise<readonly TeamReportingSnapshotCoverage[]> {
    const rows = await this.database.select({
      segmentKey: teamReportingSnapshotCoverage.segmentKey,
      rawInputCount: teamReportingSnapshotCoverage.rawInputCount,
      calculatedOutputCount: teamReportingSnapshotCoverage.calculatedOutputCount,
      checksum: teamReportingSnapshotCoverage.checksum,
    }).from(teamReportingSnapshotCoverage).where(eq(teamReportingSnapshotCoverage.snapshotId, snapshotId));
    return rows;
  }

  async publish(publication: TeamReportingSnapshotPublication): Promise<TeamReportingSnapshot> {
    return (await this.publishCandidate(publication)).snapshot;
  }

  publishWithOutcome(
    publication: TeamReportingSnapshotPublication,
    options: TeamReportingSnapshotPublishOptions,
  ): Promise<TeamReportingSnapshotPublishOutcome> {
    if (!options || typeof options.runId !== 'string' || !options.runId.trim()) throw new Error('SNAPSHOT_PUBLISH_RUN_ID_INVALID');
    return this.publishCandidate(publication, options.runId);
  }

  private async publishCandidate(
    publication: TeamReportingSnapshotPublication,
    runId?: string,
  ): Promise<TeamReportingSnapshotPublishOutcome> {
    if (!isCompleteSnapshotPublication(publication)) throw new Error('SNAPSHOT_INTEGRITY_INVALID');
    const identity = snapshotLogicalIdentity(publication.snapshot);

    return this.database.transaction(async tx => {
      const [inserted] = await tx.insert(teamReportingSnapshots).values({
        ...publication.snapshot,
        requiredSegmentCount: publication.coverage.length,
      }).onConflictDoNothing().returning();
      if (inserted) {
        await tx.insert(teamReportingSnapshotCoverage).values(publication.coverage.map(segment => ({
          ...segment,
          snapshotId: inserted.id,
        })));
        return { kind: 'created', snapshot: toSnapshot(inserted) };
      }

      const where = identity.periodKind === 'scrum'
        ? and(eq(teamReportingSnapshots.boardId, identity.boardId), eq(teamReportingSnapshots.periodKind, 'scrum'), eq(teamReportingSnapshots.sprintId, identity.sprintId))
        : and(eq(teamReportingSnapshots.boardId, identity.boardId), eq(teamReportingSnapshots.periodKind, 'kanban'), eq(teamReportingSnapshots.periodStartDate, identity.periodStartDate), eq(teamReportingSnapshots.periodEndDate, identity.periodEndDate));
      const [existing] = await tx.select().from(teamReportingSnapshots).where(where).limit(1).for('update');
      if (!existing) throw new Error('SNAPSHOT_PUBLICATION_CONFLICT');
      const snapshot = toSnapshot(existing);
      const coverage = await tx.select({
        segmentKey: teamReportingSnapshotCoverage.segmentKey,
        rawInputCount: teamReportingSnapshotCoverage.rawInputCount,
        calculatedOutputCount: teamReportingSnapshotCoverage.calculatedOutputCount,
        checksum: teamReportingSnapshotCoverage.checksum,
      }).from(teamReportingSnapshotCoverage).where(eq(teamReportingSnapshotCoverage.snapshotId, snapshot.id));
      if (!isCompleteSnapshot(snapshot, coverage)) throw new Error('SNAPSHOT_CONFLICTING_INCOMPLETE');
      if (samePublication(snapshot, coverage, publication)) return { kind: 'unchanged', snapshot };

      if (runId) await insertCaptureSnapshotAudit(tx, snapshotAudit(runId, snapshot, publication));

      const [replacement] = await tx.update(teamReportingSnapshots).set({
        ...publication.snapshot,
        requiredSegmentCount: publication.coverage.length,
        capturedAt: new Date(),
      }).where(eq(teamReportingSnapshots.id, snapshot.id)).returning();
      await tx.delete(teamReportingSnapshotCoverage).where(eq(teamReportingSnapshotCoverage.snapshotId, snapshot.id));
      await tx.insert(teamReportingSnapshotCoverage).values(publication.coverage.map(segment => ({
        ...segment,
        snapshotId: snapshot.id,
      })));
      return { kind: 'replaced', snapshot: toSnapshot(replacement) };
    });
  }
}

function snapshotAudit(
  runId: string,
  previous: TeamReportingSnapshot,
  publication: TeamReportingSnapshotPublication,
): NewCaptureSnapshotAudit {
  const next = publication.snapshot;
  const previousIssues = jiraIssues(previous.rawJiraInput);
  const nextIssues = jiraIssues(next.rawJiraInput);
  const previousKeys = [...previousIssues.keys()].sort();
  const nextKeys = [...nextIssues.keys()].sort();
  const addedJiraKeys = nextKeys.filter(key => !previousIssues.has(key));
  const removedJiraKeys = previousKeys.filter(key => !nextIssues.has(key));
  const changedJiraKeys: CaptureSnapshotAuditChange[] = previousKeys.flatMap(key => {
    const current = nextIssues.get(key);
    if (!current) return [];
    const fields = changedPaths(previousIssues.get(key)!, current).filter(field => field.path !== '$.key');
    return fields.length ? [{ key, fields }] : [];
  });
  const calculatedPaths = changedPaths(previous.calculatedOutput, next.calculatedOutput).map(change => change.path);

  return {
    runId,
    snapshotId: previous.id,
    previousRawInputChecksum: previous.rawInputChecksum,
    nextRawInputChecksum: next.rawInputChecksum,
    previousCalculatedOutputChecksum: previous.calculatedOutputChecksum,
    nextCalculatedOutputChecksum: next.calculatedOutputChecksum,
    addedJiraKeys,
    removedJiraKeys,
    changedJiraKeys,
    calculatedPaths,
    summary: {
      addedJiraKeyCount: addedJiraKeys.length,
      removedJiraKeyCount: removedJiraKeys.length,
      changedJiraKeyCount: changedJiraKeys.length,
      calculatedPathCount: calculatedPaths.length,
      rawInputChanged: previous.rawInputChecksum !== next.rawInputChecksum,
      calculatedOutputChanged: previous.calculatedOutputChecksum !== next.calculatedOutputChecksum,
    },
  };
}

function jiraIssues(value: unknown): Map<string, Record<string, unknown>> {
  const items = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.main) ? value.main : [];
  const result = new Map<string, Record<string, unknown>>();
  for (const item of items) {
    if (!isRecord(item) || typeof item.key !== 'string' || !item.key.trim() || result.has(item.key)) continue;
    result.set(item.key, item);
  }
  return result;
}

function changedPaths(previous: unknown, next: unknown, path = '$'): Array<{ path: string; previous: unknown; next: unknown }> {
  if (sameJson(previous, next)) return [];
  if (Array.isArray(previous) && Array.isArray(next)) {
    return Array.from({ length: Math.max(previous.length, next.length) }, (_, index) => changedPaths(previous[index], next[index], `${path}[${index}]`)).flat();
  }
  if (isRecord(previous) && isRecord(next)) {
    return [...new Set([...Object.keys(previous), ...Object.keys(next)])].sort()
      .flatMap(key => changedPaths(previous[key], next[key], propertyPath(path, key)));
  }
  return [{ path, previous: previous ?? null, next: next ?? null }];
}

function sameJson(previous: unknown, next: unknown): boolean {
  return previous === undefined || next === undefined
    ? previous === next
    : snapshotChecksum(previous) === snapshotChecksum(next);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function propertyPath(path: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

function samePublication(
  snapshot: TeamReportingSnapshot,
  coverage: readonly TeamReportingSnapshotCoverage[],
  publication: TeamReportingSnapshotPublication,
): boolean {
  const candidate = publication.snapshot;
  return snapshot.boardName === candidate.boardName
    && snapshot.periodKind === candidate.periodKind
    && snapshot.sprintId === candidate.sprintId
    && snapshot.sprintName === candidate.sprintName
    && snapshot.periodStartDate === candidate.periodStartDate
    && snapshot.periodEndDate === candidate.periodEndDate
    && snapshot.reportingMonth === candidate.reportingMonth
    && snapshot.rawInputCount === candidate.rawInputCount
    && snapshot.calculatedOutputCount === candidate.calculatedOutputCount
    && snapshot.rawInputChecksum === candidate.rawInputChecksum
    && snapshot.calculatedOutputChecksum === candidate.calculatedOutputChecksum
    && snapshotChecksum(snapshot.integrityEvidence) === snapshotChecksum(candidate.integrityEvidence)
    && coverage.length === publication.coverage.length
    && coverage.every(segment => publication.coverage.some(candidateSegment =>
      candidateSegment.segmentKey === segment.segmentKey
      && candidateSegment.rawInputCount === segment.rawInputCount
      && candidateSegment.calculatedOutputCount === segment.calculatedOutputCount
      && candidateSegment.checksum === segment.checksum,
    ));
}

export const teamReportingSnapshotRepository = new DrizzleTeamReportingSnapshotRepository();
