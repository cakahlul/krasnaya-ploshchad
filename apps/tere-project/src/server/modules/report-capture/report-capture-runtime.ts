import { boardsService } from '@server/modules/boards/boards.service';
import { sprintService } from '@server/modules/sprint/sprint.service';
import { findReportMembers, generateReport, generateReportByDateRange } from '@server/modules/reports/reports.service';
import * as reportsRepository from '@server/modules/reports/reports.repository';
import { teamReportingSnapshotRepository } from '@server/modules/report-snapshots/report-snapshot.repository';
import { resolvePeriodIdentity } from '@shared/utils/period-identity';
import type { JiraIssueEntity } from '@shared/types/report.types';
import { createDeveloperCaptureService, type CaptureBoard, type CapturePeriod, type DeveloperCaptureService } from './report-capture';

const DAY = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const boardById = new Map<number, Awaited<ReturnType<typeof boardsService.findAll>>[number]>();

interface CaptureInputs {
  readonly main: JiraIssueEntity[];
  readonly planned: Record<string, JiraIssueEntity[]>;
}

async function loadBoards() {
  const boards = await boardsService.findAll();
  boards.forEach(board => boardById.set(board.boardId, board));
  return boards.map(board => ({ boardId: board.boardId, boardName: board.name, isBugMonitoring: board.isBugMonitoring } satisfies CaptureBoard));
}

async function periods(board: CaptureBoard, window: { startDate: string; endDate: string }): Promise<readonly CapturePeriod[]> {
  const config = boardById.get(board.boardId);
  if (!config) return [];
  if (!config.isKanban) {
    const sprints = await sprintService.fetchAllSprint(board.boardId);
    return sprints.flatMap(sprint => {
      const startDate = datePart(sprint.startDate);
      const endDate = datePart(sprint.endDate);
      if (!startDate || !endDate || startDate < window.startDate || endDate > window.endDate) return [];
      return [{ boardId: board.boardId, boardName: board.boardName, periodKind: 'scrum', sprintId: String(sprint.id), sprintName: sprint.name, periodStartDate: startDate, periodEndDate: endDate }];
    });
  }
  if (!config.kanbanCycleStartDate) return [];
  const result = new Map<string, CapturePeriod>();
  for (let time = parseDate(window.startDate); time <= parseDate(window.endDate); time += DAY) {
    const date = new Date(time).toISOString().slice(0, 10);
    const identity = resolvePeriodIdentity({ boardId: board.boardId, isKanban: true, kanbanCycleStartDate: config.kanbanCycleStartDate, date });
    if (identity.kind !== 'kanban' || identity.startDate < window.startDate || identity.endDate > window.endDate) continue;
    const key = `${identity.startDate}/${identity.endDate}`;
    result.set(key, { boardId: board.boardId, boardName: board.boardName, periodKind: 'kanban', periodStartDate: identity.startDate, periodEndDate: identity.endDate });
  }
  return [...result.values()];
}

async function fetchJira(period: CapturePeriod) {
  const board = boardById.get(period.boardId);
  if (!board) throw new Error('CAPTURE_BOARD_INVALID');
  const members = await findReportMembers(board.shortName);
  const assignees = members.map(member => member.jiraId).filter((id): id is string => Boolean(id));
  const allBoards = await boardsService.findAll();
  const isSubtaskType = await boardsService.hasSubtaskType(board.shortName);
  const isShowPlannedWP = allBoards.some(item => item.isShowPlannedWP && item.shortName.toLowerCase() === board.shortName.toLowerCase());
  const main = period.periodKind === 'scrum'
    ? await reportsRepository.fetchRawData({ sprint: period.sprintId!, project: board.shortName, assignees, isSubtaskType, isShowPlannedWP })
    : await reportsRepository.fetchRawDataByDateRange(board.shortName, assignees, period.periodStartDate, period.periodEndDate, isSubtaskType);
  const planned: Record<string, JiraIssueEntity[]> = {};
  if (period.periodKind === 'scrum' && isShowPlannedWP) {
    const plannedBoards = allBoards.filter(item => item.isShowPlannedWP && item.shortName.toLowerCase() === board.shortName.toLowerCase());
    for (const plannedBoard of plannedBoards) {
      planned[plannedBoard.shortName] = await reportsRepository.fetchPlannedWPData(plannedBoard.shortName, assignees, period.sprintId!, isSubtaskType);
    }
  }
  const rawInput: CaptureInputs = { main, planned };
  const segments = [{ segmentKey: 'report', value: main, count: main.length }, ...Object.entries(planned).map(([project, data]) => ({ segmentKey: `planned:${project}`, value: data, count: data.length }))];
  return { rawInput, segments };
}

async function calculate(period: CapturePeriod, rawInput: unknown) {
  const board = boardById.get(period.boardId);
  if (!board) throw new Error('CAPTURE_BOARD_INVALID');
  if (!rawInput || typeof rawInput !== 'object' || Array.isArray(rawInput)) throw new Error('CAPTURE_JIRA_INVALID');
  const inputs = rawInput as CaptureInputs;
  if (!Array.isArray(inputs.main) || !inputs.planned || typeof inputs.planned !== 'object' || Array.isArray(inputs.planned)
    || Object.values(inputs.planned).some(value => !Array.isArray(value))) throw new Error('CAPTURE_JIRA_INVALID');
  const calculatedOutput = period.periodKind === 'scrum'
    ? await generateReport(period.sprintId!, board.shortName, undefined, inputs.main, new Map(Object.entries(inputs.planned)))
    : await generateReportByDateRange(period.periodStartDate, period.periodEndDate, board.shortName, undefined, inputs.main);
  const count = 'details' in calculatedOutput && Array.isArray(calculatedOutput.details) ? calculatedOutput.details.length : 1;
  return { calculatedOutput, segments: [{ segmentKey: 'report', value: calculatedOutput, count }, ...Object.keys(inputs.planned).map(project => ({ segmentKey: `planned:${project}`, value: calculatedOutput, count }))] };
}

export const developerCaptureService: DeveloperCaptureService = createDeveloperCaptureService({
  boards: loadBoards,
  periods,
  fetchJira,
  calculate,
  repository: teamReportingSnapshotRepository,
});

function datePart(value: string | undefined): string | null {
  const date = value?.slice(0, 10);
  return date && ISO.test(date) && Number.isFinite(parseDate(date)) ? date : null;
}
function parseDate(value: string): number { return Date.parse(`${value}T00:00:00Z`); }
