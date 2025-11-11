import type { CalendarCell } from '../types/talent-leave.types';
import type { Dayjs } from 'dayjs';

/**
 * Generate array of dates for 2-month range starting from day 1 of the selected month
 * Example: If user selects November, shows Nov 1 - Dec 31
 * @param startMonth - Any date in the starting month (will use day 1)
 * @returns Array of CalendarCell objects with date information
 */
export function generateDateRange(startMonth: Date): CalendarCell[] {
  const cells: CalendarCell[] = [];

  // Start from day 1 of the selected month
  const currentDate = new Date(startMonth);
  currentDate.setDate(1); // Set to first day of month
  currentDate.setHours(0, 0, 0, 0);

  // Calculate end date: last day of the next month
  const endDate = new Date(startMonth);
  endDate.setMonth(endDate.getMonth() + 2); // Move to month after next
  endDate.setDate(0); // Go back to last day of previous month (which is next month)

  while (currentDate <= endDate) {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

    cells.push({
      date: dateString,
      dayName: getIndonesianDayName(currentDate),
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
 * Check if a date falls within a leave range (inclusive)
 * @param date - Date to check (YYYY-MM-DD)
 * @param dateFrom - Start date of leave (YYYY-MM-DD or ISO 8601)
 * @param dateTo - End date of leave (YYYY-MM-DD or ISO 8601)
 * @returns True if date is within range
 */
export function isDateInLeaveRange(
  date: string,
  dateFrom: string,
  dateTo: string
): boolean {
  const checkDate = new Date(date);
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  // Normalize to start of day for comparison
  checkDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  return checkDate >= startDate && checkDate <= endDate;
}

/**
 * Calculate number of business days between two dates (inclusive)
 * Excludes weekends and holidays
 * @param dateFrom - Start date (YYYY-MM-DD or ISO 8601)
 * @param dateTo - End date (YYYY-MM-DD or ISO 8601)
 * @param holidays - Array of holiday dates in YYYY-MM-DD format (optional)
 * @returns Number of business days excluding weekends and holidays
 */
export function calculateDayCount(
  dateFrom: string,
  dateTo: string,
  holidays?: string[]
): number {
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  // Normalize to start of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  // Create a Set of holiday dates for fast lookup
  const holidaySet = new Set(holidays || []);

  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    const dateString = currentDate.toISOString().split('T')[0];
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
 * Format date range for display in Indonesian format
 * @param dateFrom - Start date (YYYY-MM-DD or ISO 8601)
 * @param dateTo - End date (YYYY-MM-DD or ISO 8601)
 * @returns Formatted string "DD/MM/YYYY - DD/MM/YYYY"
 */
export function formatDateRange(dateFrom: string, dateTo: string): string {
  // Parse date string to avoid timezone issues
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const startDate = parseDate(dateFrom);
  const endDate = parseDate(dateTo);

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`; // Indonesian format DD/MM/YYYY
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Get Indonesian day name for a given date
 * @param date - Date object
 * @returns Indonesian day name
 */
export function getIndonesianDayName(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

/**
 * Disable past dates for DatePicker (Ant Design)
 * @param current - Current date being evaluated (Dayjs)
 * @returns True if date should be disabled
 */
export function disablePastDates(current: Dayjs): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = current.toDate();
  checkDate.setHours(0, 0, 0, 0);

  return checkDate < today;
}

/**
 * Disable dates before a specific date for DatePicker (Ant Design)
 * @param current - Current date being evaluated (Dayjs)
 * @param minDate - Minimum allowed date (Dayjs or null)
 * @returns True if date should be disabled
 */
export function disableBeforeDate(current: Dayjs, minDate: Dayjs | null): boolean {
  if (!minDate) {
    return false;
  }

  const checkDate = current.toDate();
  checkDate.setHours(0, 0, 0, 0);

  const min = minDate.toDate();
  min.setHours(0, 0, 0, 0);

  return checkDate < min;
}
