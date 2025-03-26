import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportJiraRepository } from './repositories/report.jira.repository';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportJiraRepository],
})
export class ReportsModule {}
