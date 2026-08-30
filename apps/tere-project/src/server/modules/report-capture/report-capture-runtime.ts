import { boardsService } from '@server/modules/boards/boards.service';
import { sprintService } from '@server/modules/sprint/sprint.service';
import { findReportMembers, generateReport, generateReportByDateRange } from '@server/modules/reports/reports.service';
import * as reportsRepository from '@server/modules/reports/reports.repository';
import { teamReportingSnapshotRepository } from '@server/modules/report-snapshots/report-snapshot.repository';
import type { JiraIssueEntity } from '@shared/types/report.types';
import { createDeveloperCaptureService, type CaptureBoard, type CapturePeriod, type DeveloperCaptureService } from './report-capture';
import { DrizzleCaptureRunRepository } from './report-capture-run.repository';

const DAY = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const boardById = new Map<number, Awaited<ReturnType<typeof boardsService.findAll>>[number]>();
const kanbanMonthInputs = new Map<string, Promise<readonly JiraIssueEntity[]>>();

interface CaptureInputs {
  readonly main: JiraIssueEntity[];
  readonly planned: Record<string, JiraIssueEntity[]>;
}

async function loadBoards() {
  const boards = await boardsService.findAll();
  boards.forEach(board => boardById.set(board.boardId, board));
  return boards.filter(board => !board.isBugMonitoring).map(board => ({ boardId: board.boardId, boardName: board.name, isBugMonitoring: board.isBugMonitoring } satisfies CaptureBoard));
}

async function periods(board: CaptureBoard, window: { startDate: string; endDate: string }): Promise<readonly CapturePeriod[]> {
  const config = boardById.get(board.boardId);
  if (!config) return [];
  if (!config.isKanban) {
    const sprints = await sprintService.fetchAllSprint(board.boardId);
    return sprints.flatMap(sprint => {
      const startDate = datePart(sprint.startDate);
      const endDate = datePart(sprint.endDate);
      if (!isClosedSprint(sprint.state) || !startDate || !endDate || !isPeriodEndInWindow(endDate, window)) return [];
      return [{ boardId: board.boardId, boardName: board.boardName, periodKind: 'scrum', sprintId: String(sprint.id), sprintName: sprint.name, periodStartDate: startDate, periodEndDate: endDate }];
    });
  }
  return elapsedKanbanWeeks(window, jakartaDate()).map(period => ({
    boardId: board.boardId,
    boardName: board.boardName,
    periodKind: 'kanban' as const,
    periodStartDate: period.startDate,
    periodEndDate: period.endDate,
  }));
}

async function fetchJira(period: CapturePeriod) {
  const board = boardById.get(period.boardId);
  if (!board) throw new Error('CAPTURE_BOARD_INVALID');
  if (period.periodKind === 'kanban') return fetchKanbanWeek(period, board.shortName);
  const members = await findReportMembers(
    board.shortName,
    period.periodStartDate,
    period.periodEndDate,
  );
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

async function fetchKanbanWeek(period: CapturePeriod, project: string) {
  const monthly = monthBoundsBetween(period.periodStartDate, period.periodEndDate).map(({ startDate, endDate }) => {
    const key = `${period.boardId}:${startDate}`;
    const value = kanbanMonthInputs.get(key) ?? loadKanbanMonth(project, startDate, endDate);
    kanbanMonthInputs.set(key, value);
    return value;
  });
  const main = uniqueByKey((await Promise.all(monthly)).flat())
    .filter(issue => {
      const date = resolutionDate(issue);
      return date !== null && date >= period.periodStartDate && date <= period.periodEndDate;
    });
  return {
    rawInput: { main, planned: {} } satisfies CaptureInputs,
    segments: [{ segmentKey: 'report', value: main, count: main.length }],
  };
}

async function loadKanbanMonth(project: string, startDate: string, endDate: string): Promise<readonly JiraIssueEntity[]> {
  const members = await findReportMembers(project, startDate, endDate);
  const assignees = members.map(member => member.jiraId).filter((id): id is string => Boolean(id));
  const isSubtaskType = await boardsService.hasSubtaskType(project);
  return reportsRepository.fetchRawDataByDateRange(project, assignees, startDate, endDate, isSubtaskType);
}

async function calculate(period: CapturePeriod, rawInput: unknown) {
  const board = boardById.get(period.boardId);
  if (!board) throw new Error('CAPTURE_BOARD_INVALID');
  if (!rawInput || typeof rawInput !== 'object' || Array.isArray(rawInput)) throw new Error('CAPTURE_JIRA_INVALID');
  const inputs = rawInput as CaptureInputs;
  if (!Array.isArray(inputs.main) || !inputs.planned || typeof inputs.planned !== 'object' || Array.isArray(inputs.planned)
    || Object.values(inputs.planned).some(value => !Array.isArray(value))) throw new Error('CAPTURE_JIRA_INVALID');
  const calculatedOutput = period.periodKind === 'scrum'
    ? await generateReport(period.sprintId!, board.shortName, undefined, inputs.main, new Map(Object.entries(inputs.planned)), {
      startDate: period.periodStartDate,
      endDate: period.periodEndDate,
    })
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
  runRepository: new DrizzleCaptureRunRepository(),
});

export function isPeriodEndInWindow(endDate: string, window: { startDate: string; endDate: string }): boolean {
  return endDate >= window.startDate && endDate <= window.endDate;
}

export function elapsedKanbanWeeks(window: { startDate: string; endDate: string }, today: string): Array<{ startDate: string; endDate: string }> {
  const firstMonday = mondayOnOrAfter(window.startDate);
  const weeks: Array<{ startDate: string; endDate: string }> = [];
  for (let startDate = firstMonday; ; startDate = nextDate(startDate, 7)) {
    const endDate = nextDate(startDate, 6);
    if (endDate > window.endDate || endDate >= today) break;
    weeks.push({ startDate, endDate });
  }
  return weeks;
}

export function isClosedSprint(state: string | undefined): boolean {
  return state?.toLowerCase() === 'closed';
}

function datePart(value: string | undefined): string | null {
  const date = value?.slice(0, 10);
  return date && ISO.test(date) && Number.isFinite(parseDate(date)) ? date : null;
}
function parseDate(value: string): number { return Date.parse(`${value}T00:00:00Z`); }

function monthBounds(date: string): { startDate: string; endDate: string } {
  const [year, month] = date.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { startDate: `${year}-${String(month).padStart(2, '0')}-01`, endDate: `${year}-${String(month).padStart(2, '0')}-${lastDay}` };
}

function monthBoundsBetween(startDate: string, endDate: string): Array<{ startDate: string; endDate: string }> {
  const months: Array<{ startDate: string; endDate: string }> = [];
  for (let date = monthBounds(startDate).startDate; date <= endDate; date = nextMonth(date)) months.push(monthBounds(date));
  return months;
}

function uniqueByKey(issues: readonly JiraIssueEntity[]): JiraIssueEntity[] {
  const keys = new Set<string>();
  return issues.filter(issue => !keys.has(issue.key) && (keys.add(issue.key), true));
}

function resolutionDate(issue: JiraIssueEntity): string | null {
  const value = issue.fields.resolutiondate;
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

function jakartaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function mondayOnOrAfter(date: string): string {
  const day = new Date(parseDate(date)).getUTCDay();
  return nextDate(date, (8 - day) % 7);
}
function nextDate(date: string, days: number): string { return new Date(parseDate(date) + days * DAY).toISOString().slice(0, 10); }
function nextMonth(date: string): string {
  const value = new Date(parseDate(date));
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}
