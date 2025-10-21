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

    for (const boardId of boardIds) {
      const sprints = await this.projectService.fetchAllSprint(boardId);

      for (const sprint of sprints) {
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
