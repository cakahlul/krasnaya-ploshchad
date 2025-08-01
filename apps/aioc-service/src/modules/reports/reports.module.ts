import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportJiraRepository } from './repositories/report.jira.repository';
import { IssueProcessingStrategyFactory } from './strategies/issue-processing-strategy.factory';
import { LegacyComplexityWeightStrategy } from './strategies/legacy-complexity-weight.strategy';
import { NewComplexityWeightStrategy } from './strategies/new-complexity-weight.strategy';
import { LegacyIssueCategorizer } from './strategies/legacy-issue-categorizer.strategy';
import { NewIssueCategorizer } from './strategies/new-issue-categorizer.strategy';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportJiraRepository,
    IssueProcessingStrategyFactory,
    LegacyComplexityWeightStrategy,
    NewComplexityWeightStrategy,
    LegacyIssueCategorizer,
    NewIssueCategorizer,
  ],
})
export class ReportsModule {}
