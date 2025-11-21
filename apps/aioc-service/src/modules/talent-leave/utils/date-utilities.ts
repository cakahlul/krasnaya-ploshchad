import type { CalendarCell } from '../interfaces/talent-leave-export.dto';

/**
 * Generate array of dates for a given date range with calendar information
 * @param startDate - Start date of the range (YYYY-MM-DD)
 * @param endDate - End date of the range (YYYY-MM-DD)
 * @returns Array of CalendarCell objects with date information
 */
export function generateDateRange(
  startDate: string,
  endDate: string,
): CalendarCell[] {
  const cells: CalendarCell[] = [];

  // Parse date strings to avoid timezone issues
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

  const currentDate = new Date(startYear, startMonth - 1, startDay);
  currentDate.setHours(0, 0, 0, 0);

  const finalEndDate = new Date(endYear, endMonth - 1, endDay);
  finalEndDate.setHours(23, 59, 59, 999);

  while (currentDate <= finalEndDate) {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

    cells.push({
      date: dateString,
      dayName: getShortDayName(currentDate),
      dayNumber: currentDate.getDate(),
      isWeekend,
      isHoliday: false,
      isNationalHoliday: false,
      holidayName: undefined,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return cells;
}

/**
 * Calculate number of business days between two dates (inclusive)
 * Excludes weekends and holidays
 * @param dateFrom - Start date (YYYY-MM-DD or ISO 8601)
 * @param dateTo - End date (YYYY-MM-DD or ISO 8601)
 * @param holidayDates - Array of holiday dates in YYYY-MM-DD format (optional)
 * @returns Number of business days excluding weekends and holidays
 */
export function calculateDayCount(
  dateFrom: string,
  dateTo: string,
  holidayDates?: string[],
): number {
  // Parse date strings
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const startDate = parseDate(dateFrom);
  const endDate = parseDate(dateTo);

  // Normalize to start of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  // Create a Set of holiday dates for fast lookup
  const holidaySet = new Set(holidayDates || []);

  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

    // Format as YYYY-MM-DD
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const isHoliday = holidaySet.has(dateString);

    // Only count if not weekend and not holiday
    if (!isWeekend && !isHoliday) {
      count++;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

/**
 * Format date range for display
 * Returns human-readable format like "13-15 Jan" or "30 Dec - 2 Jan"
 * @param dateFrom - Start date (YYYY-MM-DD or ISO 8601)
 * @param dateTo - End date (YYYY-MM-DD or ISO 8601)
 * @returns Formatted string
 */
export function formatDateRange(dateFrom: string, dateTo: string): string {
  // Parse date strings
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const startDate = parseDate(dateFrom);
  const endDate = parseDate(dateTo);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const startDay = startDate.getDate();
  const startMonth = monthNames[startDate.getMonth()];
  const endDay = endDate.getDate();
  const endMonth = monthNames[endDate.getMonth()];

  // Same month: "13-15 Jan"
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    if (startDay === endDay) {
      return `${startDay} ${startMonth}`;
    }
    return `${startDay}-${endDay} ${startMonth}`;
  }

  // Different months: "30 Dec - 2 Jan"
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}

/**
 * Format date as DD/MM/YYYY
 * @param date - Date string (YYYY-MM-DD or ISO 8601)
 * @returns Formatted string DD/MM/YYYY
 */
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

/**
 * Check if a date is a weekend
 * @param date - Date string (YYYY-MM-DD)
 * @returns True if Saturday or Sunday
 */
export function isWeekend(date: string): boolean {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get short day name for a given date
 * @param date - Date object
 * @returns Short day name (Mon, Tue, etc.)
 */
function getShortDayName(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}
