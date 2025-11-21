/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  COLORS,
  hexToRgb,
  buildHeaderFormat,
  buildTeamHeaderFormat,
  buildSprintCellFormat,
  buildMemberCellFormat,
  buildLeaveDateCellFormat,
  buildFreezeRequest,
  buildColumnWidthRequest,
  buildRowHeightRequest,
} from './spreadsheet-style-builder';
import type { CalendarCell } from '../interfaces/talent-leave-export.dto';

describe('SpreadsheetStyleBuilder', () => {
  describe('COLORS constant', () => {
    it('should match design document hex values', () => {
      expect(COLORS.headerBg).toBe('#EEF2FF');
      expect(COLORS.headerText).toBe('#374151');
      expect(COLORS.redBg).toBe('#FEE2E2');
      expect(COLORS.redText).toBe('#B91C1C');
      expect(COLORS.slateBg).toBe('#F1F5F9');
      expect(COLORS.whiteBg).toBe('#FFFFFF');
      expect(COLORS.teamBg).toBe('#DBEAFE');
      expect(COLORS.teamText).toBe('#312E81');
      expect(COLORS.sprintBg).toBe('#8B5CF6');
      expect(COLORS.sprintText).toBe('#FFFFFF');
      expect(COLORS.confirmedBg).toBe('#A7F3D0');
      expect(COLORS.confirmedBorder).toBe('#059669');
      expect(COLORS.draftBg).toBe('#FEF3C7');
      expect(COLORS.draftBorder).toBe('#D97706');
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex to RGB values in 0-1 range', () => {
      const white = hexToRgb('#FFFFFF');
      expect(white.red).toBe(1);
      expect(white.green).toBe(1);
      expect(white.blue).toBe(1);

      const black = hexToRgb('#000000');
      expect(black.red).toBe(0);
      expect(black.green).toBe(0);
      expect(black.blue).toBe(0);
    });

    it('should handle hex without # prefix', () => {
      const result = hexToRgb('FF0000');
      expect(result.red).toBe(1);
      expect(result.green).toBe(0);
      expect(result.blue).toBe(0);
    });

    it('should throw error for invalid hex', () => {
      expect(() => hexToRgb('invalid')).toThrow('Invalid hex color');
    });
  });

  describe('buildHeaderFormat', () => {
    it('should return correct format for static columns', () => {
      const dateColumns: CalendarCell[] = [];
      const formats = buildHeaderFormat(dateColumns);

      expect(formats).toHaveLength(4); // No, Nama, Jumlah, Tanggal Cuti
      formats.forEach((format) => {
        expect(format.backgroundColor).toEqual(hexToRgb(COLORS.headerBg));
        expect(format.textFormat.foregroundColor).toEqual(
          hexToRgb(COLORS.headerText),
        );
        expect(format.textFormat.fontSize).toBe(11);
        expect(format.textFormat.bold).toBe(true);
        expect(format.horizontalAlignment).toBe('CENTER');
        expect(format.verticalAlignment).toBe('MIDDLE');
      });
    });

    it('should return correct format for date columns with weekend styling', () => {
      const dateColumns: CalendarCell[] = [
        {
          date: '2025-01-11',
          dayName: 'Sat',
          dayNumber: 11,
          isWeekend: true,
          isHoliday: false,
          isNationalHoliday: false,
        },
      ];

      const formats = buildHeaderFormat(dateColumns);
      const weekendFormat = formats[4]; // First date column

      expect(weekendFormat.backgroundColor).toEqual(hexToRgb(COLORS.slateBg));
      expect(weekendFormat.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.headerText),
      );
    });

    it('should return correct format for date columns with national holiday styling', () => {
      const dateColumns: CalendarCell[] = [
        {
          date: '2025-01-01',
          dayName: 'Wed',
          dayNumber: 1,
          isWeekend: false,
          isHoliday: true,
          isNationalHoliday: true,
          holidayName: 'New Year',
        },
      ];

      const formats = buildHeaderFormat(dateColumns);
      const holidayFormat = formats[4]; // First date column

      expect(holidayFormat.backgroundColor).toEqual(hexToRgb(COLORS.redBg));
      expect(holidayFormat.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.redText),
      );
    });
  });

  describe('buildTeamHeaderFormat', () => {
    it('should create merge cell request', () => {
      const result = buildTeamHeaderFormat(1, 'Engineering', 5);

      expect(result.mergeRequest.mergeCells.range.sheetId).toBe(0);
      expect(result.mergeRequest.mergeCells.range.startRowIndex).toBe(1);
      expect(result.mergeRequest.mergeCells.range.endRowIndex).toBe(2);
      expect(result.mergeRequest.mergeCells.range.startColumnIndex).toBe(1);
      expect(result.mergeRequest.mergeCells.range.endColumnIndex).toBe(4);
      expect(result.mergeRequest.mergeCells.mergeType).toBe('MERGE_ALL');
    });

    it('should apply correct team row styling (blue gradient)', () => {
      const result = buildTeamHeaderFormat(1, 'Engineering', 5);

      expect(result.format.backgroundColor).toEqual(hexToRgb(COLORS.teamBg));
      expect(result.format.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.teamText),
      );
      expect(result.format.textFormat.fontSize).toBe(12);
      expect(result.format.textFormat.bold).toBe(true);
      expect(result.format.horizontalAlignment).toBe('LEFT');
    });

    it('should format value with team name and member count', () => {
      const result = buildTeamHeaderFormat(1, 'Engineering', 5);
      expect(result.value).toBe('Engineering ● 5');
    });
  });

  describe('buildSprintCellFormat', () => {
    it('should create merge cell request spanning sprint dates', () => {
      const result = buildSprintCellFormat(
        1,
        'Sprint 2 Q4 2025 (27 Oct - 07 Nov)',
        4,
        10,
      );

      expect(result.mergeRequest.mergeCells.range.sheetId).toBe(0);
      expect(result.mergeRequest.mergeCells.range.startRowIndex).toBe(1);
      expect(result.mergeRequest.mergeCells.range.endRowIndex).toBe(2);
      expect(result.mergeRequest.mergeCells.range.startColumnIndex).toBe(4);
      expect(result.mergeRequest.mergeCells.range.endColumnIndex).toBe(14); // 4 + 10
      expect(result.mergeRequest.mergeCells.mergeType).toBe('MERGE_ALL');
    });

    it('should apply correct sprint styling (purple gradient)', () => {
      const result = buildSprintCellFormat(
        1,
        'Sprint 2 Q4 2025 (27 Oct - 07 Nov)',
        4,
        10,
      );

      expect(result.format.backgroundColor).toEqual(hexToRgb(COLORS.sprintBg));
      expect(result.format.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.sprintText),
      );
      expect(result.format.textFormat.fontSize).toBe(10);
      expect(result.format.textFormat.bold).toBe(true);
      expect(result.format.horizontalAlignment).toBe('CENTER');
    });

    it('should include sprint name in value', () => {
      const result = buildSprintCellFormat(
        1,
        'Sprint 2 Q4 2025 (27 Oct - 07 Nov)',
        4,
        10,
      );
      expect(result.value).toBe('Sprint 2 Q4 2025 (27 Oct - 07 Nov)');
    });
  });

  describe('buildMemberCellFormat', () => {
    it('should apply correct styling per column type', () => {
      const noFormat = buildMemberCellFormat('no');
      expect(noFormat.horizontalAlignment).toBe('CENTER');
      expect(noFormat.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.grayText),
      );

      const nameFormat = buildMemberCellFormat('name');
      expect(nameFormat.horizontalAlignment).toBe('LEFT');
      expect(nameFormat.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.nameText),
      );
      expect(nameFormat.textFormat.bold).toBe(true);

      const countFormat = buildMemberCellFormat('count');
      expect(countFormat.horizontalAlignment).toBe('CENTER');
      expect(countFormat.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.countGreen),
      );
      expect(countFormat.textFormat.bold).toBe(true);

      const dateRangeFormat = buildMemberCellFormat('dateRange');
      expect(dateRangeFormat.horizontalAlignment).toBe('LEFT');

      const dateFormat = buildMemberCellFormat('date');
      expect(dateFormat.horizontalAlignment).toBe('CENTER');
    });
  });

  describe('buildLeaveDateCellFormat', () => {
    const mockCell: CalendarCell = {
      date: '2025-01-13',
      dayName: 'Mon',
      dayNumber: 13,
      isWeekend: false,
      isHoliday: false,
      isNationalHoliday: false,
    };

    it('should return emerald green for confirmed leave', () => {
      const format = buildLeaveDateCellFormat(mockCell, true, 'Confirmed');

      expect(format.backgroundColor).toEqual(hexToRgb(COLORS.confirmedBg));
      expect(format.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.confirmedCheck),
      );
      expect(format.textFormat.bold).toBe(true);
    });

    it('should return amber yellow for draft leave', () => {
      const format = buildLeaveDateCellFormat(mockCell, true, 'Draft');

      expect(format.backgroundColor).toEqual(hexToRgb(COLORS.draftBg));
      expect(format.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.draftCheck),
      );
    });

    it('should return red background for national holidays', () => {
      const holidayCell: CalendarCell = {
        ...mockCell,
        isHoliday: true,
        isNationalHoliday: true,
      };

      const format = buildLeaveDateCellFormat(holidayCell, false);

      expect(format.backgroundColor).toEqual(hexToRgb(COLORS.redBg));
      expect(format.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.redText),
      );
    });

    it('should return slate background for weekends', () => {
      const weekendCell: CalendarCell = {
        ...mockCell,
        isWeekend: true,
      };

      const format = buildLeaveDateCellFormat(weekendCell, false);

      expect(format.backgroundColor).toEqual(hexToRgb(COLORS.slateBg));
      expect(format.textFormat.foregroundColor).toEqual(
        hexToRgb(COLORS.grayText),
      );
    });

    it('should include left border for leave dates', () => {
      const confirmedFormat = buildLeaveDateCellFormat(
        mockCell,
        true,
        'Confirmed',
      );
      expect(confirmedFormat.borders.left.style).toBe('SOLID');
      expect(confirmedFormat.borders.left.width).toBe(3);
      expect(confirmedFormat.borders.left.color).toEqual(
        hexToRgb(COLORS.confirmedBorder),
      );

      const draftFormat = buildLeaveDateCellFormat(mockCell, true, 'Draft');
      expect(draftFormat.borders.left.color).toEqual(
        hexToRgb(COLORS.draftBorder),
      );
    });

    it('should return white background for non-leave dates', () => {
      const format = buildLeaveDateCellFormat(mockCell, false);

      expect(format.backgroundColor).toEqual(hexToRgb(COLORS.whiteBg));
    });
  });

  describe('buildFreezeRequest', () => {
    it('should create correct freeze panes request (1 row, 4 cols)', () => {
      const request = buildFreezeRequest();

      expect(request.updateSheetProperties.properties.sheetId).toBe(0);
      expect(
        request.updateSheetProperties.properties.gridProperties.frozenRowCount,
      ).toBe(1);
      expect(
        request.updateSheetProperties.properties.gridProperties
          .frozenColumnCount,
      ).toBe(4);
      expect(request.updateSheetProperties.fields).toBe(
        'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
      );
    });
  });

  describe('buildColumnWidthRequest', () => {
    it('should create correct column dimension request', () => {
      const request = buildColumnWidthRequest(0, 60);

      expect(request.updateDimensionProperties.range.sheetId).toBe(0);
      expect(request.updateDimensionProperties.range.dimension).toBe('COLUMNS');
      expect(request.updateDimensionProperties.range.startIndex).toBe(0);
      expect(request.updateDimensionProperties.range.endIndex).toBe(1);
      expect(request.updateDimensionProperties.properties.pixelSize).toBe(60);
      expect(request.updateDimensionProperties.fields).toBe('pixelSize');
    });
  });

  describe('buildRowHeightRequest', () => {
    it('should create correct row dimension request', () => {
      const request = buildRowHeightRequest(0, 80);

      expect(request.updateDimensionProperties.range.sheetId).toBe(0);
      expect(request.updateDimensionProperties.range.dimension).toBe('ROWS');
      expect(request.updateDimensionProperties.range.startIndex).toBe(0);
      expect(request.updateDimensionProperties.range.endIndex).toBe(1);
      expect(request.updateDimensionProperties.properties.pixelSize).toBe(80);
      expect(request.updateDimensionProperties.fields).toBe('pixelSize');
    });
  });
});
