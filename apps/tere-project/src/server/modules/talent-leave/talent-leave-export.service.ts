import { talentLeaveRepository } from './talent-leave.repository';
import { talentLeaveService } from './talent-leave.service';
import { googleSheetsClient } from './clients/google-sheets.client';
import { generateDateColumns, groupByTeam, calculateSprintGroups } from './utils/calendar-data-transformer';
import { formatDateDDMMYYYY } from './utils/date-utilities';
import { holidaysService } from '@server/modules/holidays/holidays.service';

export interface ExportTalentLeaveDto {
  startDate: string;
  endDate: string;
  accessToken: string;
}

export interface ExportTalentLeaveResponseDto {
  success: boolean;
  message: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  dateRange: { startDate: string; endDate: string };
  exportedAt: string;
}

class TalentLeaveExportService {
  async exportToSpreadsheet(dto: ExportTalentLeaveDto): Promise<ExportTalentLeaveResponseDto> {
    this.validateDateRange(dto.startDate, dto.endDate);

    const leaveRecords = await talentLeaveService.findAll({ startDate: dto.startDate, endDate: dto.endDate });
    const holidays = await this.fetchHolidays(dto.startDate, dto.endDate);
    const holidayDates = holidays.map((h) => h.date);
    const dateColumns = generateDateColumns(dto.startDate, dto.endDate, holidays);
    const teamGroups = groupByTeam(leaveRecords, holidayDates, dto.startDate, dto.endDate);
    const sprintGroups = calculateSprintGroups(dateColumns);
    const title = this.formatSpreadsheetTitle(dto.startDate, dto.endDate);

    const { spreadsheetUrl } = await googleSheetsClient.createSpreadsheet(title, teamGroups, dateColumns, sprintGroups, dto.accessToken);

    return {
      success: true,
      message: 'Spreadsheet created successfully',
      spreadsheetTitle: title,
      spreadsheetUrl,
      dateRange: { startDate: dto.startDate, endDate: dto.endDate },
      exportedAt: new Date().toISOString(),
    };
  }

  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) throw new Error('endDate must be >= startDate');
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 90) throw new Error('Date range must not exceed 90 days');
  }

  private async fetchHolidays(startDate: string, endDate: string): Promise<Array<{ date: string; name: string; isNational: boolean }>> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();
      const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
      const holidayArrays = await Promise.all(years.map((year) => holidaysService.getHolidaysByYear(year)));
      const allHolidays = holidayArrays.flat();
      return allHolidays
        .filter((h) => { const d = new Date(h.holiday_date); return d >= start && d <= end; })
        .map((h) => ({ date: h.holiday_date, name: h.holiday_name, isNational: h.is_national_holiday }));
    } catch {
      return [];
    }
  }

  private formatSpreadsheetTitle(startDate: string, endDate: string): string {
    return `Talent Leave - ${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}`;
  }
}

export const talentLeaveExportService = new TalentLeaveExportService();
