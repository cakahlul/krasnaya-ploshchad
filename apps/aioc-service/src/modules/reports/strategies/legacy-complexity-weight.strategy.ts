import { Injectable } from '@nestjs/common';
import { JiraIssueEntity } from '../interfaces/report.entity';
import { IComplexityWeightStrategy } from './complexity-weight.strategy';

@Injectable()
export class LegacyComplexityWeightStrategy
  implements IComplexityWeightStrategy
{
  private readonly complexityWeights: { [key: string]: number } = {
    '10650': 1.5, // Very Low complexity
    '10651': 2, // Low Complexity
    '10652': 4, // Medium complexity
    '10653': 8, // High complexity
  };

  calculateWeight(issue: JiraIssueEntity): number {
    const complexityId =
      issue.fields.customfield_11015?.id?.toString() ?? '10650';
    return this.complexityWeights[complexityId] ?? 1.5;
  }
}
