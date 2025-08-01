import { Injectable } from '@nestjs/common';
import { JiraIssueEntity } from '../interfaces/report.entity';
import { IComplexityWeightStrategy } from './complexity-weight.strategy';
import { IIssueCategorizer } from './issue-categorizer.strategy';
import { LegacyComplexityWeightStrategy } from './legacy-complexity-weight.strategy';
import { NewComplexityWeightStrategy } from './new-complexity-weight.strategy';
import { LegacyIssueCategorizer } from './legacy-issue-categorizer.strategy';
import { NewIssueCategorizer } from './new-issue-categorizer.strategy';

export interface IssueProcessingStrategies {
  complexityWeightStrategy: IComplexityWeightStrategy;
  issueCategorizer: IIssueCategorizer;
}

@Injectable()
export class IssueProcessingStrategyFactory {
  constructor(
    private readonly legacyComplexityWeightStrategy: LegacyComplexityWeightStrategy,
    private readonly newComplexityWeightStrategy: NewComplexityWeightStrategy,
    private readonly legacyIssueCategorizer: LegacyIssueCategorizer,
    private readonly newIssueCategorizer: NewIssueCategorizer,
  ) {}

  createStrategies(issue: JiraIssueEntity): IssueProcessingStrategies {
    return {
      complexityWeightStrategy: this.shouldUseNewComplexityWeightStrategy(issue)
        ? this.newComplexityWeightStrategy
        : this.legacyComplexityWeightStrategy,
      issueCategorizer: this.shouldUseNewIssueCategorizer(issue)
        ? this.newIssueCategorizer
        : this.legacyIssueCategorizer,
    };
  }

  private shouldUseNewComplexityWeightStrategy(
    issue: JiraIssueEntity,
  ): boolean {
    // Use new strategy if appendix weight point field is present
    return !!issue.fields.customfield_11444;
  }

  private shouldUseNewIssueCategorizer(issue: JiraIssueEntity): boolean {
    // Use new strategy if story point v2 field is present
    return !!issue.fields.customfield_11312;
  }
}
