import dayjs from 'dayjs';

export const KANBAN_PERIOD_WEEKDAYS = 10;
export type JiraFallbackReason = 'KANBAN_ANCHOR_MISSING' | 'KANBAN_ANCHOR_INVALID' | 'SCRUM_PERIOD_INCOMPLETE';

type ValidAnchor = { valid: true; anchorDate: string };
type InvalidAnchor = { valid: false; jiraFallbackReason: 'KANBAN_ANCHOR_MISSING' | 'KANBAN_ANCHOR_INVALID' };

export function validateKanbanAnchor(anchor: unknown): ValidAnchor | InvalidAnchor {
  if (anchor === undefined || anchor === null || anchor === '') return { valid: false, jiraFallbackReason: 'KANBAN_ANCHOR_MISSING' };
  if (typeof anchor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(anchor)) return { valid: false, jiraFallbackReason: 'KANBAN_ANCHOR_INVALID' };
  const parsed = dayjs(anchor);
  if (!parsed.isValid() || parsed.format('YYYY-MM-DD') !== anchor) {
    return { valid: false, jiraFallbackReason: 'KANBAN_ANCHOR_INVALID' };
  }
  return { valid: true, anchorDate: anchor };
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.format('YYYY-MM-DD') === value;
}

function moveWeekdays(date: dayjs.Dayjs, count: number): dayjs.Dayjs {
  const step = count < 0 ? -1 : 1;
  let remaining = Math.abs(count);
  let current = date;
  while (remaining > 0) {
    current = current.add(step, 'day');
    if (current.day() !== 0 && current.day() !== 6) remaining -= 1;
  }
  return current;
}

function weekdayDistance(start: dayjs.Dayjs, end: dayjs.Dayjs): number {
  const step = end.isBefore(start, 'day') ? -1 : 1;
  let current = start;
  let distance = 0;
  while (!current.isSame(end, 'day')) {
    current = current.add(step, 'day');
    if (current.day() !== 0 && current.day() !== 6) distance += step;
  }
  return distance;
}

export function getKanbanPeriod(anchorDate: string, date: string): { startDate: string; endDate: string } {
  const anchor = validateKanbanAnchor(anchorDate);
  if (!anchor.valid) throw new Error(anchor.jiraFallbackReason);
  const target = dayjs(date);
  if (!target.isValid()) throw new Error('INVALID_PERIOD_DATE');
  const distance = weekdayDistance(dayjs(anchor.anchorDate), target);
  const periodIndex = Math.floor(distance / KANBAN_PERIOD_WEEKDAYS);
  const start = moveWeekdays(dayjs(anchor.anchorDate), periodIndex * KANBAN_PERIOD_WEEKDAYS);
  const end = moveWeekdays(start, KANBAN_PERIOD_WEEKDAYS - 1);
  return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
}

type BaseInput = { boardId: number | string; isKanban: boolean; date?: string };
type ScrumInput = BaseInput & { isKanban: false; sprintId?: number | string; startDate?: string; endDate?: string };
type KanbanInput = BaseInput & { isKanban: true; kanbanCycleStartDate?: string | null };
export type PeriodIdentityInput = ScrumInput | KanbanInput;
export type PeriodIdentity =
  | { kind: 'scrum'; boardId: number | string; sprintId: number | string; startDate: string; endDate: string; ownershipMonth: string }
  | { kind: 'kanban'; boardId: number | string; startDate: string; endDate: string; ownershipMonth: string }
  | { kind: 'jira-fallback'; jiraFallbackReason: JiraFallbackReason };

export function resolvePeriodIdentity(input: PeriodIdentityInput): PeriodIdentity {
  if (input.isKanban) {
    const anchor = validateKanbanAnchor(input.kanbanCycleStartDate);
    if (!anchor.valid || !input.date) return { kind: 'jira-fallback', jiraFallbackReason: anchor.valid ? 'KANBAN_ANCHOR_INVALID' : anchor.jiraFallbackReason };
    const period = getKanbanPeriod(anchor.anchorDate, input.date);
    return { kind: 'kanban', boardId: input.boardId, ...period, ownershipMonth: `${period.endDate.slice(0, 7)}-01` };
  }
  const sprintId = input.sprintId;
  if ((typeof sprintId !== 'string' && typeof sprintId !== 'number') || String(sprintId).trim() === ''
    || !validDate(input.startDate) || !validDate(input.endDate)
    || dayjs(input.startDate).isAfter(dayjs(input.endDate), 'day')) {
    return { kind: 'jira-fallback', jiraFallbackReason: 'SCRUM_PERIOD_INCOMPLETE' };
  }
  const normalizedSprintId = sprintId as string | number;
  return { kind: 'scrum', boardId: input.boardId, sprintId: normalizedSprintId, startDate: input.startDate, endDate: input.endDate, ownershipMonth: `${input.endDate.slice(0, 7)}-01` };
}
