export interface EmploymentPeriod {
  startDate: string;
  endDate: string;
}

export interface MemberLifecycleDates {
  joinDate?: string | null;
  resignDate?: string | null;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isMemberActiveDuring(
  member: MemberLifecycleDates,
  period: EmploymentPeriod,
): boolean {
  return (!member.joinDate || member.joinDate <= period.endDate)
    && (!member.resignDate || member.resignDate >= period.startDate);
}

export function employmentPeriodFor(
  member: MemberLifecycleDates,
  period: EmploymentPeriod,
): EmploymentPeriod | null {
  if (!isMemberActiveDuring(member, period)) return null;
  return {
    startDate: member.joinDate && member.joinDate > period.startDate
      ? member.joinDate
      : period.startDate,
    endDate: member.resignDate && member.resignDate < period.endDate
      ? member.resignDate
      : period.endDate,
  };
}

export function monthPeriod(month: string): EmploymentPeriod {
  const [year, monthNumber] = month.split('-').map(Number);
  const endDate = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return { startDate: `${month}-01`, endDate };
}
