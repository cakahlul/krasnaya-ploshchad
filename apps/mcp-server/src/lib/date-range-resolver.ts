const DAY_MS = 24 * 60 * 60 * 1000;

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export function resolveDateRange(input?: string): DateRange {
  const raw = input?.trim();
  const now = new Date();
  const today = toLocalDate(now);
  const text = raw?.toLowerCase() ?? 'today';

  if (!raw || text === 'today') return singleDay(today, 'today');
  if (text === 'yesterday') return singleDay(addDays(today, -1), 'yesterday');
  if (text === 'tomorrow') return singleDay(addDays(today, 1), 'tomorrow');
  if (text === 'next week') return weekRange(addDays(startOfWeek(today), 7), 'next week');
  if (text === 'last week') return weekRange(addDays(startOfWeek(today), -7), 'last week');
  if (text === 'this week' || text === 'current week') return weekRange(startOfWeek(today), 'this week');

  const rangeMatch = raw.match(/^(\d{4}-\d{2}-\d{2})\s*(?:to|until|through|-)\s*(\d{4}-\d{2}-\d{2})$/i);
  if (rangeMatch) return { startDate: rangeMatch[1], endDate: rangeMatch[2], label: raw };

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return singleDay(raw, raw);

  throw new Error('Unsupported date expression. Use today, yesterday, tomorrow, this week, next week, last week, YYYY-MM-DD, or YYYY-MM-DD to YYYY-MM-DD.');
}

function singleDay(date: string, label: string): DateRange {
  return { startDate: date, endDate: date, label };
}

function weekRange(startDate: string, label: string): DateRange {
  return { startDate, endDate: addDays(startDate, 6), label };
}

function startOfWeek(date: string): string {
  const value = parseLocalDate(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return toLocalDate(new Date(value.getTime() + diff * DAY_MS));
}

function addDays(date: string, days: number): string {
  return toLocalDate(new Date(parseLocalDate(date).getTime() + days * DAY_MS));
}

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
