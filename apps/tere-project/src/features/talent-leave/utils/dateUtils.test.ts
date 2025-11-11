import {
  generateDateRange,
  isDateInLeaveRange,
  calculateDayCount,
  formatDateRange,
  getIndonesianDayName,
  disablePastDates,
  disableBeforeDate,
} from './dateUtils';
import dayjs from 'dayjs';

describe('dateUtils', () => {
  describe('generateDateRange', () => {
    it('should produce correct number of dates for 2-month span', () => {
      const startMonth = new Date(2024, 0, 1); // January 1, 2024
      const result = generateDateRange(startMonth);

      // January has 31 days, February 2024 has 29 days (leap year)
      expect(result).toHaveLength(31 + 29);
    });

    it('should correctly mark weekends (Saturday, Sunday)', () => {
      const startMonth = new Date(2024, 0, 1); // January 1, 2024 (Monday)
      const result = generateDateRange(startMonth);

      // First Saturday is January 6, 2024
      const firstSaturday = result.find(cell => cell.date === '2024-01-06');
      expect(firstSaturday?.isWeekend).toBe(true);

      // First Sunday is January 7, 2024
      const firstSunday = result.find(cell => cell.date === '2024-01-07');
      expect(firstSunday?.isWeekend).toBe(true);

      // Monday should not be weekend
      const monday = result.find(cell => cell.date === '2024-01-08');
      expect(monday?.isWeekend).toBe(false);
    });

    it('should handle month boundaries correctly', () => {
      const startMonth = new Date(2024, 0, 1); // January 1, 2024
      const result = generateDateRange(startMonth);

      // First date should be January 1
      expect(result[0].date).toBe('2024-01-01');

      // Last date should be February 29 (leap year)
      expect(result[result.length - 1].date).toBe('2024-02-29');

      // Check transition from January to February
      const lastJan = result.find(cell => cell.date === '2024-01-31');
      const firstFeb = result.find(cell => cell.date === '2024-02-01');
      expect(lastJan).toBeDefined();
      expect(firstFeb).toBeDefined();
    });

    it('should include Indonesian day names', () => {
      const startMonth = new Date(2024, 0, 1); // January 1, 2024 (Monday)
      const result = generateDateRange(startMonth);

      expect(result[0].dayName).toBe('Senin'); // Monday
    });

    it('should initialize isHoliday as false', () => {
      const startMonth = new Date(2024, 0, 1);
      const result = generateDateRange(startMonth);

      result.forEach(cell => {
        expect(cell.isHoliday).toBe(false);
      });
    });
  });

  describe('isDateInLeaveRange', () => {
    it('should correctly identify dates within range', () => {
      const dateFrom = '2024-01-15';
      const dateTo = '2024-01-20';

      expect(isDateInLeaveRange('2024-01-15', dateFrom, dateTo)).toBe(true);
      expect(isDateInLeaveRange('2024-01-17', dateFrom, dateTo)).toBe(true);
      expect(isDateInLeaveRange('2024-01-20', dateFrom, dateTo)).toBe(true);
    });

    it('should handle edge cases (same day, boundary dates)', () => {
      const dateFrom = '2024-01-15';
      const dateTo = '2024-01-15';

      // Same day should be in range
      expect(isDateInLeaveRange('2024-01-15', dateFrom, dateTo)).toBe(true);

      // Boundary dates
      expect(isDateInLeaveRange('2024-01-14', dateFrom, '2024-01-20')).toBe(false);
      expect(isDateInLeaveRange('2024-01-21', dateFrom, '2024-01-20')).toBe(false);
    });

    it('should return false for dates outside range', () => {
      const dateFrom = '2024-01-15';
      const dateTo = '2024-01-20';

      expect(isDateInLeaveRange('2024-01-14', dateFrom, dateTo)).toBe(false);
      expect(isDateInLeaveRange('2024-01-21', dateFrom, dateTo)).toBe(false);
      expect(isDateInLeaveRange('2024-02-01', dateFrom, dateTo)).toBe(false);
    });
  });

  describe('calculateDayCount', () => {
    it('should return accurate day count including start and end dates', () => {
      // Same day
      expect(calculateDayCount('2024-01-15', '2024-01-15')).toBe(1);

      // Two consecutive days
      expect(calculateDayCount('2024-01-15', '2024-01-16')).toBe(2);

      // One week
      expect(calculateDayCount('2024-01-15', '2024-01-21')).toBe(7);

      // Across month boundary
      expect(calculateDayCount('2024-01-30', '2024-02-02')).toBe(4);
    });

    it('should handle leap year correctly', () => {
      // February in leap year
      expect(calculateDayCount('2024-02-01', '2024-02-29')).toBe(29);

      // February in non-leap year
      expect(calculateDayCount('2023-02-01', '2023-02-28')).toBe(28);
    });
  });

  describe('formatDateRange', () => {
    it('should produce correct MM/DD/YYYY format', () => {
      expect(formatDateRange('2024-01-15', '2024-01-20')).toBe('01/15/2024 - 01/20/2024');
      expect(formatDateRange('2024-12-25', '2024-12-31')).toBe('12/25/2024 - 12/31/2024');
    });

    it('should handle single digit months and days', () => {
      expect(formatDateRange('2024-01-05', '2024-01-09')).toBe('01/05/2024 - 01/09/2024');
    });

    it('should handle date range across months', () => {
      expect(formatDateRange('2024-01-30', '2024-02-05')).toBe('01/30/2024 - 02/05/2024');
    });
  });

  describe('getIndonesianDayName', () => {
    it('should return correct day names for all 7 days', () => {
      // January 1, 2024 is Monday
      expect(getIndonesianDayName(new Date(2024, 0, 1))).toBe('Senin');

      // January 2, 2024 is Tuesday
      expect(getIndonesianDayName(new Date(2024, 0, 2))).toBe('Selasa');

      // January 3, 2024 is Wednesday
      expect(getIndonesianDayName(new Date(2024, 0, 3))).toBe('Rabu');

      // January 4, 2024 is Thursday
      expect(getIndonesianDayName(new Date(2024, 0, 4))).toBe('Kamis');

      // January 5, 2024 is Friday
      expect(getIndonesianDayName(new Date(2024, 0, 5))).toBe('Jumat');

      // January 6, 2024 is Saturday
      expect(getIndonesianDayName(new Date(2024, 0, 6))).toBe('Sabtu');

      // January 7, 2024 is Sunday
      expect(getIndonesianDayName(new Date(2024, 0, 7))).toBe('Minggu');
    });
  });

  describe('disablePastDates', () => {
    it('should correctly disable dates before today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(disablePastDates(dayjs(yesterday))).toBe(true);
      expect(disablePastDates(dayjs(today))).toBe(false);
      expect(disablePastDates(dayjs(tomorrow))).toBe(false);
    });
  });

  describe('disableBeforeDate', () => {
    it('should correctly disable dates before specified date', () => {
      const minDate = dayjs(new Date(2024, 0, 15)); // January 15, 2024

      const before = dayjs(new Date(2024, 0, 14));
      const same = dayjs(new Date(2024, 0, 15));
      const after = dayjs(new Date(2024, 0, 16));

      expect(disableBeforeDate(before, minDate)).toBe(true);
      expect(disableBeforeDate(same, minDate)).toBe(false);
      expect(disableBeforeDate(after, minDate)).toBe(false);
    });
  });
});
