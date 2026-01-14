import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GetReportResponseDto } from './interfaces/report.dto';
import { ProjectService } from '../sprint/project.service';
import { Public } from 'src/auth/public.decorator';


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
  ): Promise<GetReportResponseDto> {
    return this.reportsService.generateReport(sprint, project);
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
