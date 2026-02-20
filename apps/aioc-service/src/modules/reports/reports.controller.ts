import { Controller, Get, Post, Query, Body, BadRequestException, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ProductivitySummaryService } from './productivity-summary.service';
import { GetReportResponseDto } from './interfaces/report.dto';
import { ProjectService } from '../sprint/project.service';
import { GoogleSheetsClient } from '../talent-leave/clients/google-sheets.client';

@Controller('report')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly productivitySummaryService: ProductivitySummaryService,
    private readonly projectService: ProjectService,
    private readonly googleSheetsClient: GoogleSheetsClient,
  ) {}

  @Get('productivity-summary/auth/google')
  @HttpCode(HttpStatus.OK)
  getGoogleAuthUrl() {
    const oauth2Client = this.googleSheetsClient.getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
      prompt: 'consent',
    });

    return {
      authUrl,
      message:
        'Visit this URL to authorize the application. After authorization, you will receive an access token.',
    };
  }

  @Post('productivity-summary/export')
  @HttpCode(HttpStatus.OK)
  async exportToSpreadsheet(
    @Body('month') month: string,
    @Body('year') year: string,
    @Body('accessToken') accessToken: string,
  ) {
    if (!month || !year || !accessToken) {
      throw new BadRequestException('month, year, and accessToken are required');
    }

    return this.productivitySummaryService.exportToSpreadsheet(
      parseInt(month, 10),
      parseInt(year, 10),
      accessToken,
    );
  }

  @Get('productivity-summary')
  async getProductivitySummary(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.productivitySummaryService.generateProductivitySummary(
      parseInt(month, 10),
      parseInt(year, 10),
    );
  }

  @Get('')
  async getAll(
    @Query('sprint') sprint: string,
    @Query('project') project: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('epicId') epicId?: string,
  ): Promise<GetReportResponseDto> {
    // If date range is provided, use date-based report
    if (startDate && endDate) {
      return this.reportsService.generateReportByDateRange(startDate, endDate, project, epicId);
    }
    
    // Otherwise use sprint-based report (existing behavior)
    return this.reportsService.generateReport(sprint, project, epicId);
  }

  @Get('epics')
  async getEpics(
    @Query('sprint') sprint: string,
    @Query('project') project: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getEpics(sprint, project, startDate, endDate);
  }

  @Get('all')
  async getAllData() {
    const boardIds = [142, 143];
    const projects = ['SLS', 'DS'];
    const allSprintData: Array<{
      sprintName: string;
      project: string;
      data: GetReportResponseDto;
    }> = [];

    // Get current quarter and previous quarter
    const today = new Date();
    const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
    const currentYear = today.getFullYear();

    // Calculate previous quarter
    let previousQuarter = currentQuarter - 1;
    let previousQuarterYear = currentYear;
    if (previousQuarter === 0) {
      previousQuarter = 4;
      previousQuarterYear = currentYear - 1;
    }

    for (const boardId of boardIds) {
      const sprints = await this.projectService.fetchAllSprint(boardId);

      // Filter sprints that started in the current quarter or previous quarter
      const filteredSprints = sprints.filter((sprint) => {
        if (!sprint.startDate) return false;
        const startDate = new Date(sprint.startDate);
        const sprintQuarter = Math.floor(startDate.getMonth() / 3) + 1;
        const sprintYear = startDate.getFullYear();
        return (
          (sprintQuarter === currentQuarter && sprintYear === currentYear) ||
          (sprintQuarter === previousQuarter &&
            sprintYear === previousQuarterYear)
        );
      });

      for (const sprint of filteredSprints) {
        for (const project of projects) {
          const reportData = await this.reportsService.generateReport(
            String(sprint.id),
            project,
          );

          allSprintData.push({
            sprintName: sprint.name,
            project,
            data: reportData,
          });
        }
      }
    }

    return allSprintData;
  }
}
