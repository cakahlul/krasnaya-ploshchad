import {
  getSprintNumber,
  getSprintName,
  getSprintStartDate,
  getSprintEndDate,
  groupDatesBySprint,
  getSprintNameWithDateRange,
} from './sprintUtils';

describe('sprintUtils', () => {
  describe('getSprintNumber', () => {
    it('should return 0 for the reference sprint start date (Nov 10, 2025)', () => {
      const date = new Date('2025-11-10');
      expect(getSprintNumber(date)).toBe(0);
    });

    it('should return 1 for the next sprint (Nov 24, 2025)', () => {
      const date = new Date('2025-11-24');
      expect(getSprintNumber(date)).toBe(1);
    });

    it('should return -1 for the previous sprint (Oct 27, 2025)', () => {
      const date = new Date('2025-10-27');
      expect(getSprintNumber(date)).toBe(-1);
    });

    it('should handle dates within a sprint correctly', () => {
      // Nov 15, 2025 is in sprint 0 (Nov 10-23)
      const date = new Date('2025-11-15');
      expect(getSprintNumber(date)).toBe(0);
    });
  });

  describe('getSprintName', () => {
    it('should return "Sprint Eagle" for sprint 0', () => {
      const date = new Date('2025-11-10');
      expect(getSprintName(date)).toBe('Sprint Eagle');
    });

    it('should return "Sprint Falcon" for sprint 1', () => {
      const date = new Date('2025-11-24');
      expect(getSprintName(date)).toBe('Sprint Falcon');
    });

    it('should cycle through bird names', () => {
      const date = new Date('2025-11-10');
      const sprintName = getSprintName(date);
      expect(sprintName).toMatch(/^Sprint \w+$/);
    });
  });

  describe('getSprintStartDate', () => {
    it('should return Nov 10 for a date in sprint 0', () => {
      const date = new Date('2025-11-15');
      const startDate = getSprintStartDate(date);
      expect(startDate.toISOString().split('T')[0]).toBe('2025-11-10');
    });

    it('should return Nov 24 for a date in sprint 1', () => {
      const date = new Date('2025-11-30');
      const startDate = getSprintStartDate(date);
      expect(startDate.toISOString().split('T')[0]).toBe('2025-11-24');
    });
  });

  describe('getSprintEndDate', () => {
    it('should return Nov 23 for a date in sprint 0', () => {
      const date = new Date('2025-11-15');
      const endDate = getSprintEndDate(date);
      const endDateStr = endDate.toISOString().split('T')[0];
      expect(endDateStr).toBe('2025-11-23');
    });

    it('should return Dec 7 for a date in sprint 1', () => {
      const date = new Date('2025-11-30');
      const endDate = getSprintEndDate(date);
      const endDateStr = endDate.toISOString().split('T')[0];
      expect(endDateStr).toBe('2025-12-07');
    });
  });

  describe('groupDatesBySprint', () => {
    it('should group dates by sprint', () => {
      const dates = [
        '2025-11-10',
        '2025-11-15',
        '2025-11-24',
        '2025-11-30',
      ];
      const grouped = groupDatesBySprint(dates);
      expect(Object.keys(grouped).length).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const grouped = groupDatesBySprint([]);
      expect(grouped).toEqual({});
    });

    it('should group all dates from same sprint together', () => {
      const dates = [
        '2025-11-10',
        '2025-11-11',
        '2025-11-12',
      ];
      const grouped = groupDatesBySprint(dates);
      expect(Object.keys(grouped).length).toBe(1);
    });
  });

  describe('getSprintNameWithDateRange', () => {
    it('should return sprint name with date range in DD/MM/YYYY format', () => {
      const date = new Date('2025-11-15');
      const result = getSprintNameWithDateRange(date);
      expect(result).toMatch(/Sprint \w+ \(\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}\)/);
    });

    it('should include sprint name and dates for sprint 0', () => {
      const date = new Date('2025-11-10');
      const result = getSprintNameWithDateRange(date);
      expect(result).toContain('Sprint Eagle');
      expect(result).toContain('10/11/2025');
      expect(result).toContain('23/11/2025');
    });
  });
});
