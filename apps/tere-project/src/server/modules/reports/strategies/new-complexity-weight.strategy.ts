import type { IComplexityWeightStrategy } from './complexity-weight.strategy';
import type { JiraIssueEntity } from '@shared/types/report.types';
import { parseAppendixWeightPoints, type AppendixWeightPoint } from '@shared/utils/appendix-level';

const appendixWeightPointsMapping: Record<AppendixWeightPoint, number> = {
  'Very Low': 1,
  'Low': 2,
  'Medium': 4,
  'High': 8,
};

export class NewComplexityWeightStrategy implements IComplexityWeightStrategy {
  calculateWeight(issue: JiraIssueEntity): number {
    const appendixWeightText = issue.fields.customfield_11444?.value;
    if (!appendixWeightText) return 0;
    const weightPoint = parseAppendixWeightPoints(appendixWeightText);
    if (!weightPoint) return 0;
    return appendixWeightPointsMapping[weightPoint];
  }
}

export const newComplexityWeightStrategy = new NewComplexityWeightStrategy();
