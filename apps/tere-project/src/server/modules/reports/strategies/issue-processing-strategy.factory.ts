import type { JiraIssueEntity } from '@shared/types/report.types';
import type { IComplexityWeightStrategy } from './complexity-weight.strategy';
import type { IIssueCategorizer } from './issue-categorizer.strategy';
import type { WpWeights } from '@server/modules/wp-weight-config/wp-weight-config.repository';
import { legacyComplexityWeightStrategy } from './legacy-complexity-weight.strategy';
import { NewComplexityWeightStrategy } from './new-complexity-weight.strategy';
import { V3ComplexityWeightStrategy } from './v3-complexity-weight.strategy';
import { legacyIssueCategorizer } from './legacy-issue-categorizer.strategy';
import { newIssueCategorizer } from './new-issue-categorizer.strategy';
import type { RuleVersion } from '@shared/types/reporting-group.types';

export interface IssueProcessingStrategies {
  complexityWeightStrategy: IComplexityWeightStrategy;
  issueCategorizer: IIssueCategorizer;
}

class IssueProcessingStrategyFactory {
  createStrategies(
    issue: JiraIssueEntity,
    wpWeights?: WpWeights,
    ruleVersion?: RuleVersion,
  ): IssueProcessingStrategies {
    return {
      complexityWeightStrategy: this.getComplexityWeightStrategy(issue, wpWeights, ruleVersion),
      issueCategorizer: ruleVersion === 'legacy'
        ? legacyIssueCategorizer
        : ruleVersion === 'new' || ruleVersion === 'v3'
          ? newIssueCategorizer
          : issue.fields.customfield_11312 ? newIssueCategorizer : legacyIssueCategorizer,
    };
  }

  private getComplexityWeightStrategy(
    issue: JiraIssueEntity,
    wpWeights?: WpWeights,
    ruleVersion?: RuleVersion,
  ): IComplexityWeightStrategy {
    if (ruleVersion === 'v3') return new V3ComplexityWeightStrategy(wpWeights);
    if (ruleVersion === 'new') return new NewComplexityWeightStrategy(wpWeights);
    if (ruleVersion === 'legacy') return legacyComplexityWeightStrategy;

    const selectedOptions = issue.fields.customfield_11543;
    if (selectedOptions && selectedOptions.length > 0) return new V3ComplexityWeightStrategy(wpWeights);
    if (issue.fields.customfield_11444) return new NewComplexityWeightStrategy(wpWeights);
    return legacyComplexityWeightStrategy;
  }
}

export const issueProcessingStrategyFactory = new IssueProcessingStrategyFactory();
