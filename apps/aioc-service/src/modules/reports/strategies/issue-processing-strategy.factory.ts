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
    const isUsingNewBehavior = this.isUsingNewBehavior(issue);

    return {
      complexityWeightStrategy: isUsingNewBehavior
        ? this.newComplexityWeightStrategy
        : this.legacyComplexityWeightStrategy,
      issueCategorizer: isUsingNewBehavior
        ? this.newIssueCategorizer
        : this.legacyIssueCategorizer,
    };
  }

  private isUsingNewBehavior(issue: JiraIssueEntity): boolean {
    return !!(issue.fields.customfield_11444 && issue.fields.customfield_11312);
  }
}
