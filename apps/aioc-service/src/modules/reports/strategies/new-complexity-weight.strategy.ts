import { Injectable } from '@nestjs/common';
import { JiraIssueEntity } from '../interfaces/report.entity';
import { IComplexityWeightStrategy } from './complexity-weight.strategy';
import {
  parseAppendixWeightPoints,
  AppendixWeightPoint,
} from 'src/shared/utils/appendix-level';

@Injectable()
export class NewComplexityWeightStrategy implements IComplexityWeightStrategy {
  private readonly appendixWeightPointsMapping: {
    [key in AppendixWeightPoint]: number;
  } = {
    'Very Low': 1.5,
    Low: 2,
    Medium: 4,
    High: 8,
  };

  calculateWeight(issue: JiraIssueEntity): number {
    const appendixWeightText = issue.fields.customfield_11444?.value || '';
    const weightPoint = parseAppendixWeightPoints(appendixWeightText);
    return this.appendixWeightPointsMapping[weightPoint];
  }
}
