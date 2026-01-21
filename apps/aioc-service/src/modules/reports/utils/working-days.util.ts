/**
 * Utility functions for calculating working days
 */

interface LeaveDateRange {
  dateFrom: string;
  dateTo: string;
  status: string;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date falls within any leave range with Confirmed or Sick status
 * @param date - Date to check
 * @param leaveDates - Array of leave date ranges
 * @returns true if the date is within a Confirmed or Sick leave range
 */
export function isOnLeave(
  date: Date,
  leaveDates: LeaveDateRange[],
): boolean {
  if (!leaveDates || leaveDates.length === 0) {
    return false;
  }

  const dateStr = formatDateToYYYYMMDD(date);

  const result = leaveDates.some((leave) => {
    // Only count Confirmed and Sick status leaves
    if (leave.status !== 'Confirmed' && leave.status !== 'Sick') {
      return false;
    }

    const fromDate = parseLocalDate(leave.dateFrom);
    const toDate = parseLocalDate(leave.dateTo);

    // Normalize to start of day for comparison
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= fromDate && checkDate <= toDate;
  });

  return result;
}

/**
 * Parse a date string as a local date (without timezone conversion)
 * Handles both YYYY-MM-DD and ISO 8601 formats
 * @param dateStr - Date string in YYYY-MM-DD or ISO 8601 format
 * @returns Date object normalized to local date (no timezone shift)
 */
function parseLocalDate(dateStr: string): Date {
  // Extract just the date part (YYYY-MM-DD) from ISO 8601 or plain format
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Create date using local timezone (year, month is 0-indexed, day)
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Format date as YYYY-MM-DD using local timezone
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate working days between two dates, excluding weekends and leave dates
 * @param startDate - Sprint start date
 * @param endDate - Sprint end date
 * @param leaveDates - Array of leave date ranges for the team member
 * @param nationalHolidays - Array of national holiday dates in YYYY-MM-DD format
 * @returns Number of working days (excluding weekends, Confirmed/Sick leaves, and holidays)
 */
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  leaveDates: LeaveDateRange[] = [],
  nationalHolidays: string[] = [],
): number {
  if (startDate > endDate) {
    return 0;
  }



  let workingDays = 0;
  
  // Normalize start and end dates to local timezone midnight
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  // Iterate through each day in the range
  while (currentDate <= end) {
    const dateStr = formatDateToYYYYMMDD(currentDate);
    const isHoliday = nationalHolidays.includes(dateStr);
    const isOnLeaveBool = isOnLeave(currentDate, leaveDates);
    const isWeekendBool = isWeekend(currentDate);

    // Count the day if it's not a weekend, not on leave, and not a holiday
    if (
      !isWeekendBool &&
      !isOnLeaveBool &&
      !isHoliday
    ) {
      workingDays++;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

/**
 * Filter leave dates for a specific team member by name
 * @param allLeaveData - All leave records from Firebase
 * @param memberName - Team member name to filter by
 * @returns Array of leave date ranges for the specific member
 */
export function getLeaveDataForMember(
  allLeaveData: Array<{
    name: string;
    leaveDate: LeaveDateRange[];
  }>,
  memberName: string,
): LeaveDateRange[] {
  const memberLeave = allLeaveData.find(
    (record) => record.name.toLowerCase() === memberName.toLowerCase(),
  );
  return memberLeave?.leaveDate || [];
}
