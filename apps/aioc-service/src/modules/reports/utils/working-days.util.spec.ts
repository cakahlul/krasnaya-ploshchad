import {
  calculateWorkingDays,
  isWeekend,
  isOnLeave,
  getLeaveDataForMember,
} from './working-days.util';

describe('Working Days Utility', () => {
  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2024-01-13'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should return true for Sunday', () => {
      const sunday = new Date('2024-01-14'); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should return false for weekdays', () => {
      const monday = new Date('2024-01-15'); // Monday
      expect(isWeekend(monday)).toBe(false);
    });
  });

  describe('isOnLeave', () => {
    const leaveDates = [
      {
        dateFrom: '2024-01-15',
        dateTo: '2024-01-17',
        status: 'Confirmed',
      },
      {
        dateFrom: '2024-01-22',
        dateTo: '2024-01-22',
        status: 'Sick',
      },
      {
        dateFrom: '2024-01-25',
        dateTo: '2024-01-26',
        status: 'Draft',
      },
    ];

    it('should return true for date within Confirmed leave range', () => {
      const date = new Date('2024-01-16');
      expect(isOnLeave(date, leaveDates)).toBe(true);
    });

    it('should return true for date on Sick leave', () => {
      const date = new Date('2024-01-22');
      expect(isOnLeave(date, leaveDates)).toBe(true);
    });

    it('should return false for date within Draft leave range', () => {
      const date = new Date('2024-01-25');
      expect(isOnLeave(date, leaveDates)).toBe(false);
    });

    it('should return false for date not on leave', () => {
      const date = new Date('2024-01-18');
      expect(isOnLeave(date, leaveDates)).toBe(false);
    });

    it('should return false when leave dates array is empty', () => {
      const date = new Date('2024-01-16');
      expect(isOnLeave(date, [])).toBe(false);
    });
  });

  describe('calculateWorkingDays', () => {
    it('should calculate working days excluding weekends', () => {
      // Jan 15-19, 2024 (Mon-Fri) = 5 working days
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-19');
      expect(calculateWorkingDays(start, end, [])).toBe(5);
    });

    it('should exclude weekends from working days', () => {
      // Jan 15-21, 2024 (Mon-Sun) = 5 working days (exclude Sat, Sun)
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-21');
      expect(calculateWorkingDays(start, end, [])).toBe(5);
    });

    it('should exclude Confirmed leave days', () => {
      // Jan 15-19, 2024 (Mon-Fri) = 5 days
      // Leave: Jan 16-17 (Confirmed) = 2 days
      // Working days = 3
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-19');
      const leaves = [
        {
          dateFrom: '2024-01-16',
          dateTo: '2024-01-17',
          status: 'Confirmed',
        },
      ];
      expect(calculateWorkingDays(start, end, leaves)).toBe(3);
    });

    it('should exclude Sick leave days', () => {
      // Jan 15-19, 2024 (Mon-Fri) = 5 days
      // Leave: Jan 18 (Sick) = 1 day
      // Working days = 4
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-19');
      const leaves = [
        {
          dateFrom: '2024-01-18',
          dateTo: '2024-01-18',
          status: 'Sick',
        },
      ];
      expect(calculateWorkingDays(start, end, leaves)).toBe(4);
    });

    it('should not exclude Draft leave days', () => {
      // Jan 15-19, 2024 (Mon-Fri) = 5 days
      // Leave: Jan 16 (Draft) = should not be excluded
      // Working days = 5
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-19');
      const leaves = [
        {
          dateFrom: '2024-01-16',
          dateTo: '2024-01-16',
          status: 'Draft',
        },
      ];
      expect(calculateWorkingDays(start, end, leaves)).toBe(5);
    });

    it('should handle two-week sprint correctly', () => {
      // Jan 15 - Jan 26, 2024 = 10 working days (exclude 4 weekend days)
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-26');
      expect(calculateWorkingDays(start, end, [])).toBe(10);
    });

    it('should return 0 when start date is after end date', () => {
      const start = new Date('2024-01-20');
      const end = new Date('2024-01-15');
      expect(calculateWorkingDays(start, end, [])).toBe(0);
    });

    it('should handle single day sprint', () => {
      const start = new Date('2024-01-15'); // Monday
      const end = new Date('2024-01-15');
      expect(calculateWorkingDays(start, end, [])).toBe(1);
    });

    it('should return 0 for single day sprint on weekend', () => {
      const start = new Date('2024-01-13'); // Saturday
      const end = new Date('2024-01-13');
      expect(calculateWorkingDays(start, end, [])).toBe(0);
    });
    it('should exclude national holidays', () => {
      // Jan 15-19, 2024 (Mon-Fri) = 5 days
      // Holiday: Jan 17 = 1 day
      // Working days = 4
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-19');
      const holidays = ['2024-01-17'];
      expect(calculateWorkingDays(start, end, [], holidays)).toBe(4);
    });

    it('should exclude both leave and holidays', () => {
      // Jan 15-19, 2024 (Mon-Fri) = 5 days
      // Holiday: Jan 17 = 1 day
      // Leave: Jan 16 (Confirmed) = 1 day
      // Working days = 3
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-19');
      const leaves = [
        {
          dateFrom: '2024-01-16',
          dateTo: '2024-01-16',
          status: 'Confirmed',
        },
      ];
      const holidays = ['2024-01-17'];
      expect(calculateWorkingDays(start, end, leaves, holidays)).toBe(3);
    });

    it('should not double count if holiday and leave overlap', () => {
      // Jan 15-19, 2024 (Mon-Fri) = 5 days
      // Holiday: Jan 17 = 1 day
      // Leave: Jan 17 (Confirmed) = 1 day (overlap)
      // Working days = 4
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-19');
      const leaves = [
        {
          dateFrom: '2024-01-17',
          dateTo: '2024-01-17',
          status: 'Confirmed',
        },
      ];
      const holidays = ['2024-01-17'];
      expect(calculateWorkingDays(start, end, leaves, holidays)).toBe(4);
    });
  });

  describe('getLeaveDataForMember', () => {
    const allLeaveData = [
      {
        name: 'John Doe',
        leaveDate: [
          { dateFrom: '2024-01-15', dateTo: '2024-01-17', status: 'Confirmed' },
        ],
      },
      {
        name: 'Jane Smith',
        leaveDate: [
          { dateFrom: '2024-01-20', dateTo: '2024-01-22', status: 'Sick' },
        ],
      },
    ];

    it('should return leave data for matching member name', () => {
      const result = getLeaveDataForMember(allLeaveData, 'John Doe');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        dateFrom: '2024-01-15',
        dateTo: '2024-01-17',
        status: 'Confirmed',
      });
    });

    it('should match case-insensitively', () => {
      const result = getLeaveDataForMember(allLeaveData, 'john doe');
      expect(result).toHaveLength(1);
    });

    it('should return empty array for non-matching member', () => {
      const result = getLeaveDataForMember(allLeaveData, 'Unknown Person');
      expect(result).toEqual([]);
    });
  });
});
