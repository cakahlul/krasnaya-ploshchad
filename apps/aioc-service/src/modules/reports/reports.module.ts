import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportJiraRepository } from './repositories/report.jira.repository';
import { IssueProcessingStrategyFactory } from './strategies/issue-processing-strategy.factory';
import { LegacyComplexityWeightStrategy } from './strategies/legacy-complexity-weight.strategy';
import { NewComplexityWeightStrategy } from './strategies/new-complexity-weight.strategy';
import { V3ComplexityWeightStrategy } from './strategies/v3-complexity-weight.strategy';
import { LegacyIssueCategorizer } from './strategies/legacy-issue-categorizer.strategy';
import { NewIssueCategorizer } from './strategies/new-issue-categorizer.strategy';
import { ProjectModule } from '../sprint/project.module';
import { TalentLeaveModule } from '../talent-leave/talent-leave.module';
import { HolidaysModule } from '../holidays/holidays.module';
import { ProductivitySummaryService } from './productivity-summary.service';

@Module({
  imports: [ProjectModule, TalentLeaveModule, HolidaysModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ProductivitySummaryService,
    ReportJiraRepository,
    IssueProcessingStrategyFactory,
    LegacyComplexityWeightStrategy,
    NewComplexityWeightStrategy,
    V3ComplexityWeightStrategy,
    LegacyIssueCategorizer,
    NewIssueCategorizer,
  ],
  exports: [ReportsService, ProductivitySummaryService],
})
export class ReportsModule {}
