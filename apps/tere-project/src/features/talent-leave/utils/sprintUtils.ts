/**
 * Sprint utility functions for Talent Leave calendar
 * Sprints follow a 2-week cycle (Monday to Friday) with template: "Sprint {1-6} Q{1-4} {year}"
 * - Each sprint = 10 business days (2 weeks excluding weekends)
 * - Sprint starts on Monday and ends on second Friday
 * - Each quarter has 6 sprints
 * - After Sprint 6 Q4, cycle resets to Sprint 1 Q1 of next year
 */

/**
 * Reference date for sprint cycle calculation
 * Sprint 2 Q4 2025: October 27 (Monday) - November 7 (Friday)
 */
const SPRINT_REFERENCE_DATE = new Date(2025, 9, 27); // October 27, 2025 (Monday)
const SPRINT_REFERENCE_NUMBER = 2; // This is Sprint 2
const SPRINT_REFERENCE_QUARTER = 4; // Q4
const SPRINT_REFERENCE_YEAR = 2025;

const SPRINT_DURATION_DAYS = 14; // 2 calendar weeks (including weekends)
const SPRINT_END_OFFSET_DAYS = 11; // Mon to Fri of second week (11 days from Monday = second Friday)
const SPRINTS_PER_QUARTER = 6; // 6 sprints per quarter
const QUARTERS_PER_YEAR = 4; // 4 quarters per year

/**
 * Calculate sprint information for a given date
 * @param date - Date to check
 * @returns Object containing sprint number (1-6), quarter (1-4), and year
 */
export function getSprintInfo(date: Date): {
  sprintNumber: number;
  quarter: number;
  year: number;
} {
  // Calculate days from reference date (using local dates to avoid UTC issues)
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const localReference = new Date(
    SPRINT_REFERENCE_DATE.getFullYear(),
    SPRINT_REFERENCE_DATE.getMonth(),
    SPRINT_REFERENCE_DATE.getDate()
  );

  const daysDifference = Math.floor(
    (localDate.getTime() - localReference.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate how many sprints have passed since reference
  const sprintsPassed = Math.floor(daysDifference / SPRINT_DURATION_DAYS);

  // Calculate total sprint index from reference sprint
  // Reference is Sprint 2 Q4 2025, which is sprint index:
  // Q1: sprints 1-6, Q2: sprints 7-12, Q3: sprints 13-18, Q4: sprints 19-24
  // Sprint 2 Q4 = 19 + 2 - 1 = 20 (0-based: sprint 19)
  const referenceSprintIndex =
    (SPRINT_REFERENCE_QUARTER - 1) * SPRINTS_PER_QUARTER +
    (SPRINT_REFERENCE_NUMBER - 1);

  const currentSprintIndex = referenceSprintIndex + sprintsPassed;

  // Calculate year offset (every 24 sprints = 1 year)
  const totalSprintsPerYear = SPRINTS_PER_QUARTER * QUARTERS_PER_YEAR;
  const yearOffset = Math.floor(currentSprintIndex / totalSprintsPerYear);

  // Sprint index within the year (0-23)
  let sprintInYear = currentSprintIndex % totalSprintsPerYear;
  if (sprintInYear < 0) {
    sprintInYear += totalSprintsPerYear;
  }

  // Calculate quarter (0-3) and sprint within quarter (0-5)
  const quarter = Math.floor(sprintInYear / SPRINTS_PER_QUARTER) + 1;
  const sprintNumber = (sprintInYear % SPRINTS_PER_QUARTER) + 1;

  const year = SPRINT_REFERENCE_YEAR + yearOffset;

  return { sprintNumber, quarter, year };
}

/**
 * Get sprint name for a given date
 * @param date - Date to get sprint name for
 * @returns Sprint name (e.g., "Sprint 2 Q4 2025", "Sprint 1 Q1 2026")
 */
export function getSprintName(date: Date): string {
  const { sprintNumber, quarter, year } = getSprintInfo(date);
  return `Sprint ${sprintNumber} Q${quarter} ${year}`;
}

/**
 * Get sprint start date for a given date
 * @param date - Date within the sprint
 * @returns Start date of the sprint (local date, no UTC conversion)
 */
export function getSprintStartDate(date: Date): Date {
  // Calculate days from reference date
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const localReference = new Date(
    SPRINT_REFERENCE_DATE.getFullYear(),
    SPRINT_REFERENCE_DATE.getMonth(),
    SPRINT_REFERENCE_DATE.getDate()
  );

  const daysDifference = Math.floor(
    (localDate.getTime() - localReference.getTime()) / (1000 * 60 * 60 * 24)
  );

  const sprintsPassed = Math.floor(daysDifference / SPRINT_DURATION_DAYS);

  // Calculate start date
  const startDate = new Date(localReference);
  startDate.setDate(startDate.getDate() + sprintsPassed * SPRINT_DURATION_DAYS);

  return startDate;
}

/**
 * Get sprint end date for a given date
 * @param date - Date within the sprint
 * @returns End date of the sprint (second Friday, excludes weekend)
 */
export function getSprintEndDate(date: Date): Date {
  const startDate = getSprintStartDate(date);
  const endDate = new Date(startDate);
  // Add 11 days to get from Monday to second Friday (12 calendar days total)
  endDate.setDate(endDate.getDate() + SPRINT_END_OFFSET_DAYS);
  return endDate;
}

/**
 * Group dates by sprint
 * @param dates - Array of date strings (YYYY-MM-DD)
 * @returns Record of sprint names to date strings
 */
export function groupDatesBySprint(dates: string[]): Record<string, string[]> {
  const sprints: Record<string, string[]> = {};

  dates.forEach((dateStr) => {
    const date = new Date(dateStr);
    const sprintName = getSprintName(date);

    if (!sprints[sprintName]) {
      sprints[sprintName] = [];
    }
    sprints[sprintName].push(dateStr);
  });

  return sprints;
}

/**
 * Get sprint name with date range for display
 * @param date - Date within the sprint
 * @returns Formatted sprint name with date range (e.g., "Sprint 2 Q4 2025 (27/10/2025 - 07/11/2025)")
 */
export function getSprintNameWithDateRange(date: Date): string {
  const sprintName = getSprintName(date);
  const startDate = getSprintStartDate(date);
  const endDate = getSprintEndDate(date);

  // Format date as DD/MM/YYYY (Indonesian format)
  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return `${sprintName} (${formatDate(startDate)} - ${formatDate(endDate)})`;
}
