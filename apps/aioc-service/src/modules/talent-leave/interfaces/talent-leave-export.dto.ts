// Request DTO for exporting talent leave to Google Spreadsheet
export interface ExportTalentLeaveDto {
  startDate: string; // YYYY-MM-DD format - export start date
  endDate: string; // YYYY-MM-DD format - export end date
  accessToken: string; // OAuth2 access token from Google authorization
}

// Response DTO for export operation
export interface ExportTalentLeaveResponseDto {
  success: boolean; // Export operation success status
  message: string; // User-friendly message (e.g., "Spreadsheet created successfully")
  spreadsheetTitle: string; // Title of created spreadsheet (e.g., "Talent Leave - 01/01/2025 to 31/01/2025")
  spreadsheetUrl: string; // URL to access the created spreadsheet
  dateRange: {
    startDate: string; // YYYY-MM-DD format - export start date
    endDate: string; // YYYY-MM-DD format - export end date
  };
  exportedAt: string; // ISO 8601 timestamp of export operation
}

// Calendar cell interface for date columns
export interface CalendarCell {
  date: string; // YYYY-MM-DD format
  dayName: string; // Day name (e.g., "Mon", "Tue", "Wed")
  dayNumber: number; // Day of month (1-31)
  isWeekend: boolean; // True if Saturday or Sunday
  isHoliday: boolean; // True if any type of holiday (national or regional)
  isNationalHoliday: boolean; // True if national holiday
  holidayName?: string; // Optional holiday name
}

// Sprint information for team header rows
export interface SprintInfo {
  name: string; // Sprint name with date range (e.g., "Sprint 25 (13 Jan - 26 Jan)")
  startDate: string; // YYYY-MM-DD format - sprint start date
  endDate: string; // YYYY-MM-DD format - sprint end date
  dateCount: number; // Number of days in sprint within visible date range
}

// Team member row data for spreadsheet
export interface TeamMemberRow {
  id: string; // Talent leave record ID
  name: string; // Team member name
  team: string; // Team name
  leaveCount: number; // Total leave days excluding weekends and holidays
  dateRange: string; // Comma-separated date ranges (e.g., "13-15 Jan, 20-22 Jan")
  leaveDates: string[]; // Array of leave dates in YYYY-MM-DD format
  leaveDatesWithStatus: Record<string, 'Draft' | 'Confirmed'>; // Map of date to status
}

// Team group data for spreadsheet sections
export interface TeamGroupData {
  teamName: string; // Team name
  memberCount: number; // Number of team members
  members: TeamMemberRow[]; // Array of team member rows
}
