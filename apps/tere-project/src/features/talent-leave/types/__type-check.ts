// Type checking verification file - ensures all interfaces compile correctly
import {
  TalentLeaveResponse,
  TalentResponse,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  Holiday,
  CalendarCell,
  TeamGroup,
  LeaveRowData,
} from './talent-leave.types';

// Test TalentLeaveResponse
const testLeaveResponse: TalentLeaveResponse = {
  id: '1',
  name: 'Test User',
  team: 'Engineering',
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-01-05T00:00:00Z',
  status: 'Confirmed',
  role: 'Developer',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Test TalentResponse
const testTalent: TalentResponse = {
  id: '1',
  name: 'Test User',
  team: 'Engineering',
  role: 'Developer',
};

// Test CreateLeaveRequest
const testCreateRequest: CreateLeaveRequest = {
  name: 'Test User',
  team: 'Engineering',
  role: 'Developer',
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-01-05T00:00:00Z',
  status: 'Draft',
};

// Test UpdateLeaveRequest
const testUpdateRequest: UpdateLeaveRequest = {
  status: 'Confirmed',
};

// Test Holiday
const testHoliday: Holiday = {
  date: '2024-12-25',
  name: 'Christmas',
};

// Test CalendarCell
const testCalendarCell: CalendarCell = {
  date: '2024-01-01',
  dayName: 'Senin',
  isWeekend: false,
  isHoliday: false,
};

// Test TeamGroup
const testTeamGroup: TeamGroup = {
  teamName: 'Engineering',
  members: [],
};

// Test LeaveRowData
const testLeaveRow: LeaveRowData = {
  id: '1',
  name: 'Test User',
  team: 'Engineering',
  role: 'Developer',
  status: 'Confirmed',
  leaveCount: 5,
  dateRange: '01/01/2024 - 01/05/2024',
  leaveDates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
};

// Export to avoid unused variable warnings
export {
  testLeaveResponse,
  testTalent,
  testCreateRequest,
  testUpdateRequest,
  testHoliday,
  testCalendarCell,
  testTeamGroup,
  testLeaveRow,
};
