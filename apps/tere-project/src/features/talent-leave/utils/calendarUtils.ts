import type {
  TalentLeaveResponse,
  TeamGroup,
  LeaveRowData,
} from '../types/talent-leave.types';
import { calculateDayCount, formatDateRange } from './dateUtils';

/**
 * Group leave records by team name and sort teams alphabetically
 * @param leaveRecords - Array of leave records from API
 * @param holidayDates - Array of holiday dates in YYYY-MM-DD format (optional)
 * @param visibleStartDate - Start date of visible calendar range (YYYY-MM-DD) (optional)
 * @param visibleEndDate - End date of visible calendar range (YYYY-MM-DD) (optional)
 * @returns Array of team groups with members
 */
export function groupByTeam(
  leaveRecords: TalentLeaveResponse[],
  holidayDates?: string[],
  visibleStartDate?: string,
  visibleEndDate?: string
): TeamGroup[] {
  if (leaveRecords.length === 0) {
    return [];
  }

  // Group by team using reduce
  const groupedMap = leaveRecords.reduce((acc, leave) => {
    const teamName = leave.team;

    if (!acc.has(teamName)) {
      acc.set(teamName, []);
    }

    acc.get(teamName)!.push(
      transformToRowData(leave, holidayDates, visibleStartDate, visibleEndDate)
    );

    return acc;
  }, new Map<string, LeaveRowData[]>());

  // Convert to array and sort alphabetically by team name
  const teamGroups: TeamGroup[] = Array.from(groupedMap.entries())
    .map(([teamName, members]) => ({
      teamName,
      members,
    }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  return teamGroups;
}

/**
 * Transform leave record to row data format for calendar display
 * @param leave - Leave record from API
 * @param holidayDates - Array of holiday dates in YYYY-MM-DD format (optional)
 * @param visibleStartDate - Start date of visible calendar range (YYYY-MM-DD) (optional)
 * @param visibleEndDate - End date of visible calendar range (YYYY-MM-DD) (optional)
 * @returns Row data with calculated fields
 */
export function transformToRowData(
  leave: TalentLeaveResponse,
  holidayDates?: string[],
  visibleStartDate?: string,
  visibleEndDate?: string
): LeaveRowData {
  // Process all leave date ranges with status
  const dateRanges = leave.leaveDate.map((range) => ({
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    status: range.status,
    display: formatDateRange(range.dateFrom, range.dateTo),
  }));

  // Calculate total leave count only for dates within visible range
  const leaveCount = leave.leaveDate.reduce((total, range) => {
    // If visible range is specified, clip the leave range to visible range
    let countFrom = range.dateFrom;
    let countTo = range.dateTo;

    if (visibleStartDate && visibleEndDate) {
      // Only count if the leave range overlaps with visible range
      const leaveStart = new Date(range.dateFrom);
      const leaveEnd = new Date(range.dateTo);
      const visibleStart = new Date(visibleStartDate);
      const visibleEnd = new Date(visibleEndDate);

      // Check if ranges overlap
      if (leaveEnd < visibleStart || leaveStart > visibleEnd) {
        return total; // No overlap, skip
      }

      // Clip to visible range
      countFrom = leaveStart < visibleStart ? visibleStartDate : range.dateFrom;
      countTo = leaveEnd > visibleEnd ? visibleEndDate : range.dateTo;
    }

    return total + calculateDayCount(countFrom, countTo, holidayDates);
  }, 0);

  // Flatten all leave dates from all ranges
  const leaveDates = leave.leaveDate.flatMap((range) =>
    generateLeaveDatesArray(range.dateFrom, range.dateTo)
  );

  // Create a map of date to status
  const leaveDatesWithStatus: Record<string, 'Draft' | 'Confirmed'> = {};
  leave.leaveDate.forEach((range) => {
    const dates = generateLeaveDatesArray(range.dateFrom, range.dateTo);
    dates.forEach((date) => {
      leaveDatesWithStatus[date] = range.status;
    });
  });

  // Generate combined date range display (comma-separated if multiple)
  const dateRange = dateRanges.map(r => r.display).join(', ');

  // Generate status display (show unique statuses)
  const uniqueStatuses = Array.from(new Set(dateRanges.map(r => r.status)));
  const status = uniqueStatuses.join(', ');

  return {
    id: leave.id,
    name: leave.name,
    team: leave.team,
    role: leave.role,
    leaveCount,
    dateRanges,
    leaveDates,
    leaveDatesWithStatus,
    dateRange,
    status,
  };
}

/**
 * Generate array of date strings between dateFrom and dateTo (inclusive)
 * @param dateFrom - Start date (YYYY-MM-DD or ISO 8601)
 * @param dateTo - End date (YYYY-MM-DD or ISO 8601)
 * @returns Array of date strings in YYYY-MM-DD format
 */
function generateLeaveDatesArray(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  const currentDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  // Normalize to start of day
  currentDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    dates.push(dateString);

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Get Tailwind CSS color class for a calendar cell based on its state
 * Priority: national holiday > weekend > regional holiday > leave (by status) > default
 * Weekends and holidays are never overridden by leave dates
 * @param isWeekend - Whether the date is a weekend
 * @param isHoliday - Whether the date is a public holiday
 * @param isNationalHoliday - Whether it's a national (vs regional) holiday
 * @param isLeaveDate - Whether the date is a leave date
 * @param leaveStatus - Status of the leave ('Draft' or 'Confirmed'), if applicable
 * @returns Tailwind CSS background color class
 */
export function getCellColorClass(
  isWeekend: boolean,
  isHoliday: boolean,
  isNationalHoliday: boolean,
  isLeaveDate: boolean,
  leaveStatus?: 'Draft' | 'Confirmed'
): string {
  // Priority: national holiday > weekend > regional holiday > leave (by status)
  // Weekends and holidays always take precedence
  if (isNationalHoliday) {
    return 'bg-red-100'; // #FEE2E2 - soft red (national holiday overrides everything)
  }

  if (isWeekend) {
    return 'bg-slate-100'; // #F1F5F9 - soft gray (weekend overrides leave)
  }

  if (isHoliday) {
    return 'bg-red-50'; // Light red for regional holidays
  }

  // Only show leave color if not weekend or holiday
  if (isLeaveDate) {
    if (leaveStatus === 'Draft') {
      return 'bg-yellow-200'; // #FEF08A - yellow for draft
    }
    return 'bg-orange-200'; // #FED7AA - soft orange for confirmed
  }

  // Default background
  return 'bg-white';
}
