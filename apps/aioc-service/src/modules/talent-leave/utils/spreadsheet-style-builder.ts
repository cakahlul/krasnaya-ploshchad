import type { CalendarCell } from '../interfaces/talent-leave-export.dto';

/**
 * Color constants matching design document specifications
 * All colors are in hex format and converted to RGB for Google Sheets API
 */
export const COLORS = {
  // Headers
  headerBg: '#EEF2FF',
  headerText: '#374151',

  // Dates
  redBg: '#FEE2E2',
  redText: '#B91C1C',
  slateBg: '#F1F5F9',
  whiteBg: '#FFFFFF',

  // Team rows
  teamBg: '#DBEAFE',
  teamText: '#312E81',

  // Sprint cells
  sprintBg: '#8B5CF6',
  sprintText: '#FFFFFF',

  // Leave cells - confirmed
  confirmedBg: '#A7F3D0',
  confirmedBorder: '#059669',
  confirmedCheck: '#059669',

  // Leave cells - draft
  draftBg: '#FEF3C7',
  draftBorder: '#D97706',
  draftCheck: '#D97706',

  // Member info
  nameText: '#312E81',
  countGreen: '#52C41A',
  countGray: '#D9D9D9',
  grayText: '#4B5563',
};

/**
 * Convert hex color to RGB object for Google Sheets API
 * @param hex - Hex color string (e.g., "#FFFFFF")
 * @returns RGB object with red, green, blue values (0-1 range)
 */
export function hexToRgb(hex: string): {
  red: number;
  green: number;
  blue: number;
} {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    red: parseInt(result[1], 16) / 255,
    green: parseInt(result[2], 16) / 255,
    blue: parseInt(result[3], 16) / 255,
  };
}

/**
 * Build header row format for static columns and date columns
 * @param dateColumns - Array of CalendarCell objects for date columns
 * @returns Array of CellFormat objects for Google Sheets API
 */
export function buildHeaderFormat(dateColumns: CalendarCell[]): any[] {
  const formats: any[] = [];

  // Static columns (No, Nama, Jumlah, Tanggal Cuti)
  for (let i = 0; i < 4; i++) {
    formats.push({
      backgroundColor: hexToRgb(COLORS.headerBg),
      textFormat: {
        foregroundColor: hexToRgb(COLORS.headerText),
        fontSize: 11,
        bold: true,
      },
      horizontalAlignment: 'CENTER',
      verticalAlignment: 'MIDDLE',
    });
  }

  // Date columns with conditional styling
  dateColumns.forEach((cell) => {
    let bgColor = COLORS.whiteBg;
    let textColor = COLORS.headerText;

    if (cell.isNationalHoliday) {
      bgColor = COLORS.redBg;
      textColor = COLORS.redText;
    } else if (cell.isWeekend) {
      bgColor = COLORS.slateBg;
    }

    formats.push({
      backgroundColor: hexToRgb(bgColor),
      textFormat: {
        foregroundColor: hexToRgb(textColor),
        fontSize: 10,
        bold: false,
      },
      horizontalAlignment: 'CENTER',
      verticalAlignment: 'MIDDLE',
    });
  });

  return formats;
}

/**
 * Build team header row format with merge cells request
 * @param rowIndex - Row index (0-based)
 * @param teamName - Team name
 * @param memberCount - Number of team members
 * @returns Object with format and merge request
 */
export function buildTeamHeaderFormat(
  rowIndex: number,
  teamName: string,
  memberCount: number,
) {
  return {
    format: {
      backgroundColor: hexToRgb(COLORS.teamBg),
      textFormat: {
        foregroundColor: hexToRgb(COLORS.teamText),
        fontSize: 12,
        bold: true,
      },
      horizontalAlignment: 'LEFT',
      verticalAlignment: 'MIDDLE',
    },
    mergeRequest: {
      mergeCells: {
        range: {
          sheetId: 0,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: 1, // Column B (Nama)
          endColumnIndex: 4, // Up to column D (before dates)
        },
        mergeType: 'MERGE_ALL',
      },
    },
    value: `${teamName} ● ${memberCount}`,
  };
}

/**
 * Build sprint cell format with merge cells request
 * @param rowIndex - Row index (0-based)
 * @param sprintName - Sprint name with date range
 * @param startColumnIndex - Start column index (0-based)
 * @param dateCount - Number of dates in sprint
 * @returns Object with format and merge request
 */
export function buildSprintCellFormat(
  rowIndex: number,
  sprintName: string,
  startColumnIndex: number,
  dateCount: number,
) {
  return {
    format: {
      backgroundColor: hexToRgb(COLORS.sprintBg),
      textFormat: {
        foregroundColor: hexToRgb(COLORS.sprintText),
        fontSize: 10,
        bold: true,
      },
      horizontalAlignment: 'CENTER',
      verticalAlignment: 'MIDDLE',
    },
    mergeRequest: {
      mergeCells: {
        range: {
          sheetId: 0,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex,
          endColumnIndex: startColumnIndex + dateCount,
        },
        mergeType: 'MERGE_ALL',
      },
    },
    value: sprintName,
  };
}

/**
 * Build member row cell format
 * @param columnType - Type of column ('no' | 'name' | 'count' | 'dateRange' | 'date')
 * @param value - Optional value for dynamic formatting (e.g., leaveCount for 'count' type)
 * @returns CellFormat object for Google Sheets API
 */
export function buildMemberCellFormat(columnType: string, value?: any): any {
  const baseFormat: any = {
    backgroundColor: hexToRgb(COLORS.whiteBg),
    verticalAlignment: 'MIDDLE',
  };

  switch (columnType) {
    case 'no':
      return {
        ...baseFormat,
        textFormat: {
          foregroundColor: hexToRgb(COLORS.grayText),
          fontSize: 10,
        },
        horizontalAlignment: 'CENTER',
      };
    case 'name':
      return {
        ...baseFormat,
        textFormat: {
          foregroundColor: hexToRgb(COLORS.nameText),
          fontSize: 11,
          bold: true,
        },
        horizontalAlignment: 'LEFT',
      };
    case 'count': {
      const leaveCount = typeof value === 'number' ? value : 0;
      const color = leaveCount > 0 ? COLORS.countGreen : COLORS.countGray;
      return {
        ...baseFormat,
        textFormat: {
          foregroundColor: hexToRgb(color),
          fontSize: 11,
          bold: true,
        },
        horizontalAlignment: 'CENTER',
      };
    }
    case 'dateRange':
      return {
        ...baseFormat,
        textFormat: {
          foregroundColor: hexToRgb(COLORS.grayText),
          fontSize: 10,
        },
        horizontalAlignment: 'LEFT',
      };
    case 'date':
      return {
        ...baseFormat,
        textFormat: {
          foregroundColor: hexToRgb(COLORS.grayText),
          fontSize: 10,
        },
        horizontalAlignment: 'CENTER',
      };
    default:
      return baseFormat;
  }
}

/**
 * Build leave date cell format based on status and date properties
 * @param cell - CalendarCell object
 * @param isLeaveDate - Whether this date is a leave date
 * @param status - Leave status ('Draft' | 'Confirmed')
 * @returns CellFormat object for Google Sheets API
 */
export function buildLeaveDateCellFormat(
  cell: CalendarCell,
  isLeaveDate: boolean,
  status?: 'Draft' | 'Confirmed',
): any {
  // Priority: national holiday > weekend > leave (by status)
  if (cell.isNationalHoliday) {
    return {
      backgroundColor: hexToRgb(COLORS.redBg),
      textFormat: {
        foregroundColor: hexToRgb(COLORS.redText),
        fontSize: 10,
      },
      horizontalAlignment: 'CENTER',
      verticalAlignment: 'MIDDLE',
    };
  }

  if (cell.isWeekend) {
    return {
      backgroundColor: hexToRgb(COLORS.slateBg),
      textFormat: {
        foregroundColor: hexToRgb(COLORS.grayText),
        fontSize: 10,
      },
      horizontalAlignment: 'CENTER',
      verticalAlignment: 'MIDDLE',
    };
  }

  if (isLeaveDate) {
    const bgColor = status === 'Draft' ? COLORS.draftBg : COLORS.confirmedBg;
    const borderColor =
      status === 'Draft' ? COLORS.draftBorder : COLORS.confirmedBorder;
    const checkColor =
      status === 'Draft' ? COLORS.draftCheck : COLORS.confirmedCheck;

    return {
      backgroundColor: hexToRgb(bgColor),
      textFormat: {
        foregroundColor: hexToRgb(checkColor),
        fontSize: 10,
        bold: true,
      },
      horizontalAlignment: 'CENTER',
      verticalAlignment: 'MIDDLE',
      borders: {
        left: {
          style: 'SOLID',
          width: 3,
          color: hexToRgb(borderColor),
        },
      },
    };
  }

  // Default white background
  return {
    backgroundColor: hexToRgb(COLORS.whiteBg),
    textFormat: {
      foregroundColor: hexToRgb(COLORS.grayText),
      fontSize: 10,
    },
    horizontalAlignment: 'CENTER',
    verticalAlignment: 'MIDDLE',
  };
}

/**
 * Build freeze panes request
 * @returns UpdateSheetPropertiesRequest for Google Sheets API
 */
export function buildFreezeRequest() {
  return {
    updateSheetProperties: {
      properties: {
        sheetId: 0,
        gridProperties: {
          frozenRowCount: 1, // Freeze header row
          frozenColumnCount: 4, // Freeze No, Nama, Jumlah, Tanggal Cuti
        },
      },
      fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
    },
  };
}

/**
 * Build column width request
 * @param columnIndex - Column index (0-based)
 * @param width - Width in pixels
 * @returns UpdateDimensionPropertiesRequest for Google Sheets API
 */
export function buildColumnWidthRequest(columnIndex: number, width: number) {
  return {
    updateDimensionProperties: {
      range: {
        sheetId: 0,
        dimension: 'COLUMNS',
        startIndex: columnIndex,
        endIndex: columnIndex + 1,
      },
      properties: {
        pixelSize: width,
      },
      fields: 'pixelSize',
    },
  };
}

/**
 * Build row height request
 * @param rowIndex - Row index (0-based)
 * @param height - Height in pixels
 * @returns UpdateDimensionPropertiesRequest for Google Sheets API
 */
export function buildRowHeightRequest(rowIndex: number, height: number) {
  return {
    updateDimensionProperties: {
      range: {
        sheetId: 0,
        dimension: 'ROWS',
        startIndex: rowIndex,
        endIndex: rowIndex + 1,
      },
      properties: {
        pixelSize: height,
      },
      fields: 'pixelSize',
    },
  };
}
