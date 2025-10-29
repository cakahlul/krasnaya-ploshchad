import { Injectable } from '@nestjs/common';
import { JiraIssueEntity } from '../interfaces/report.entity';
import { IComplexityWeightStrategy } from './complexity-weight.strategy';
import { IIssueCategorizer } from './issue-categorizer.strategy';
import { LegacyComplexityWeightStrategy } from './legacy-complexity-weight.strategy';
import { NewComplexityWeightStrategy } from './new-complexity-weight.strategy';
import { V3ComplexityWeightStrategy } from './v3-complexity-weight.strategy';
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
    private readonly v3ComplexityWeightStrategy: V3ComplexityWeightStrategy,
    private readonly legacyIssueCategorizer: LegacyIssueCategorizer,
    private readonly newIssueCategorizer: NewIssueCategorizer,
  ) {}

  createStrategies(issue: JiraIssueEntity): IssueProcessingStrategies {
    return {
      complexityWeightStrategy: this.getComplexityWeightStrategy(issue),
      issueCategorizer: this.shouldUseNewIssueCategorizer(issue)
        ? this.newIssueCategorizer
        : this.legacyIssueCategorizer,
    };
  }

  private getComplexityWeightStrategy(
    issue: JiraIssueEntity,
  ): IComplexityWeightStrategy {
    // Priority: v3 (customfield_11543) > v2 (customfield_11444) > v1 (customfield_11015)
    // Check v3 first - multiple select field
    if (this.hasCustomfield11543(issue)) {
      return this.v3ComplexityWeightStrategy;
    }
    // Check v2 - single select field
    if (this.hasCustomfield11444(issue)) {
      return this.newComplexityWeightStrategy;
    }
    // Fall back to v1 (legacy)
    return this.legacyComplexityWeightStrategy;
  }

  private hasCustomfield11543(issue: JiraIssueEntity): boolean {
    const selectedOptions = issue.fields.customfield_11543;
    return !!selectedOptions && selectedOptions.length > 0;
  }

  private hasCustomfield11444(issue: JiraIssueEntity): boolean {
    return !!issue.fields.customfield_11444;
  }

  private shouldUseNewIssueCategorizer(issue: JiraIssueEntity): boolean {
    // Use new strategy if story point v2 field is present
    return !!issue.fields.customfield_11312;
  }
}
