import type { IComplexityWeightStrategy } from './complexity-weight.strategy';
import type { JiraIssueEntity } from '@shared/types/report.types';
import { parseAppendixWeightPoints, type AppendixWeightPoint } from '@shared/utils/appendix-level';
import type { WpWeights } from '@server/modules/wp-weight-config/wp-weight-config.repository';

const DEFAULT_WEIGHTS: WpWeights = {
  'Very Low': 1,
  'Low': 2,
  'Medium': 4,
  'High': 8,
};

export class NewComplexityWeightStrategy implements IComplexityWeightStrategy {
  constructor(private readonly weights: Record<AppendixWeightPoint, number> = DEFAULT_WEIGHTS) {}

  calculateWeight(issue: JiraIssueEntity): number {
    const appendixWeightText = issue.fields.customfield_11444?.value;
    if (!appendixWeightText) return 0;
    const weightPoint = parseAppendixWeightPoints(appendixWeightText);
    if (!weightPoint) return 0;
    return this.weights[weightPoint];
  }
}

export const newComplexityWeightStrategy = new NewComplexityWeightStrategy();
