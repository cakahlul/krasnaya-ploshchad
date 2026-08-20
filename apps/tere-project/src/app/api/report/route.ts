import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { generateReport, generateReportByDateRange } from '@server/modules/reports/reports.service';
import { filterReportForMember } from '@server/modules/reports/report-filter';
import { boardsService } from '@server/modules/boards/boards.service';
import { sprintService } from '@server/modules/sprint/sprint.service';
import { teamReportingSnapshotRepository } from '@server/modules/report-snapshots/report-snapshot.repository';
import { metadataFromResolution } from '@server/modules/report-source-resolver/report-source-resolver';
import { resolveTeamReport } from '@server/modules/reports/team-report-source-resolver';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project') ?? '';
  const sprint = searchParams.get('sprint') ?? '';
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';
  const epicId = searchParams.get('epicId') ?? undefined;
  const boardIdsParam = searchParams.get('boardIds');
  const boardIds = boardIdsParam === null ? undefined : parseBoardIds(boardIdsParam);

  if (!project) return Response.json({ message: 'project is required' }, { status: 400 });

  if ((startDate || endDate) && !(startDate && endDate)) {
    return Response.json({ message: 'startDate and endDate are both required' }, { status: 400 });
  }
  if (startDate && endDate && (!isValidIsoDate(startDate) || !isValidIsoDate(endDate) || startDate > endDate)) {
    return Response.json({ message: 'startDate and endDate must be valid ISO dates in ascending order' }, { status: 400 });
  }
  if (!startDate && !endDate && !sprint) {
    return Response.json({ message: 'sprint or date range is required' }, { status: 400 });
  }
  if (boardIdsParam !== null && boardIds === null) {
    return Response.json({ message: 'boardIds must be a comma-separated list of positive integers' }, { status: 400 });
  }
  if (boardIds) {
    const boards = await boardsService.findAll();
    const projects = new Set(project.split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
    const projectBoardIds = new Set(
      boards
        .filter(board => !board.isBugMonitoring && projects.has(board.shortName.toLowerCase()))
        .map(board => board.boardId),
    );
    if (boardIds.some(boardId => !projectBoardIds.has(boardId))) {
      return Response.json({ message: 'boardIds must belong to the selected project' }, { status: 400 });
    }
  }
  const resolvedBoardIds = boardIds ?? undefined;

  const resolved = await resolveTeamReport(
    {
      project,
      sprint: sprint || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      boardIds: resolvedBoardIds,
      epicId,
    },
    {
      findBoards: () => boardsService.findAll(),
      findSprints: boardId => sprintService.fetchAllSprint(boardId),
      findSnapshot: identity => teamReportingSnapshotRepository.findByLogicalIdentity(identity),
      generateSprintReport: generateReport,
      generateDateRangeReport: generateReportByDateRange,
    },
  );
  const sourceMetadata = metadataFromResolution(resolved);
  if (!resolved.value) {
    return Response.json(
      { message: 'Report is unavailable', sourceMetadata },
      { status: 503 },
    );
  }
  const report = caller ? filterReportForMember(resolved.value, caller) : resolved.value;
  return Response.json({ ...report, sourceMetadata });
});

function parseBoardIds(value: string): number[] | null {
  const values = value.split(',').map(item => item.trim());
  if (values.length === 0 || values.some(item => !/^\d+$/.test(item))) return null;
  const ids = [...new Set(values.map(Number))];
  return ids.every(id => Number.isInteger(id) && id > 0) ? ids : null;
}

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(value + 'T00:00:00.000Z').toISOString().slice(0, 10) === value;
}
