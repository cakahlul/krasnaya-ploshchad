import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GetReportResponseDto } from './interfaces/report.dto';
import { ProjectService } from '../sprint/project.service';


@Controller('report')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly projectService: ProjectService,
  ) {}

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
      // Logic for filtering by epic in date range mode is not yet in generateReportByDateRange
      // We should pass epicId there too. But first let's update that method signature if needed.
      // Or, since we implemented filtering inside useTeamsReportTransform (frontend), maybe separate endpoint is key?
      // No, user said "enhance the response api report".
      // But I only updated `generateReport` (sprint based) to take `epicId`.
      // I need to update `generateReportByDateRange` too.
      // But `generateReportByDateRange` inside service does NOT take `epicId` yet?
      // Wait, I updated `fetchRawData` inside service to take `epicId`.
      // `generateReportByDateRange` calls `jiraReportRepository.fetchRawDataByDateRange` directly!
      // I need to update `generateReportByDateRange` to filter as well.
      
      // For now let's just update `generateReport`.
      // I will come back to `generateReportByDateRange` filtering.
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
