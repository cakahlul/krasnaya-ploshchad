import {
  generateDateRange,
  calculateDayCount,
  formatDateRange,
  formatDateDDMMYYYY,
  isWeekend,
} from './date-utilities';

describe('DateUtilities', () => {
  describe('generateDateRange', () => {
    it('should create correct date array for single month', () => {
      const result = generateDateRange('2025-01-01', '2025-01-31');

      expect(result).toHaveLength(31);
      expect(result[0].date).toBe('2025-01-01');
      expect(result[30].date).toBe('2025-01-31');
    });

    it('should handle month boundaries correctly', () => {
      const result = generateDateRange('2025-01-30', '2025-02-02');

      expect(result).toHaveLength(4);
      expect(result[0].date).toBe('2025-01-30');
      expect(result[1].date).toBe('2025-01-31');
      expect(result[2].date).toBe('2025-02-01');
      expect(result[3].date).toBe('2025-02-02');
    });

    it('should handle leap years correctly', () => {
      const result = generateDateRange('2024-02-28', '2024-03-01');

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2024-02-28');
      expect(result[1].date).toBe('2024-02-29'); // Leap year
      expect(result[2].date).toBe('2024-03-01');
    });

    it('should include all dates from startDate to endDate', () => {
      const result = generateDateRange('2025-01-15', '2025-01-20');

      expect(result).toHaveLength(6);
      expect(result.map((cell) => cell.date)).toEqual([
        '2025-01-15',
        '2025-01-16',
        '2025-01-17',
        '2025-01-18',
        '2025-01-19',
        '2025-01-20',
      ]);
    });

    it('should mark weekends correctly', () => {
      // 2025-01-04 is Saturday, 2025-01-05 is Sunday
      const result = generateDateRange('2025-01-04', '2025-01-06');

      expect(result[0].isWeekend).toBe(true); // Saturday
      expect(result[1].isWeekend).toBe(true); // Sunday
      expect(result[2].isWeekend).toBe(false); // Monday
    });

    it('should include day name and day number', () => {
      // 2025-01-01 is Wednesday
      const result = generateDateRange('2025-01-01', '2025-01-01');

      expect(result[0].dayName).toBe('Wed');
      expect(result[0].dayNumber).toBe(1);
    });

    it('should initialize holiday properties to false/undefined', () => {
      const result = generateDateRange('2025-01-01', '2025-01-01');

      expect(result[0].isHoliday).toBe(false);
      expect(result[0].isNationalHoliday).toBe(false);
      expect(result[0].holidayName).toBeUndefined();
    });
  });

  describe('calculateDayCount', () => {
    it('should count days excluding weekends', () => {
      // 2025-01-06 (Mon) to 2025-01-10 (Fri) = 5 days
      const result = calculateDayCount('2025-01-06', '2025-01-10');
      expect(result).toBe(5);
    });

    it('should count days excluding holidays', () => {
      // 2025-01-06 (Mon) to 2025-01-10 (Fri) = 5 days
      // Excluding 2025-01-08 (holiday) = 4 days
      const holidays = ['2025-01-08'];
      const result = calculateDayCount('2025-01-06', '2025-01-10', holidays);
      expect(result).toBe(4);
    });

    it('should count days excluding both weekends and holidays', () => {
      // 2025-01-06 (Mon) to 2025-01-12 (Sun) = Mon-Fri (5 days) + Sat-Sun (0 days)
      // Excluding 2025-01-08 (Wed, holiday) = 4 days
      const holidays = ['2025-01-08'];
      const result = calculateDayCount('2025-01-06', '2025-01-12', holidays);
      expect(result).toBe(4);
    });

    it('should handle single day correctly', () => {
      // Single weekday
      const result1 = calculateDayCount('2025-01-06', '2025-01-06'); // Monday
      expect(result1).toBe(1);

      // Single weekend day
      const result2 = calculateDayCount('2025-01-04', '2025-01-04'); // Saturday
      expect(result2).toBe(0);

      // Single holiday
      const result3 = calculateDayCount('2025-01-06', '2025-01-06', [
        '2025-01-06',
      ]);
      expect(result3).toBe(0);
    });

    it('should handle ISO 8601 date format', () => {
      const result = calculateDayCount(
        '2025-01-06T00:00:00.000Z',
        '2025-01-10T23:59:59.999Z',
      );
      expect(result).toBe(5);
    });

    it('should return 0 when all days are weekends or holidays', () => {
      // 2025-01-04 (Sat) to 2025-01-05 (Sun)
      const result = calculateDayCount('2025-01-04', '2025-01-05');
      expect(result).toBe(0);
    });
  });

  describe('isWeekend', () => {
    it('should identify Saturdays correctly', () => {
      expect(isWeekend('2025-01-04')).toBe(true); // Saturday
    });

    it('should identify Sundays correctly', () => {
      expect(isWeekend('2025-01-05')).toBe(true); // Sunday
    });

    it('should return false for weekdays', () => {
      expect(isWeekend('2025-01-06')).toBe(false); // Monday
      expect(isWeekend('2025-01-07')).toBe(false); // Tuesday
      expect(isWeekend('2025-01-08')).toBe(false); // Wednesday
      expect(isWeekend('2025-01-09')).toBe(false); // Thursday
      expect(isWeekend('2025-01-10')).toBe(false); // Friday
    });
  });

  describe('formatDateRange', () => {
    it('should format single day as "DD MMM"', () => {
      const result = formatDateRange('2025-01-15', '2025-01-15');
      expect(result).toBe('15 Jan');
    });

    it('should format multi-day range in same month as "DD-DD MMM"', () => {
      const result = formatDateRange('2025-01-13', '2025-01-15');
      expect(result).toBe('13-15 Jan');
    });

    it('should format cross-month range as "DD MMM - DD MMM"', () => {
      const result = formatDateRange('2025-01-30', '2025-02-02');
      expect(result).toBe('30 Jan - 2 Feb');
    });

    it('should handle ISO 8601 date format', () => {
      const result = formatDateRange(
        '2025-01-13T00:00:00.000Z',
        '2025-01-15T23:59:59.999Z',
      );
      expect(result).toBe('13-15 Jan');
    });

    it('should handle all month names correctly', () => {
      expect(formatDateRange('2025-01-15', '2025-01-15')).toBe('15 Jan');
      expect(formatDateRange('2025-02-15', '2025-02-15')).toBe('15 Feb');
      expect(formatDateRange('2025-03-15', '2025-03-15')).toBe('15 Mar');
      expect(formatDateRange('2025-04-15', '2025-04-15')).toBe('15 Apr');
      expect(formatDateRange('2025-05-15', '2025-05-15')).toBe('15 May');
      expect(formatDateRange('2025-06-15', '2025-06-15')).toBe('15 Jun');
      expect(formatDateRange('2025-07-15', '2025-07-15')).toBe('15 Jul');
      expect(formatDateRange('2025-08-15', '2025-08-15')).toBe('15 Aug');
      expect(formatDateRange('2025-09-15', '2025-09-15')).toBe('15 Sep');
      expect(formatDateRange('2025-10-15', '2025-10-15')).toBe('15 Oct');
      expect(formatDateRange('2025-11-15', '2025-11-15')).toBe('15 Nov');
      expect(formatDateRange('2025-12-15', '2025-12-15')).toBe('15 Dec');
    });
  });

  describe('formatDateDDMMYYYY', () => {
    it('should format date as "DD/MM/YYYY"', () => {
      expect(formatDateDDMMYYYY('2025-01-15')).toBe('15/01/2025');
      expect(formatDateDDMMYYYY('2025-12-31')).toBe('31/12/2025');
    });

    it('should pad single digit days and months with zero', () => {
      expect(formatDateDDMMYYYY('2025-01-05')).toBe('05/01/2025');
      expect(formatDateDDMMYYYY('2025-09-09')).toBe('09/09/2025');
    });

    it('should handle ISO 8601 date format', () => {
      expect(formatDateDDMMYYYY('2025-01-15T00:00:00.000Z')).toBe('15/01/2025');
    });
  });
});
