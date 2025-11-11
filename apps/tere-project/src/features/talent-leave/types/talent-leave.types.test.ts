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

describe('TalentLeave Types', () => {
  describe('TalentLeaveResponse', () => {
    it('should accept valid API response', () => {
      const validResponse: TalentLeaveResponse = {
        id: '123',
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-01-20T00:00:00Z',
        status: 'Confirmed',
        role: 'Software Engineer',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(validResponse).toBeDefined();
      expect(validResponse.id).toBe('123');
      expect(validResponse.name).toBe('John Doe');
    });
  });

  describe('TalentResponse', () => {
    it('should accept valid talent data', () => {
      const validTalent: TalentResponse = {
        id: '456',
        name: 'Jane Smith',
        team: 'Product',
        role: 'Product Manager',
      };

      expect(validTalent).toBeDefined();
      expect(validTalent.id).toBe('456');
      expect(validTalent.team).toBe('Product');
    });
  });

  describe('CreateLeaveRequest', () => {
    it('should enforce required fields', () => {
      const validRequest: CreateLeaveRequest = {
        name: 'John Doe',
        team: 'Engineering',
        role: 'Software Engineer',
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-01-20T00:00:00Z',
        status: 'Draft',
      };

      expect(validRequest).toBeDefined();
      expect(validRequest.status).toBe('Draft');
    });

    it('should accept Confirmed status', () => {
      const confirmedRequest: CreateLeaveRequest = {
        name: 'Jane Smith',
        team: 'Product',
        role: 'Product Manager',
        dateFrom: '2024-02-01T00:00:00Z',
        dateTo: '2024-02-05T00:00:00Z',
        status: 'Confirmed',
      };

      expect(confirmedRequest.status).toBe('Confirmed');
    });
  });

  describe('UpdateLeaveRequest', () => {
    it('should allow partial updates', () => {
      const partialUpdate: UpdateLeaveRequest = {
        status: 'Confirmed',
      };

      expect(partialUpdate).toBeDefined();
      expect(partialUpdate.status).toBe('Confirmed');
      expect(partialUpdate.name).toBeUndefined();
    });

    it('should allow updating only dates', () => {
      const dateUpdate: UpdateLeaveRequest = {
        dateFrom: '2024-03-01T00:00:00Z',
        dateTo: '2024-03-10T00:00:00Z',
      };

      expect(dateUpdate.dateFrom).toBeDefined();
      expect(dateUpdate.dateTo).toBeDefined();
    });
  });

  describe('Holiday', () => {
    it('should have correct shape', () => {
      const holiday: Holiday = {
        date: '2024-12-25',
        name: 'Christmas Day',
      };

      expect(holiday.date).toBe('2024-12-25');
      expect(holiday.name).toBe('Christmas Day');
    });
  });

  describe('CalendarCell', () => {
    it('should have correct shape for weekday', () => {
      const weekdayCell: CalendarCell = {
        date: '2024-01-15',
        dayName: 'Senin',
        isWeekend: false,
        isHoliday: false,
      };

      expect(weekdayCell.isWeekend).toBe(false);
      expect(weekdayCell.isHoliday).toBe(false);
      expect(weekdayCell.holidayName).toBeUndefined();
    });

    it('should have correct shape for weekend', () => {
      const weekendCell: CalendarCell = {
        date: '2024-01-20',
        dayName: 'Sabtu',
        isWeekend: true,
        isHoliday: false,
      };

      expect(weekendCell.isWeekend).toBe(true);
    });

    it('should have correct shape for holiday', () => {
      const holidayCell: CalendarCell = {
        date: '2024-12-25',
        dayName: 'Rabu',
        isWeekend: false,
        isHoliday: true,
        holidayName: 'Christmas Day',
      };

      expect(holidayCell.isHoliday).toBe(true);
      expect(holidayCell.holidayName).toBe('Christmas Day');
    });
  });

  describe('TeamGroup', () => {
    it('should have correct shape', () => {
      const teamGroup: TeamGroup = {
        teamName: 'Engineering',
        members: [],
      };

      expect(teamGroup.teamName).toBe('Engineering');
      expect(Array.isArray(teamGroup.members)).toBe(true);
    });
  });

  describe('LeaveRowData', () => {
    it('should have correct shape', () => {
      const leaveRow: LeaveRowData = {
        id: '789',
        name: 'John Doe',
        team: 'Engineering',
        role: 'Software Engineer',
        status: 'Confirmed',
        leaveCount: 5,
        dateRange: '01/15/2024 - 01/20/2024',
        leaveDates: ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'],
      };

      expect(leaveRow.leaveCount).toBe(5);
      expect(leaveRow.leaveDates).toHaveLength(5);
      expect(leaveRow.dateRange).toContain('01/15/2024');
    });
  });
});
