const SPRINT_REFERENCE_DATE = new Date(2025, 9, 27); // October 27, 2025 (Monday)
const SPRINT_REFERENCE_NUMBER = 2;
const SPRINT_REFERENCE_QUARTER = 4;
const SPRINT_REFERENCE_YEAR = 2025;
const SPRINT_DURATION_DAYS = 14;
const SPRINT_END_OFFSET_DAYS = 11;
const SPRINTS_PER_QUARTER = 6;
const QUARTERS_PER_YEAR = 4;

export function getSprintInfo(date: Date | string): { sprintNumber: number; quarter: number; year: number } {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  const localDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const localReference = new Date(SPRINT_REFERENCE_DATE.getFullYear(), SPRINT_REFERENCE_DATE.getMonth(), SPRINT_REFERENCE_DATE.getDate());
  const daysDifference = Math.floor((localDate.getTime() - localReference.getTime()) / (1000 * 60 * 60 * 24));
  const sprintsPassed = Math.floor(daysDifference / SPRINT_DURATION_DAYS);
  const referenceSprintIndex = (SPRINT_REFERENCE_QUARTER - 1) * SPRINTS_PER_QUARTER + (SPRINT_REFERENCE_NUMBER - 1);
  const currentSprintIndex = referenceSprintIndex + sprintsPassed;
  const totalSprintsPerYear = SPRINTS_PER_QUARTER * QUARTERS_PER_YEAR;
  const yearOffset = Math.floor(currentSprintIndex / totalSprintsPerYear);
  let sprintInYear = currentSprintIndex % totalSprintsPerYear;
  if (sprintInYear < 0) sprintInYear += totalSprintsPerYear;
  const quarter = Math.floor(sprintInYear / SPRINTS_PER_QUARTER) + 1;
  const sprintNumber = (sprintInYear % SPRINTS_PER_QUARTER) + 1;
  const year = SPRINT_REFERENCE_YEAR + yearOffset;
  return { sprintNumber, quarter, year };
}

export function getSprintName(date: Date | string): string {
  const { sprintNumber, quarter, year } = getSprintInfo(date);
  return `Sprint ${sprintNumber} Q${quarter} ${year}`;
}

export function getSprintStartDate(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  const localDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const localReference = new Date(SPRINT_REFERENCE_DATE.getFullYear(), SPRINT_REFERENCE_DATE.getMonth(), SPRINT_REFERENCE_DATE.getDate());
  const daysDifference = Math.floor((localDate.getTime() - localReference.getTime()) / (1000 * 60 * 60 * 24));
  const sprintsPassed = Math.floor(daysDifference / SPRINT_DURATION_DAYS);
  const startDate = new Date(localReference);
  startDate.setDate(startDate.getDate() + sprintsPassed * SPRINT_DURATION_DAYS);
  return startDate;
}

export function getSprintEndDate(date: Date | string): Date {
  const startDate = getSprintStartDate(date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + SPRINT_END_OFFSET_DAYS);
  return endDate;
}

export function getSprintNameWithDateRange(date: Date | string): string {
  const sprintName = getSprintName(date);
  const startDate = getSprintStartDate(date);
  const endDate = getSprintEndDate(date);
  const formatDate = (d: Date) => {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = monthNames[d.getMonth()];
    return `${day} ${month}`;
  };
  return `${sprintName} (${formatDate(startDate)} - ${formatDate(endDate)})`;
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}
