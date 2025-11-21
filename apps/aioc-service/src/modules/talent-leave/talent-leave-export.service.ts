import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type {
  ExportTalentLeaveDto,
  ExportTalentLeaveResponseDto,
} from './interfaces/talent-leave-export.dto';
import type { TalentLeaveResponseDto } from './interfaces/talent-leave.dto';
import { TalentLeaveRepository } from './repositories/talent-leave.repository';
import { GoogleSheetsClient } from './clients/google-sheets.client';
import {
  generateDateColumns,
  groupByTeam,
  calculateSprintGroups,
} from './utils/calendar-data-transformer';
import { formatDateDDMMYYYY } from './utils/date-utilities';

@Injectable()
export class TalentLeaveExportService {
  constructor(
    private readonly talentLeaveRepository: TalentLeaveRepository,
    private readonly googleSheetsClient: GoogleSheetsClient,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Export talent leave data to Google Spreadsheet
   * @param dto - Export request DTO
   * @returns Export response DTO with success confirmation
   */
  async exportToSpreadsheet(
    dto: ExportTalentLeaveDto,
  ): Promise<ExportTalentLeaveResponseDto> {
    // Validate date range
    this.validateDateRange(dto.startDate, dto.endDate);

    try {
      // Fetch leave data from Firestore
      const leaveRecords = await this.fetchLeaveData(
        dto.startDate,
        dto.endDate,
      );

      // Fetch holidays from api-harilibur.vercel.app
      const holidays = await this.fetchHolidays(dto.startDate, dto.endDate);

      // Extract holiday dates for day count calculation
      const holidayDates = holidays.map((h) => h.date);

      // Generate date columns with holiday information
      const dateColumns = generateDateColumns(
        dto.startDate,
        dto.endDate,
        holidays,
      );

      // Group leave records by team
      const teamGroups = groupByTeam(
        leaveRecords,
        holidayDates,
        dto.startDate,
        dto.endDate,
      );

      // Calculate sprint groupings
      const sprintGroups = calculateSprintGroups(dateColumns);

      // Format spreadsheet title
      const title = this.formatSpreadsheetTitle(dto.startDate, dto.endDate);

      // Create spreadsheet
      const { spreadsheetUrl } =
        await this.googleSheetsClient.createSpreadsheet(
          title,
          teamGroups,
          dateColumns,
          sprintGroups,
          dto.accessToken,
        );

      // Return success response
      return {
        success: true,
        message: `Spreadsheet created successfully`,
        spreadsheetTitle: title,
        spreadsheetUrl,
        dateRange: {
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to export talent leave: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Validate date range meets requirements
   */
  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if endDate >= startDate
    if (end < start) {
      throw new BadRequestException('endDate must be >= startDate');
    }

    // Check if range <= 90 days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 90) {
      throw new BadRequestException('Date range must not exceed 90 days');
    }
  }

  /**
   * Fetch leave data from Firestore repository
   */
  private async fetchLeaveData(
    startDate: string,
    endDate: string,
  ): Promise<TalentLeaveResponseDto[]> {
    try {
      const entities = await this.talentLeaveRepository.findAll({
        startDate,
        endDate,
      });
      return entities.map((entity) => this.entityToDto(entity));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch leave data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Convert TalentLeaveEntity (Date objects) to TalentLeaveResponseDto (ISO strings)
   */
  private entityToDto(entity: any): TalentLeaveResponseDto {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: entity.id || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      name: entity.name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      team: entity.team,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      role: entity.role,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      leaveDate: entity.leaveDate.map((leave: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        dateFrom:
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          leave.dateFrom instanceof Date
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              leave.dateFrom.toISOString()
            : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              leave.dateFrom,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        dateTo:
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          leave.dateTo instanceof Date
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              leave.dateTo.toISOString()
            : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              leave.dateTo,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        status: leave.status,
      })),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      createdAt:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        entity.createdAt instanceof Date
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            entity.createdAt.toISOString()
          : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            entity.createdAt,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updatedAt:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        entity.updatedAt instanceof Date
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            entity.updatedAt.toISOString()
          : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            entity.updatedAt,
    };
  }

  /**
   * Fetch Indonesian holidays from api-harilibur.vercel.app
   * Gracefully handles API failures by returning empty array
   */
  private async fetchHolidays(
    startDate: string,
    endDate: string,
  ): Promise<Array<{ date: string; name: string; isNational: boolean }>> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get unique months in the date range
      const months = this.getMonthsInRange(start, end);

      // Fetch holidays for each month
      const holidayPromises = months.map((month) =>
        this.fetchHolidaysForMonth(month.year, month.month),
      );

      const holidayArrays = await Promise.all(holidayPromises);

      // Flatten and filter to date range
      const allHolidays = holidayArrays.flat();

      return allHolidays.filter((holiday) => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= start && holidayDate <= end;
      });
    } catch (error) {
      // Graceful degradation: continue without holidays if API fails
      console.warn(
        'Failed to fetch holidays, continuing without holiday data:',
        error,
      );
      return [];
    }
  }

  /**
   * Fetch holidays for a specific month from api-harilibur.vercel.app
   */
  private async fetchHolidaysForMonth(
    year: number,
    month: number,
  ): Promise<Array<{ date: string; name: string; isNational: boolean }>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api-harilibur.vercel.app/api?year=${year}&month=${month}`,
        ),
      );

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data.map((holiday: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        date: holiday.holiday_date,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        name: holiday.holiday_name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        isNational: holiday.is_national_holiday || false,
      }));
    } catch (error) {
      console.warn(`Failed to fetch holidays for ${year}-${month}:`, error);
      return [];
    }
  }

  /**
   * Get unique months in date range
   */
  private getMonthsInRange(
    start: Date,
    end: Date,
  ): Array<{ year: number; month: number }> {
    const months: Array<{ year: number; month: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1, // API expects 1-12
      });

      // Move to next month
      current.setMonth(current.getMonth() + 1);
      current.setDate(1); // Reset to first day to avoid date overflow
    }

    // Remove duplicates
    const unique = Array.from(
      new Map(months.map((m) => [`${m.year}-${m.month}`, m])).values(),
    );

    return unique;
  }

  /**
   * Format spreadsheet title with date range
   */
  private formatSpreadsheetTitle(startDate: string, endDate: string): string {
    const formattedStart = formatDateDDMMYYYY(startDate);
    const formattedEnd = formatDateDDMMYYYY(endDate);
    return `Talent Leave - ${formattedStart} to ${formattedEnd}`;
  }
}
