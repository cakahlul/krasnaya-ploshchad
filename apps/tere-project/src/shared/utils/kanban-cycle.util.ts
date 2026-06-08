import dayjs from 'dayjs';

export const KANBAN_CYCLE_ANCHOR = '2026-06-08';
export const KANBAN_CYCLE_DAYS = 14;

export function getKanbanDateRange(
  today: dayjs.ConfigType = dayjs(),
  anchorDate: dayjs.ConfigType = KANBAN_CYCLE_ANCHOR,
): { startDate: string; endDate: string } {
  const anchor = dayjs(anchorDate).startOf('day');
  const current = dayjs(today).startOf('day');
  const diffDays = current.diff(anchor, 'day');
  const cycleIndex = Math.floor(diffDays / KANBAN_CYCLE_DAYS);
  const start = anchor.add(cycleIndex * KANBAN_CYCLE_DAYS, 'day');
  const end = start.add(KANBAN_CYCLE_DAYS - 1, 'day');

  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
  };
}
