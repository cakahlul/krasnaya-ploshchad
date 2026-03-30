import { LeaveDateRange } from '@shared/types/talent-leave.types';

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isOnLeave(date: Date, leaveDates: LeaveDateRange[]): boolean {
  if (!leaveDates || leaveDates.length === 0) return false;

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return leaveDates.some((leave) => {
    if (leave.status !== 'Confirmed' && leave.status !== 'Sick') return false;
    return checkDate >= parseLocalDate(leave.dateFrom) && checkDate <= parseLocalDate(leave.dateTo);
  });
}

function parseLocalDate(dateStr: string): Date {
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  leaveDates: LeaveDateRange[] = [],
  nationalHolidays: string[] = [],
): number {
  if (startDate > endDate) return 0;

  let workingDays = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dateStr = formatDateToYYYYMMDD(current);
    if (!isWeekend(current) && !isOnLeave(current, leaveDates) && !nationalHolidays.includes(dateStr)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

export function getLeaveDataForMember(
  allLeaveData: Array<{ name: string; leaveDate: LeaveDateRange[] }>,
  memberName: string,
): LeaveDateRange[] {
  const record = allLeaveData.find(
    (r) => r.name.toLowerCase() === memberName.toLowerCase(),
  );
  return record?.leaveDate ?? [];
}
