import type { IComplexityWeightStrategy } from './complexity-weight.strategy';
import type { JiraIssueEntity } from '@shared/types/report.types';

const complexityWeights: Record<string, number> = {
  '10650': 1,
  '10651': 2,
  '10652': 4,
  '10653': 8,
};

export class LegacyComplexityWeightStrategy implements IComplexityWeightStrategy {
  calculateWeight(issue: JiraIssueEntity): number {
    const complexityId = issue.fields.customfield_11015?.id?.toString();
    if (!complexityId) return 0;
    return complexityWeights[complexityId] ?? 0;
  }
}

export const legacyComplexityWeightStrategy = new LegacyComplexityWeightStrategy();
