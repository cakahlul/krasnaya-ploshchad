import type {
  CalendarCell,
  SprintInfo,
  TeamMemberRow,
  TeamGroupData,
} from '../interfaces/talent-leave-export.dto';
import type { TalentLeaveResponseDto } from '../interfaces/talent-leave.dto';
import {
  generateDateRange,
  calculateDayCount,
  formatDateRange,
} from './date-utilities';
import {
  getSprintStartDate,
  getSprintEndDate,
  getSprintNameWithDateRange,
} from './sprint-utilities';

/**
 * Generate array of CalendarCell objects for date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param holidayDates - Array of holiday dates with metadata (optional)
 * @returns Array of CalendarCell objects with date and holiday information
 */
export function generateDateColumns(
  startDate: string,
  endDate: string,
  holidayDates?: Array<{
    date: string;
    name: string;
    isNational: boolean;
  }>,
): CalendarCell[] {
  // Generate base date range
  const cells = generateDateRange(startDate, endDate);

  // If no holidays provided, return cells as-is
  if (!holidayDates || holidayDates.length === 0) {
    return cells;
  }

  // Create holiday map for fast lookup
  const holidayMap = new Map(
    holidayDates.map((h) => [
      h.date,
      { name: h.name, isNational: h.isNational },
    ]),
  );

  // Enhance cells with holiday information
  return cells.map((cell) => {
    const holiday = holidayMap.get(cell.date);
    if (holiday) {
      return {
        ...cell,
        isHoliday: true,
        isNationalHoliday: holiday.isNational,
        holidayName: holiday.name,
      };
    }
    return cell;
  });
}

/**
 * Group leave records by team and transform to TeamGroupData format
 * @param leaveRecords - Array of talent leave records
 * @param holidayDates - Array of holiday dates in YYYY-MM-DD format (optional)
 * @param startDate - Start date of visible calendar range (YYYY-MM-DD)
 * @param endDate - End date of visible calendar range (YYYY-MM-DD)
 * @returns Array of TeamGroupData sorted alphabetically by team name
 */
export function groupByTeam(
  leaveRecords: TalentLeaveResponseDto[],
  holidayDates: string[] | undefined,
  startDate: string,
  endDate: string,
): TeamGroupData[] {
  if (leaveRecords.length === 0) {
    return [];
  }

  // Group by team using Map
  const groupedMap = new Map<string, TeamMemberRow[]>();

  leaveRecords.forEach((leave) => {
    const teamName = leave.team;

    // Transform to row data
    const rowData = transformToRowData(leave, holidayDates, startDate, endDate);

    if (!groupedMap.has(teamName)) {
      groupedMap.set(teamName, []);
    }

    groupedMap.get(teamName)!.push(rowData);
  });

  // Convert to TeamGroupData array and sort
  const teamGroups: TeamGroupData[] = Array.from(groupedMap.entries())
    .map(([teamName, members]) => ({
      teamName,
      memberCount: members.length,
      members: members.sort((a, b) => a.name.localeCompare(b.name)), // Sort members alphabetically
    }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName)); // Sort teams alphabetically

  return teamGroups;
}

/**
 * Calculate sprint groupings for date columns
 * @param dateColumns - Array of CalendarCell objects
 * @returns Record mapping sprint names to SprintInfo objects
 */
export function calculateSprintGroups(
  dateColumns: CalendarCell[],
): Record<string, SprintInfo> {
  const sprintGroups: Record<string, SprintInfo> = {};

  dateColumns.forEach((cell) => {
    const sprintName = getSprintNameWithDateRange(cell.date);
    const startDate = getSprintStartDate(cell.date);
    const endDate = getSprintEndDate(cell.date);

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (!sprintGroups[sprintName]) {
      sprintGroups[sprintName] = {
        name: sprintName,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dateCount: 0,
      };
    }

    // Count dates within this sprint that are in the visible range
    sprintGroups[sprintName].dateCount++;
  });

  return sprintGroups;
}

/**
 * Transform leave record to TeamMemberRow format
 * @param leave - Leave record from repository
 * @param holidayDates - Array of holiday dates in YYYY-MM-DD format (optional)
 * @param visibleStartDate - Start date of visible calendar range (YYYY-MM-DD)
 * @param visibleEndDate - End date of visible calendar range (YYYY-MM-DD)
 * @returns TeamMemberRow with calculated fields
 */
function transformToRowData(
  leave: TalentLeaveResponseDto,
  holidayDates: string[] | undefined,
  visibleStartDate: string,
  visibleEndDate: string,
): TeamMemberRow {
  // Calculate total leave count only for dates within visible range
  const leaveCount = leave.leaveDate.reduce((total, range) => {
    // Clip the leave range to visible range
    let countFrom = range.dateFrom;
    let countTo = range.dateTo;

    // Parse dates
    const leaveStart = new Date(range.dateFrom);
    const leaveEnd = new Date(range.dateTo);
    const visibleStart = new Date(visibleStartDate);
    const visibleEnd = new Date(visibleEndDate);

    // Normalize to start of day
    leaveStart.setHours(0, 0, 0, 0);
    leaveEnd.setHours(0, 0, 0, 0);
    visibleStart.setHours(0, 0, 0, 0);
    visibleEnd.setHours(0, 0, 0, 0);

    // Check if ranges overlap
    if (leaveEnd < visibleStart || leaveStart > visibleEnd) {
      return total; // No overlap, skip
    }

    // Clip to visible range
    if (leaveStart < visibleStart) {
      countFrom = visibleStartDate;
    }
    if (leaveEnd > visibleEnd) {
      countTo = visibleEndDate;
    }

    return total + calculateDayCount(countFrom, countTo, holidayDates);
  }, 0);

  // Flatten all leave dates from all ranges
  const leaveDates: string[] = [];
  leave.leaveDate.forEach((range) => {
    const dates = generateLeaveDatesArray(range.dateFrom, range.dateTo);
    leaveDates.push(...dates);
  });

  // Create a map of date to status
  const leaveDatesWithStatus: Record<string, 'Draft' | 'Confirmed'> = {};
  leave.leaveDate.forEach((range) => {
    const dates = generateLeaveDatesArray(range.dateFrom, range.dateTo);
    const status = range.status as 'Draft' | 'Confirmed';
    dates.forEach((date) => {
      leaveDatesWithStatus[date] = status;
    });
  });

  // Generate combined date range display (comma-separated if multiple)
  const dateRanges = leave.leaveDate.map((range) =>
    formatDateRange(range.dateFrom, range.dateTo),
  );
  const dateRange = dateRanges.join(', ');

  return {
    id: leave.id,
    name: leave.name,
    team: leave.team,
    leaveCount,
    dateRange,
    leaveDates,
    leaveDatesWithStatus,
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

  // Parse date strings
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const currentDate = parseDate(dateFrom);
  const endDate = parseDate(dateTo);

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
