import { and, eq } from 'drizzle-orm';
import { db } from '@server/lib/db';
import { teamReportingSnapshotCoverage, teamReportingSnapshots } from '@server/db/schema';
import { isCompleteSnapshot, isCompleteSnapshotPublication, snapshotChecksum, snapshotLogicalIdentity } from './report-snapshot';
import type {
  SnapshotPeriodIdentity,
  TeamReportingSnapshot,
  TeamReportingSnapshotCoverage,
  TeamReportingSnapshotPublication,
  TeamReportingSnapshotRepository,
} from './report-snapshot';

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
        return toSnapshot(inserted);
      }

      const where = identity.periodKind === 'scrum'
        ? and(eq(teamReportingSnapshots.boardId, identity.boardId), eq(teamReportingSnapshots.periodKind, 'scrum'), eq(teamReportingSnapshots.sprintId, identity.sprintId))
        : and(eq(teamReportingSnapshots.boardId, identity.boardId), eq(teamReportingSnapshots.periodKind, 'kanban'), eq(teamReportingSnapshots.periodStartDate, identity.periodStartDate), eq(teamReportingSnapshots.periodEndDate, identity.periodEndDate));
      const [existing] = await tx.select().from(teamReportingSnapshots).where(where).limit(1);
      if (!existing) throw new Error('SNAPSHOT_PUBLICATION_CONFLICT');
      const snapshot = toSnapshot(existing);
      const coverage = await tx.select({
        segmentKey: teamReportingSnapshotCoverage.segmentKey,
        rawInputCount: teamReportingSnapshotCoverage.rawInputCount,
        calculatedOutputCount: teamReportingSnapshotCoverage.calculatedOutputCount,
        checksum: teamReportingSnapshotCoverage.checksum,
      }).from(teamReportingSnapshotCoverage).where(eq(teamReportingSnapshotCoverage.snapshotId, snapshot.id));
      if (!isCompleteSnapshot(snapshot, coverage)) throw new Error('SNAPSHOT_CONFLICTING_INCOMPLETE');
      if (samePublication(snapshot, coverage, publication)) return snapshot;

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
      return toSnapshot(replacement);
    });
  }
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
