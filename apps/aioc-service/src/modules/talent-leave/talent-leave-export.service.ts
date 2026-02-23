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

import { HolidaysService } from '../holidays/holidays.service';

@Injectable()
export class TalentLeaveExportService {
  constructor(
    private readonly talentLeaveRepository: TalentLeaveRepository,
    private readonly googleSheetsClient: GoogleSheetsClient,
    private readonly httpService: HttpService,
    private readonly holidaysService: HolidaysService,
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

      // Fetch holidays from internal HolidaysService
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
   * Fetch holidays from internal HolidaysService
   */
  private async fetchHolidays(
    startDate: string,
    endDate: string,
  ): Promise<Array<{ date: string; name: string; isNational: boolean }>> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      // Get all years in range
      const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
      
      const holidayPromises = years.map(year => this.holidaysService.getHolidaysByYear(year));
      const holidayArrays = await Promise.all(holidayPromises);
      
      const allHolidays = holidayArrays.flat();

      return allHolidays
        .filter((holiday) => {
          const holidayDate = new Date(holiday.holiday_date);
          return holidayDate >= start && holidayDate <= end;
        })
        .map(h => ({
          date: h.holiday_date,
          name: h.holiday_name,
          isNational: h.is_national_holiday
        }));
    } catch (error) {
      console.warn('Failed to fetch holidays, continuing without holiday data:', error);
      return [];
    }
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
