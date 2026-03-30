// Single source of truth — used by both API routes and frontend features.

export interface LeaveDateRange {
  dateFrom: string;
  dateTo: string;
  status: 'Draft' | 'Confirmed' | 'Sick';
}

export interface TalentLeaveResponse {
  id: string;
  name: string;
  team: string;
  leaveDate: LeaveDateRange[];
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface TalentResponse {
  id: string;
  name: string;
  team: string;
  role: string;
}

export interface CreateLeaveRequest {
  name: string;
  team: string;
  role: string;
  leaveDate?: LeaveDateRange[];
}

export interface UpdateLeaveRequest {
  name?: string;
  team?: string;
  role?: string;
  leaveDate?: LeaveDateRange[];
}

export interface LeaveFilterDto {
  startDate?: string;
  endDate?: string;
  status?: string;
  team?: string;
}

// ── Calendar / export shapes (frontend uses these too) ───────────────────────

export interface CalendarCell {
  date: string;
  dayName: string;
  dayNumber: number;
  isWeekend: boolean;
  isHoliday: boolean;
  isNationalHoliday: boolean;
  holidayName?: string;
}

export interface TeamGroup {
  teamName: string;
  members: LeaveRowData[];
}

export interface LeaveRowData {
  id: string;
  name: string;
  team: string;
  role: string;
  leaveCount: number;
  dateRanges: Array<{ dateFrom: string; dateTo: string; status: string; display: string }>;
  leaveDates: string[];
  leaveDatesWithStatus: Record<string, 'Draft' | 'Confirmed' | 'Sick'>;
  dateRange: string;
  status: string;
}
