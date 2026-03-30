import type { CalendarCell } from '@shared/types/talent-leave.types';

export const COLORS = {
  headerBg: '#EEF2FF', headerText: '#374151',
  redBg: '#FEE2E2', redText: '#B91C1C',
  slateBg: '#F1F5F9', whiteBg: '#FFFFFF',
  teamBg: '#DBEAFE', teamText: '#312E81',
  sprintBg: '#8B5CF6', sprintText: '#FFFFFF',
  confirmedBg: '#A7F3D0', confirmedBorder: '#059669', confirmedCheck: '#059669',
  draftBg: '#FEF3C7', draftBorder: '#D97706', draftCheck: '#D97706',
  nameText: '#312E81', countGreen: '#52C41A', countGray: '#D9D9D9', grayText: '#4B5563',
};

export function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return { red: parseInt(result[1], 16) / 255, green: parseInt(result[2], 16) / 255, blue: parseInt(result[3], 16) / 255 };
}

export function buildHeaderFormat(dateColumns: CalendarCell[]): any[] {
  const formats: any[] = [];
  for (let i = 0; i < 4; i++) {
    formats.push({ backgroundColor: hexToRgb(COLORS.headerBg), textFormat: { foregroundColor: hexToRgb(COLORS.headerText), fontSize: 11, bold: true }, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE' });
  }
  dateColumns.forEach((cell) => {
    let bgColor = COLORS.whiteBg;
    let textColor = COLORS.headerText;
    if (cell.isNationalHoliday) { bgColor = COLORS.redBg; textColor = COLORS.redText; }
    else if (cell.isWeekend) { bgColor = COLORS.slateBg; }
    formats.push({ backgroundColor: hexToRgb(bgColor), textFormat: { foregroundColor: hexToRgb(textColor), fontSize: 10, bold: false }, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE' });
  });
  return formats;
}

export function buildTeamHeaderFormat(rowIndex: number, teamName: string, memberCount: number) {
  return {
    format: { backgroundColor: hexToRgb(COLORS.teamBg), textFormat: { foregroundColor: hexToRgb(COLORS.teamText), fontSize: 12, bold: true }, horizontalAlignment: 'LEFT', verticalAlignment: 'MIDDLE' },
    mergeRequest: { mergeCells: { range: { sheetId: 0, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 1, endColumnIndex: 4 }, mergeType: 'MERGE_ALL' } },
    value: `${teamName} ● ${memberCount}`,
  };
}

export function buildSprintCellFormat(rowIndex: number, sprintName: string, startColumnIndex: number, dateCount: number) {
  return {
    format: { backgroundColor: hexToRgb(COLORS.sprintBg), textFormat: { foregroundColor: hexToRgb(COLORS.sprintText), fontSize: 10, bold: true }, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE' },
    mergeRequest: { mergeCells: { range: { sheetId: 0, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex, endColumnIndex: startColumnIndex + dateCount }, mergeType: 'MERGE_ALL' } },
    value: sprintName,
  };
}

export function buildMemberCellFormat(columnType: string, value?: any): any {
  const baseFormat: any = { backgroundColor: hexToRgb(COLORS.whiteBg), verticalAlignment: 'MIDDLE' };
  switch (columnType) {
    case 'no': return { ...baseFormat, textFormat: { foregroundColor: hexToRgb(COLORS.grayText), fontSize: 10 }, horizontalAlignment: 'CENTER' };
    case 'name': return { ...baseFormat, textFormat: { foregroundColor: hexToRgb(COLORS.nameText), fontSize: 11, bold: true }, horizontalAlignment: 'LEFT' };
    case 'count': {
      const leaveCount = typeof value === 'number' ? value : 0;
      const color = leaveCount > 0 ? COLORS.countGreen : COLORS.countGray;
      return { ...baseFormat, textFormat: { foregroundColor: hexToRgb(color), fontSize: 11, bold: true }, horizontalAlignment: 'CENTER' };
    }
    case 'dateRange': return { ...baseFormat, textFormat: { foregroundColor: hexToRgb(COLORS.grayText), fontSize: 10 }, horizontalAlignment: 'LEFT' };
    default: return { ...baseFormat, textFormat: { foregroundColor: hexToRgb(COLORS.grayText), fontSize: 10 }, horizontalAlignment: 'CENTER' };
  }
}

export function buildLeaveDateCellFormat(cell: CalendarCell, isLeaveDate: boolean, status?: 'Draft' | 'Confirmed'): any {
  if (cell.isNationalHoliday) return { backgroundColor: hexToRgb(COLORS.redBg), textFormat: { foregroundColor: hexToRgb(COLORS.redText), fontSize: 10 }, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE' };
  if (cell.isWeekend) return { backgroundColor: hexToRgb(COLORS.slateBg), textFormat: { foregroundColor: hexToRgb(COLORS.grayText), fontSize: 10 }, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE' };
  if (isLeaveDate) {
    const bgColor = status === 'Draft' ? COLORS.draftBg : COLORS.confirmedBg;
    const borderColor = status === 'Draft' ? COLORS.draftBorder : COLORS.confirmedBorder;
    const checkColor = status === 'Draft' ? COLORS.draftCheck : COLORS.confirmedCheck;
    return { backgroundColor: hexToRgb(bgColor), textFormat: { foregroundColor: hexToRgb(checkColor), fontSize: 10, bold: true }, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', borders: { left: { style: 'SOLID', width: 3, color: hexToRgb(borderColor) } } };
  }
  return { backgroundColor: hexToRgb(COLORS.whiteBg), textFormat: { foregroundColor: hexToRgb(COLORS.grayText), fontSize: 10 }, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE' };
}

export function buildFreezeRequest() {
  return { updateSheetProperties: { properties: { sheetId: 0, gridProperties: { frozenRowCount: 1, frozenColumnCount: 4 } }, fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount' } };
}

export function buildColumnWidthRequest(columnIndex: number, width: number) {
  return { updateDimensionProperties: { range: { sheetId: 0, dimension: 'COLUMNS', startIndex: columnIndex, endIndex: columnIndex + 1 }, properties: { pixelSize: width }, fields: 'pixelSize' } };
}

export function buildRowHeightRequest(rowIndex: number, height: number) {
  return { updateDimensionProperties: { range: { sheetId: 0, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 }, properties: { pixelSize: height }, fields: 'pixelSize' } };
}
