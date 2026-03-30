import type { CalendarCell } from '@shared/types/talent-leave.types';

export function generateDateRange(startDate: string, endDate: string): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const currentDate = new Date(startYear, startMonth - 1, startDay);
  currentDate.setHours(0, 0, 0, 0);
  const finalEndDate = new Date(endYear, endMonth - 1, endDay);
  finalEndDate.setHours(23, 59, 59, 999);

  while (currentDate <= finalEndDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    cells.push({
      date: dateString,
      dayName: getShortDayName(currentDate),
      dayNumber: currentDate.getDate(),
      isWeekend,
      isHoliday: false,
      isNationalHoliday: false,
      holidayName: undefined,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return cells;
}

export function calculateDayCount(dateFrom: string, dateTo: string, holidayDates?: string[]): number {
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const startDate = parseDate(dateFrom);
  const endDate = parseDate(dateTo);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const holidaySet = new Set(holidayDates || []);
  let count = 0;
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    if (!isWeekend && !holidaySet.has(dateString)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
}

export function formatDateRange(dateFrom: string, dateTo: string): string {
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const startDate = parseDate(dateFrom);
  const endDate = parseDate(dateTo);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const startDay = startDate.getDate();
  const startMonth = monthNames[startDate.getMonth()];
  const endDay = endDate.getDate();
  const endMonth = monthNames[endDate.getMonth()];
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    if (startDay === endDay) return `${startDay} ${startMonth}`;
    return `${startDay}-${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}

export function formatDateDDMMYYYY(date: string): string {
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const parsedDate = parseDate(date);
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const year = parsedDate.getFullYear();
  return `${day}/${month}/${year}`;
}

function getShortDayName(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}
