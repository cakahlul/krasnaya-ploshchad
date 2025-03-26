import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  GetAllProjectResponseDto,
  GetReportResponseDto,
} from './interfaces/report.dto';

@Controller('report')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('')
  async getAll(
    @Query('sprint') sprint: string,
    @Query('project') project: string,
  ): Promise<GetReportResponseDto> {
    return this.reportsService.generateReport(sprint, project);
  }

  @Get('project')
  async getAllProject(): Promise<GetAllProjectResponseDto[]> {
    return await this.reportsService.fetchAllProject();
  }
}
