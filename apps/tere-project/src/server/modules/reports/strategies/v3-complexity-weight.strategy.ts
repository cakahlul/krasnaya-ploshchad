import type { IComplexityWeightStrategy } from './complexity-weight.strategy';
import type { JiraIssueEntity } from '@shared/types/report.types';
import { parseAppendixWeightPoints, type AppendixWeightPoint } from '@shared/utils/appendix-level';

const appendixWeightPointsMapping: Record<AppendixWeightPoint, number> = {
  'Very Low': 1.5,
  'Low': 2,
  'Medium': 4,
  'High': 8,
};

export class V3ComplexityWeightStrategy implements IComplexityWeightStrategy {
  calculateWeight(issue: JiraIssueEntity): number {
    const selectedOptions = issue.fields.customfield_11543 || [];
    return selectedOptions.reduce((total: number, option: any) => {
      const appendixWeightText = option?.value;
      if (!appendixWeightText) return total;
      const weightPoint = parseAppendixWeightPoints(appendixWeightText);
      if (!weightPoint) return total;
      return total + appendixWeightPointsMapping[weightPoint];
    }, 0);
  }
}

export const v3ComplexityWeightStrategy = new V3ComplexityWeightStrategy();
