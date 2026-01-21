// Leave date range with status
export interface LeaveDateRange {
  dateFrom: string; // ISO 8601
  dateTo: string; // ISO 8601
  status: 'Draft' | 'Confirmed' | 'Sick'; // Status per leave range
}

// Response from GET /talent-leave
export interface TalentLeaveResponse {
  id: string;
  name: string;
  team: string;
  leaveDate: LeaveDateRange[]; // Array of leave date ranges with status
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Response from GET /talent-leave/talents
export interface TalentResponse {
  id: string;
  name: string;
  team: string;
  role: string;
}

// Request for POST /talent-leave
export interface CreateLeaveRequest {
  name: string;
  team: string;
  role: string;
  leaveDate?: LeaveDateRange[]; // Optional array of leave date ranges with status
}

// Request for PUT /talent-leave/:id
export interface UpdateLeaveRequest {
  name?: string;
  team?: string;
  role?: string;
  leaveDate?: LeaveDateRange[]; // Array of leave date ranges with status
}

// Public Holiday
export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isNational: boolean; // true = national holiday, false = regional/tentative
}

// Calendar cell data
export interface CalendarCell {
  date: string; // YYYY-MM-DD
  dayName: string; // Senin, Selasa, etc.
  isWeekend: boolean;
  isHoliday: boolean;
  isNationalHoliday: boolean; // true if national holiday, false if regional
  holidayName?: string;
}

// Grouped leave data for calendar rendering
export interface TeamGroup {
  teamName: string;
  members: LeaveRowData[];
}

export interface LeaveRowData {
  id: string;
  name: string;
  team: string;
  role: string;
  leaveCount: number; // Total days across all ranges
  dateRanges: Array<{ dateFrom: string; dateTo: string; status: string; display: string }>; // Multiple date ranges with status
  leaveDates: string[]; // Array of YYYY-MM-DD (flattened from all ranges)
  leaveDatesWithStatus: Record<string, 'Draft' | 'Confirmed' | 'Sick'>; // Map date to status
  dateRange: string; // Formatted date range display (comma-separated if multiple)
  status: string; // Status display (unique statuses if multiple)
}
