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

export class V3ComplexityWeightStrategy implements IComplexityWeightStrategy {
  constructor(private readonly weights: Record<AppendixWeightPoint, number> = DEFAULT_WEIGHTS) {}

  calculateWeight(issue: JiraIssueEntity): number {
    const selectedOptions = issue.fields.customfield_11543 || [];
    return selectedOptions.reduce((total: number, option: any) => {
      const appendixWeightText = option?.value;
      if (!appendixWeightText) return total;
      const weightPoint = parseAppendixWeightPoints(appendixWeightText);
      if (!weightPoint) return total;
      return total + this.weights[weightPoint];
    }, 0);
  }
}

export const v3ComplexityWeightStrategy = new V3ComplexityWeightStrategy();
