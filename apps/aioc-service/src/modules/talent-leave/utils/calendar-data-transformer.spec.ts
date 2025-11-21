import {
  generateDateColumns,
  groupByTeam,
  calculateSprintGroups,
} from './calendar-data-transformer';
import type { TalentLeaveResponseDto } from '../interfaces/talent-leave.dto';

describe('CalendarDataTransformer', () => {
  describe('generateDateColumns', () => {
    it('should create CalendarCell array from date range', () => {
      const result = generateDateColumns('2025-01-13', '2025-01-17');

      expect(result).toHaveLength(5);
      expect(result[0].date).toBe('2025-01-13');
      expect(result[4].date).toBe('2025-01-17');
      expect(result[0]).toHaveProperty('dayName');
      expect(result[0]).toHaveProperty('dayNumber');
      expect(result[0]).toHaveProperty('isWeekend');
    });

    it('should mark weekends correctly', () => {
      // 2025-01-11 is Saturday, 2025-01-12 is Sunday
      const result = generateDateColumns('2025-01-11', '2025-01-13');

      expect(result[0].isWeekend).toBe(true); // Saturday
      expect(result[1].isWeekend).toBe(true); // Sunday
      expect(result[2].isWeekend).toBe(false); // Monday
    });

    it('should include holiday information when provided', () => {
      const holidays = [
        { date: '2025-01-01', name: 'New Year', isNational: true },
        { date: '2025-01-02', name: 'Regional Holiday', isNational: false },
      ];

      const result = generateDateColumns('2025-01-01', '2025-01-03', holidays);

      expect(result[0].isHoliday).toBe(true);
      expect(result[0].isNationalHoliday).toBe(true);
      expect(result[0].holidayName).toBe('New Year');

      expect(result[1].isHoliday).toBe(true);
      expect(result[1].isNationalHoliday).toBe(false);
      expect(result[1].holidayName).toBe('Regional Holiday');

      expect(result[2].isHoliday).toBe(false);
      expect(result[2].holidayName).toBeUndefined();
    });

    it('should handle empty holidays array', () => {
      const result = generateDateColumns('2025-01-01', '2025-01-03', []);

      result.forEach((cell) => {
        expect(cell.isHoliday).toBe(false);
        expect(cell.isNationalHoliday).toBe(false);
        expect(cell.holidayName).toBeUndefined();
      });
    });
  });

  describe('groupByTeam', () => {
    const mockLeaveRecords: TalentLeaveResponseDto[] = [
      {
        id: '1',
        name: 'Alice',
        team: 'Engineering',
        role: 'BE',
        leaveDate: [
          {
            dateFrom: '2025-01-13',
            dateTo: '2025-01-15',
            status: 'Confirmed',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Bob',
        team: 'Engineering',
        role: 'FE',
        leaveDate: [
          {
            dateFrom: '2025-01-20',
            dateTo: '2025-01-22',
            status: 'Draft',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '3',
        name: 'Charlie',
        team: 'Design',
        role: 'UI',
        leaveDate: [
          {
            dateFrom: '2025-01-14',
            dateTo: '2025-01-16',
            status: 'Confirmed',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    it('should group leave records by team name', () => {
      const result = groupByTeam(
        mockLeaveRecords,
        undefined,
        '2025-01-13',
        '2025-01-31',
      );

      expect(result).toHaveLength(2);
      expect(result.find((g) => g.teamName === 'Engineering')).toBeDefined();
      expect(result.find((g) => g.teamName === 'Design')).toBeDefined();
    });

    it('should sort teams alphabetically', () => {
      const result = groupByTeam(
        mockLeaveRecords,
        undefined,
        '2025-01-13',
        '2025-01-31',
      );

      expect(result[0].teamName).toBe('Design');
      expect(result[1].teamName).toBe('Engineering');
    });

    it('should sort members within team alphabetically', () => {
      const result = groupByTeam(
        mockLeaveRecords,
        undefined,
        '2025-01-13',
        '2025-01-31',
      );

      const engineeringTeam = result.find((g) => g.teamName === 'Engineering');
      expect(engineeringTeam?.members[0].name).toBe('Alice');
      expect(engineeringTeam?.members[1].name).toBe('Bob');
    });

    it('should calculate leave count excluding weekends', () => {
      // 2025-01-13 (Mon) to 2025-01-15 (Wed) = 3 weekdays
      const result = groupByTeam(
        mockLeaveRecords,
        undefined,
        '2025-01-13',
        '2025-01-31',
      );

      const alice = result
        .find((g) => g.teamName === 'Engineering')
        ?.members.find((m) => m.name === 'Alice');
      expect(alice?.leaveCount).toBe(3);
    });

    it('should calculate leave count excluding holidays', () => {
      const holidays = ['2025-01-14']; // Holiday on Tuesday

      const result = groupByTeam(
        mockLeaveRecords,
        holidays,
        '2025-01-13',
        '2025-01-31',
      );

      const alice = result
        .find((g) => g.teamName === 'Engineering')
        ?.members.find((m) => m.name === 'Alice');
      // 2025-01-13 (Mon) to 2025-01-15 (Wed) = 3 days
      // Minus 2025-01-14 (holiday) = 2 days
      expect(alice?.leaveCount).toBe(2);
    });

    it('should generate comma-separated date ranges correctly', () => {
      const multiRangeRecord: TalentLeaveResponseDto = {
        id: '4',
        name: 'David',
        team: 'Engineering',
        role: 'BE',
        leaveDate: [
          {
            dateFrom: '2025-01-13',
            dateTo: '2025-01-15',
            status: 'Confirmed',
          },
          {
            dateFrom: '2025-01-20',
            dateTo: '2025-01-22',
            status: 'Confirmed',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      const result = groupByTeam(
        [multiRangeRecord],
        undefined,
        '2025-01-13',
        '2025-01-31',
      );

      const david = result[0].members[0];
      expect(david.dateRange).toBe('13-15 Jan, 20-22 Jan');
    });

    it('should create leaveDatesWithStatus map correctly', () => {
      const result = groupByTeam(
        mockLeaveRecords,
        undefined,
        '2025-01-13',
        '2025-01-31',
      );

      const alice = result
        .find((g) => g.teamName === 'Engineering')
        ?.members.find((m) => m.name === 'Alice');

      expect(alice?.leaveDatesWithStatus['2025-01-13']).toBe('Confirmed');
      expect(alice?.leaveDatesWithStatus['2025-01-14']).toBe('Confirmed');
      expect(alice?.leaveDatesWithStatus['2025-01-15']).toBe('Confirmed');

      const bob = result
        .find((g) => g.teamName === 'Engineering')
        ?.members.find((m) => m.name === 'Bob');
      expect(bob?.leaveDatesWithStatus['2025-01-20']).toBe('Draft');
    });

    it('should exclude records with no leave in date range', () => {
      const outsideRangeRecord: TalentLeaveResponseDto = {
        id: '5',
        name: 'Eve',
        team: 'Engineering',
        role: 'QA',
        leaveDate: [
          {
            dateFrom: '2025-02-01', // Outside visible range
            dateTo: '2025-02-05',
            status: 'Confirmed',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      const result = groupByTeam(
        [...mockLeaveRecords, outsideRangeRecord],
        undefined,
        '2025-01-13',
        '2025-01-31',
      );

      const engineeringTeam = result.find((g) => g.teamName === 'Engineering');
      // Should not include Eve since her leave is outside range
      expect(
        engineeringTeam?.members.find((m) => m.name === 'Eve'),
      ).toBeUndefined();
    });

    it('should return empty array for empty records', () => {
      const result = groupByTeam([], undefined, '2025-01-13', '2025-01-31');
      expect(result).toEqual([]);
    });

    it('should include memberCount in TeamGroupData', () => {
      const result = groupByTeam(
        mockLeaveRecords,
        undefined,
        '2025-01-13',
        '2025-01-31',
      );

      const engineeringTeam = result.find((g) => g.teamName === 'Engineering');
      expect(engineeringTeam?.memberCount).toBe(2);

      const designTeam = result.find((g) => g.teamName === 'Design');
      expect(designTeam?.memberCount).toBe(1);
    });
  });

  describe('calculateSprintGroups', () => {
    it('should group dates by sprint correctly', () => {
      const dateColumns = [
        {
          date: '2025-10-27',
          dayName: 'Mon',
          dayNumber: 27,
          isWeekend: false,
          isHoliday: false,
          isNationalHoliday: false,
        },
        {
          date: '2025-10-28',
          dayName: 'Tue',
          dayNumber: 28,
          isWeekend: false,
          isHoliday: false,
          isNationalHoliday: false,
        },
      ];

      const result = calculateSprintGroups(dateColumns);

      expect(Object.keys(result)).toHaveLength(1);
      const sprintKey = Object.keys(result)[0];
      expect(sprintKey).toContain('Sprint 2 Q4 2025');
      expect(result[sprintKey].dateCount).toBe(2);
    });

    it('should handle multiple sprints in range', () => {
      // October 27 - November 10 spans Sprint 2 and Sprint 3
      const dateColumns = [
        {
          date: '2025-10-27',
          dayName: 'Mon',
          dayNumber: 27,
          isWeekend: false,
          isHoliday: false,
          isNationalHoliday: false,
        }, // Sprint 2
        {
          date: '2025-11-10',
          dayName: 'Mon',
          dayNumber: 10,
          isWeekend: false,
          isHoliday: false,
          isNationalHoliday: false,
        }, // Sprint 3
      ];

      const result = calculateSprintGroups(dateColumns);

      expect(Object.keys(result)).toHaveLength(2);
      expect(
        Object.keys(result).some((k) => k.includes('Sprint 2 Q4 2025')),
      ).toBe(true);
      expect(
        Object.keys(result).some((k) => k.includes('Sprint 3 Q4 2025')),
      ).toBe(true);
    });

    it('should handle sprint boundaries', () => {
      // Last day of Sprint 2 and first day of Sprint 3
      const dateColumns = [
        {
          date: '2025-11-07',
          dayName: 'Fri',
          dayNumber: 7,
          isWeekend: false,
          isHoliday: false,
          isNationalHoliday: false,
        }, // Sprint 2 end
        {
          date: '2025-11-10',
          dayName: 'Mon',
          dayNumber: 10,
          isWeekend: false,
          isHoliday: false,
          isNationalHoliday: false,
        }, // Sprint 3 start
      ];

      const result = calculateSprintGroups(dateColumns);

      expect(Object.keys(result)).toHaveLength(2);
      const sprint2 = Object.values(result).find((s) =>
        s.name.includes('Sprint 2 Q4 2025'),
      );
      const sprint3 = Object.values(result).find((s) =>
        s.name.includes('Sprint 3 Q4 2025'),
      );

      expect(sprint2?.dateCount).toBe(1);
      expect(sprint3?.dateCount).toBe(1);
    });

    it('should include sprint start and end dates', () => {
      const dateColumns = [
        {
          date: '2025-10-27',
          dayName: 'Mon',
          dayNumber: 27,
          isWeekend: false,
          isHoliday: false,
          isNationalHoliday: false,
        },
      ];

      const result = calculateSprintGroups(dateColumns);
      const sprintKey = Object.keys(result)[0];
      const sprintInfo = result[sprintKey];

      expect(sprintInfo.startDate).toBe('2025-10-27'); // Monday
      expect(sprintInfo.endDate).toBe('2025-11-07'); // Second Friday
    });
  });
});
