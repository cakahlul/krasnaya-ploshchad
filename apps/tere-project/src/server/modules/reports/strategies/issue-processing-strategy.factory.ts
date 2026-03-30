import type { JiraIssueEntity } from '@shared/types/report.types';
import type { IComplexityWeightStrategy } from './complexity-weight.strategy';
import type { IIssueCategorizer } from './issue-categorizer.strategy';
import { legacyComplexityWeightStrategy } from './legacy-complexity-weight.strategy';
import { newComplexityWeightStrategy } from './new-complexity-weight.strategy';
import { v3ComplexityWeightStrategy } from './v3-complexity-weight.strategy';
import { legacyIssueCategorizer } from './legacy-issue-categorizer.strategy';
import { newIssueCategorizer } from './new-issue-categorizer.strategy';

export interface IssueProcessingStrategies {
  complexityWeightStrategy: IComplexityWeightStrategy;
  issueCategorizer: IIssueCategorizer;
}

class IssueProcessingStrategyFactory {
  createStrategies(issue: JiraIssueEntity): IssueProcessingStrategies {
    return {
      complexityWeightStrategy: this.getComplexityWeightStrategy(issue),
      issueCategorizer: issue.fields.customfield_11312 ? newIssueCategorizer : legacyIssueCategorizer,
    };
  }

  private getComplexityWeightStrategy(issue: JiraIssueEntity): IComplexityWeightStrategy {
    const selectedOptions = issue.fields.customfield_11543;
    if (selectedOptions && selectedOptions.length > 0) return v3ComplexityWeightStrategy;
    if (issue.fields.customfield_11444) return newComplexityWeightStrategy;
    return legacyComplexityWeightStrategy;
  }
}

export const issueProcessingStrategyFactory = new IssueProcessingStrategyFactory();
