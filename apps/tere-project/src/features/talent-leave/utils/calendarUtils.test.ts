import {
  groupByTeam,
  transformToRowData,
  getCellColorClass,
} from './calendarUtils';
import type {
  TalentLeaveResponse,
} from '../types/talent-leave.types';

describe('calendarUtils', () => {
  describe('groupByTeam', () => {
    it('should correctly group leave records by team name', () => {
      const leaveRecords: TalentLeaveResponse[] = [
        {
          id: '1',
          name: 'John Doe',
          team: 'Engineering',
          dateFrom: '2024-01-15T00:00:00Z',
          dateTo: '2024-01-20T00:00:00Z',
          status: 'Confirmed',
          role: 'Developer',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Jane Smith',
          team: 'Engineering',
          dateFrom: '2024-01-22T00:00:00Z',
          dateTo: '2024-01-25T00:00:00Z',
          status: 'Draft',
          role: 'Senior Developer',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '3',
          name: 'Bob Wilson',
          team: 'Product',
          dateFrom: '2024-01-10T00:00:00Z',
          dateTo: '2024-01-12T00:00:00Z',
          status: 'Confirmed',
          role: 'Product Manager',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const result = groupByTeam(leaveRecords);

      expect(result).toHaveLength(2);
      expect(result[0].teamName).toBe('Engineering');
      expect(result[0].members).toHaveLength(2);
      expect(result[1].teamName).toBe('Product');
      expect(result[1].members).toHaveLength(1);
    });

    it('should sort teams alphabetically', () => {
      const leaveRecords: TalentLeaveResponse[] = [
        {
          id: '1',
          name: 'User 1',
          team: 'Zebra Team',
          dateFrom: '2024-01-15T00:00:00Z',
          dateTo: '2024-01-20T00:00:00Z',
          status: 'Confirmed',
          role: 'Developer',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'User 2',
          team: 'Alpha Team',
          dateFrom: '2024-01-22T00:00:00Z',
          dateTo: '2024-01-25T00:00:00Z',
          status: 'Draft',
          role: 'Developer',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '3',
          name: 'User 3',
          team: 'Beta Team',
          dateFrom: '2024-01-10T00:00:00Z',
          dateTo: '2024-01-12T00:00:00Z',
          status: 'Confirmed',
          role: 'Developer',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const result = groupByTeam(leaveRecords);

      expect(result[0].teamName).toBe('Alpha Team');
      expect(result[1].teamName).toBe('Beta Team');
      expect(result[2].teamName).toBe('Zebra Team');
    });

    it('should handle empty array gracefully', () => {
      const result = groupByTeam([]);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('transformToRowData', () => {
    it('should calculate correct leave count', () => {
      const leave: TalentLeaveResponse = {
        id: '1',
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-01-20T00:00:00Z',
        status: 'Confirmed',
        role: 'Developer',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformToRowData(leave);

      // January 15 to 20 = 6 days
      expect(result.leaveCount).toBe(6);
    });

    it('should format date range correctly', () => {
      const leave: TalentLeaveResponse = {
        id: '1',
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-01-20T00:00:00Z',
        status: 'Confirmed',
        role: 'Developer',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformToRowData(leave);

      expect(result.dateRange).toBe('01/15/2024 - 01/20/2024');
    });

    it('should extract all leave dates as array', () => {
      const leave: TalentLeaveResponse = {
        id: '1',
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-01-17T00:00:00Z',
        status: 'Confirmed',
        role: 'Developer',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformToRowData(leave);

      expect(result.leaveDates).toHaveLength(3);
      expect(result.leaveDates).toContain('2024-01-15');
      expect(result.leaveDates).toContain('2024-01-16');
      expect(result.leaveDates).toContain('2024-01-17');
    });

    it('should preserve all properties from leave record', () => {
      const leave: TalentLeaveResponse = {
        id: '123',
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-01-20T00:00:00Z',
        status: 'Confirmed',
        role: 'Senior Developer',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = transformToRowData(leave);

      expect(result.id).toBe('123');
      expect(result.name).toBe('John Doe');
      expect(result.team).toBe('Engineering');
      expect(result.role).toBe('Senior Developer');
      expect(result.status).toBe('Confirmed');
    });
  });

  describe('getCellColorClass', () => {
    it('should return weekend color when isWeekend=true', () => {
      const result = getCellColorClass(true, false, false);
      expect(result).toBe('bg-slate-100');
    });

    it('should return leave color when isLeaveDate=true', () => {
      const result = getCellColorClass(false, false, true);
      expect(result).toBe('bg-red-200');
    });

    it('should return holiday color when isHoliday=true', () => {
      const result = getCellColorClass(false, true, false);
      expect(result).toBe('bg-red-100');
    });

    it('should prioritize weekend over leave', () => {
      // Weekend + leave date
      const result = getCellColorClass(true, false, true);
      expect(result).toBe('bg-slate-100');
    });

    it('should prioritize weekend over holiday', () => {
      // Weekend + holiday
      const result = getCellColorClass(true, true, false);
      expect(result).toBe('bg-slate-100');
    });

    it('should prioritize leave over holiday', () => {
      // Holiday + leave date (not weekend)
      const result = getCellColorClass(false, true, true);
      expect(result).toBe('bg-red-200');
    });

    it('should return white background for normal days', () => {
      const result = getCellColorClass(false, false, false);
      expect(result).toBe('bg-white');
    });
  });
});
