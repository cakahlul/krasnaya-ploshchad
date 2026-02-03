import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ReportsModule } from '../reports/reports.module';
import { ProjectModule } from '../sprint/project.module';
import { BugMonitoringModule } from '../bug-monitoring/bug-monitoring.module';

@Module({
  imports: [ReportsModule, ProjectModule, BugMonitoringModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
