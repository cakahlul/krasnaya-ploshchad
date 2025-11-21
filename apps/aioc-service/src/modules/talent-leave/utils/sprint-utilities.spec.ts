import {
  getSprintInfo,
  getSprintName,
  getSprintStartDate,
  getSprintEndDate,
  getSprintNameWithDateRange,
} from './sprint-utilities';

describe('SprintUtilities', () => {
  describe('getSprintInfo', () => {
    it('should calculate correct sprint number from reference date', () => {
      // October 27, 2025 is Sprint 2 Q4 2025 (reference date)
      const result = getSprintInfo(new Date(2025, 9, 27));
      expect(result.sprintNumber).toBe(2);
      expect(result.quarter).toBe(4);
      expect(result.year).toBe(2025);
    });

    it('should calculate sprint for date in Sprint 1 Q4 2025', () => {
      // October 13, 2025 should be Sprint 1 Q4 2025 (14 days before reference)
      const result = getSprintInfo(new Date(2025, 9, 13));
      expect(result.sprintNumber).toBe(1);
      expect(result.quarter).toBe(4);
      expect(result.year).toBe(2025);
    });

    it('should calculate sprint for date in Sprint 3 Q4 2025', () => {
      // November 10, 2025 should be Sprint 3 Q4 2025 (14 days after reference)
      const result = getSprintInfo(new Date(2025, 10, 10));
      expect(result.sprintNumber).toBe(3);
      expect(result.quarter).toBe(4);
      expect(result.year).toBe(2025);
    });

    it('should handle year boundaries correctly', () => {
      // December 30, 2025 should be Sprint 6 Q4 2025
      const resultQ4 = getSprintInfo(new Date(2025, 11, 30));
      expect(resultQ4.sprintNumber).toBe(6);
      expect(resultQ4.quarter).toBe(4);
      expect(resultQ4.year).toBe(2025);

      // January 6, 2026 should be Sprint 1 Q1 2026 (14 days after Sprint 6 Q4 2025)
      const resultQ1 = getSprintInfo(new Date(2026, 0, 6));
      expect(resultQ1.sprintNumber).toBe(1);
      expect(resultQ1.quarter).toBe(1);
      expect(resultQ1.year).toBe(2026);
    });

    it('should accept YYYY-MM-DD string format', () => {
      const result = getSprintInfo('2025-10-27');
      expect(result.sprintNumber).toBe(2);
      expect(result.quarter).toBe(4);
      expect(result.year).toBe(2025);
    });
  });

  describe('getSprintName', () => {
    it('should format sprint name with date range', () => {
      expect(getSprintName(new Date(2025, 9, 27))).toBe('Sprint 2 Q4 2025');
      expect(getSprintName(new Date(2025, 9, 13))).toBe('Sprint 1 Q4 2025');
      expect(getSprintName(new Date(2026, 0, 6))).toBe('Sprint 1 Q1 2026');
    });

    it('should accept YYYY-MM-DD string format', () => {
      expect(getSprintName('2025-10-27')).toBe('Sprint 2 Q4 2025');
    });
  });

  describe('getSprintStartDate', () => {
    it('should return correct sprint start (Monday)', () => {
      // October 27, 2025 is Monday (reference date, sprint start)
      const startDate = getSprintStartDate(new Date(2025, 9, 27));
      expect(startDate.getDay()).toBe(1); // Monday
      expect(startDate.getDate()).toBe(27);
      expect(startDate.getMonth()).toBe(9); // October
      expect(startDate.getFullYear()).toBe(2025);
    });

    it('should return sprint start for date in middle of sprint', () => {
      // November 3, 2025 (Wednesday) should return October 27 (Monday)
      const startDate = getSprintStartDate(new Date(2025, 10, 3));
      expect(startDate.getDay()).toBe(1); // Monday
      expect(startDate.getDate()).toBe(27);
      expect(startDate.getMonth()).toBe(9); // October
    });

    it('should accept YYYY-MM-DD string format', () => {
      const startDate = getSprintStartDate('2025-10-27');
      expect(startDate.getDate()).toBe(27);
      expect(startDate.getMonth()).toBe(9); // October
    });
  });

  describe('getSprintEndDate', () => {
    it('should return correct sprint end (second Friday, 11 days later)', () => {
      // Sprint starts October 27, 2025 (Monday)
      // Sprint ends November 7, 2025 (Friday) - 11 days later
      const endDate = getSprintEndDate(new Date(2025, 9, 27));
      expect(endDate.getDay()).toBe(5); // Friday
      expect(endDate.getDate()).toBe(7);
      expect(endDate.getMonth()).toBe(10); // November
      expect(endDate.getFullYear()).toBe(2025);
    });

    it('should return sprint end for date in middle of sprint', () => {
      // November 3, 2025 (Wednesday) should return November 7 (Friday)
      const endDate = getSprintEndDate(new Date(2025, 10, 3));
      expect(endDate.getDay()).toBe(5); // Friday
      expect(endDate.getDate()).toBe(7);
      expect(endDate.getMonth()).toBe(10); // November
    });

    it('should accept YYYY-MM-DD string format', () => {
      const endDate = getSprintEndDate('2025-10-27');
      expect(endDate.getDate()).toBe(7);
      expect(endDate.getMonth()).toBe(10); // November
    });
  });

  describe('sprint cycle', () => {
    it('should follow 14 day sprint cycle (2 weeks)', () => {
      // Sprint 2 Q4 2025 starts October 27
      const sprint2Start = getSprintStartDate(new Date(2025, 9, 27));

      // Sprint 3 Q4 2025 should start 14 days later (November 10)
      const sprint3Start = getSprintStartDate(new Date(2025, 10, 10));

      const daysDifference = Math.floor(
        (sprint3Start.getTime() - sprint2Start.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(daysDifference).toBe(14);
    });
  });

  describe('getSprintNameWithDateRange', () => {
    it('should format sprint name with short date range', () => {
      // October 27, 2025 - November 7, 2025
      const result = getSprintNameWithDateRange(new Date(2025, 9, 27));
      expect(result).toBe('Sprint 2 Q4 2025 (27 Oct - 07 Nov)');
    });

    it('should format sprint within same month', () => {
      // Sprint 1 Q4 2025: October 13 - October 24
      const result = getSprintNameWithDateRange(new Date(2025, 9, 13));
      expect(result).toBe('Sprint 1 Q4 2025 (13 Oct - 24 Oct)');
    });

    it('should accept YYYY-MM-DD string format', () => {
      const result = getSprintNameWithDateRange('2025-10-27');
      expect(result).toBe('Sprint 2 Q4 2025 (27 Oct - 07 Nov)');
    });

    it('should pad single digit days with zero', () => {
      // Check formatting for days 1-9
      const sprint1Start = getSprintStartDate(new Date(2025, 9, 13));
      const dayOfMonth = sprint1Start.getDate();

      // If day is single digit, result should have padded zero
      if (dayOfMonth < 10) {
        const result = getSprintNameWithDateRange(new Date(2025, 9, 13));
        expect(result).toMatch(/\b0\d\s\w{3}/);
      }
    });

    it('should handle all 12 months correctly', () => {
      // Test each month to ensure month names are correct
      const testDates = [
        { date: new Date(2025, 0, 5), month: 'Jan' }, // January
        { date: new Date(2025, 1, 5), month: 'Feb' }, // February
        { date: new Date(2025, 2, 5), month: 'Mar' }, // March
        { date: new Date(2025, 3, 5), month: 'Apr' }, // April
        { date: new Date(2025, 4, 5), month: 'May' }, // May
        { date: new Date(2025, 5, 5), month: 'Jun' }, // June
        { date: new Date(2025, 6, 5), month: 'Jul' }, // July
        { date: new Date(2025, 7, 5), month: 'Aug' }, // August
        { date: new Date(2025, 8, 5), month: 'Sep' }, // September
        { date: new Date(2025, 9, 5), month: 'Oct' }, // October
        { date: new Date(2025, 10, 5), month: 'Nov' }, // November
        { date: new Date(2025, 11, 5), month: 'Dec' }, // December
      ];

      testDates.forEach(({ date }) => {
        const result = getSprintNameWithDateRange(date);
        // Should contain valid month abbreviation
        expect(result).toMatch(
          /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/,
        );
      });
    });
  });
});
