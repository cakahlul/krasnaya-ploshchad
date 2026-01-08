import { Injectable } from '@nestjs/common';
import { JiraIssueEntity } from '../interfaces/report.entity';
import { IComplexityWeightStrategy } from './complexity-weight.strategy';
import {
  parseAppendixWeightPoints,
  AppendixWeightPoint,
} from 'src/shared/utils/appendix-level';

@Injectable()
export class V3ComplexityWeightStrategy implements IComplexityWeightStrategy {
  private readonly appendixWeightPointsMapping: {
    [key in AppendixWeightPoint]: number;
  } = {
    'Very Low': 1.5,
    Low: 2,
    Medium: 4,
    High: 8,
  };

  calculateWeight(issue: JiraIssueEntity): number {
    // customfield_11543 is a multiple select field (array), sum all selected options
    const selectedOptions = issue.fields.customfield_11543 || [];

    // Sum the weight of all selected options
    const totalWeight = selectedOptions.reduce((total, option) => {
      const appendixWeightText = option?.value;
      if (!appendixWeightText) {
        return total;
      }
      const weightPoint = parseAppendixWeightPoints(appendixWeightText);
      if (!weightPoint) {
        return total;
      }
      const weight = this.appendixWeightPointsMapping[weightPoint];
      return total + weight;
    }, 0);

    return totalWeight;
  }
}
