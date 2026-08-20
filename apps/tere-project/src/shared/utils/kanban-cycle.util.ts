import dayjs from 'dayjs';
import { getKanbanPeriod } from './period-identity';

export const KANBAN_CYCLE_ANCHOR = '2026-06-08';
export const KANBAN_CYCLE_DAYS = 10;

export function getKanbanDateRange(
  today: dayjs.ConfigType = dayjs(),
  anchorDate: dayjs.ConfigType = KANBAN_CYCLE_ANCHOR,
): { startDate: string; endDate: string } {
  const current = dayjs(today).startOf('day');
  return getKanbanPeriod(dayjs(anchorDate).format('YYYY-MM-DD'), current.format('YYYY-MM-DD'));
}
