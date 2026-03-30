import type { CalendarCell, TeamGroup, LeaveRowData } from '@shared/types/talent-leave.types';
import type { TalentLeaveResponse } from '@shared/types/talent-leave.types';
import { generateDateRange, calculateDayCount, formatDateRange } from './date-utilities';
import { getSprintStartDate, getSprintEndDate, getSprintNameWithDateRange } from './sprint-utilities';

export interface SprintInfo {
  name: string;
  startDate: string;
  endDate: string;
  dateCount: number;
}

export interface TeamMemberRow {
  id: string;
  name: string;
  team: string;
  leaveCount: number;
  dateRange: string;
  leaveDates: string[];
  leaveDatesWithStatus: Record<string, 'Draft' | 'Confirmed' | 'Sick'>;
}

export interface TeamGroupData {
  teamName: string;
  memberCount: number;
  members: TeamMemberRow[];
}

export function generateDateColumns(
  startDate: string,
  endDate: string,
  holidayDates?: Array<{ date: string; name: string; isNational: boolean }>,
): CalendarCell[] {
  const cells = generateDateRange(startDate, endDate);
  if (!holidayDates || holidayDates.length === 0) return cells;
  const holidayMap = new Map(holidayDates.map((h) => [h.date, { name: h.name, isNational: h.isNational }]));
  return cells.map((cell) => {
    const holiday = holidayMap.get(cell.date);
    if (holiday) return { ...cell, isHoliday: true, isNationalHoliday: holiday.isNational, holidayName: holiday.name };
    return cell;
  });
}

export function groupByTeam(
  leaveRecords: TalentLeaveResponse[],
  holidayDates: string[] | undefined,
  startDate: string,
  endDate: string,
): TeamGroupData[] {
  if (leaveRecords.length === 0) return [];
  const groupedMap = new Map<string, TeamMemberRow[]>();
  leaveRecords.forEach((leave) => {
    const rowData = transformToRowData(leave, holidayDates, startDate, endDate);
    if (!groupedMap.has(leave.team)) groupedMap.set(leave.team, []);
    groupedMap.get(leave.team)!.push(rowData);
  });
  return Array.from(groupedMap.entries())
    .map(([teamName, members]) => ({ teamName, memberCount: members.length, members: members.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));
}

export function calculateSprintGroups(dateColumns: CalendarCell[]): Record<string, SprintInfo> {
  const sprintGroups: Record<string, SprintInfo> = {};
  dateColumns.forEach((cell) => {
    const sprintName = getSprintNameWithDateRange(cell.date);
    const startDate = getSprintStartDate(cell.date);
    const endDate = getSprintEndDate(cell.date);
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    if (!sprintGroups[sprintName]) {
      sprintGroups[sprintName] = { name: sprintName, startDate: formatDate(startDate), endDate: formatDate(endDate), dateCount: 0 };
    }
    sprintGroups[sprintName].dateCount++;
  });
  return sprintGroups;
}

function transformToRowData(leave: TalentLeaveResponse, holidayDates: string[] | undefined, visibleStartDate: string, visibleEndDate: string): TeamMemberRow {
  const leaveCount = leave.leaveDate.reduce((total, range) => {
    let countFrom = range.dateFrom;
    let countTo = range.dateTo;
    const leaveStart = new Date(range.dateFrom);
    const leaveEnd = new Date(range.dateTo);
    const visibleStart = new Date(visibleStartDate);
    const visibleEnd = new Date(visibleEndDate);
    leaveStart.setHours(0, 0, 0, 0); leaveEnd.setHours(0, 0, 0, 0);
    visibleStart.setHours(0, 0, 0, 0); visibleEnd.setHours(0, 0, 0, 0);
    if (leaveEnd < visibleStart || leaveStart > visibleEnd) return total;
    if (leaveStart < visibleStart) countFrom = visibleStartDate;
    if (leaveEnd > visibleEnd) countTo = visibleEndDate;
    return total + calculateDayCount(countFrom, countTo, holidayDates);
  }, 0);

  const leaveDates: string[] = [];
  leave.leaveDate.forEach((range) => { leaveDates.push(...generateLeaveDatesArray(range.dateFrom, range.dateTo)); });

  const leaveDatesWithStatus: Record<string, 'Draft' | 'Confirmed' | 'Sick'> = {};
  leave.leaveDate.forEach((range) => {
    const dates = generateLeaveDatesArray(range.dateFrom, range.dateTo);
    dates.forEach((date) => { leaveDatesWithStatus[date] = range.status as 'Draft' | 'Confirmed' | 'Sick'; });
  });

  const dateRange = leave.leaveDate.map((range) => formatDateRange(range.dateFrom, range.dateTo)).join(', ');

  return { id: leave.id, name: leave.name, team: leave.team, leaveCount, dateRange, leaveDates, leaveDatesWithStatus };
}

function generateLeaveDatesArray(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const currentDate = parseDate(dateFrom);
  const endDate = parseDate(dateTo);
  currentDate.setHours(0, 0, 0, 0); endDate.setHours(0, 0, 0, 0);
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}
