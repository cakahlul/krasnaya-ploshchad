import { Injectable } from '@nestjs/common';
import { JiraIssueEntity } from '../interfaces/report.entity';
import { IIssueCategorizer } from './issue-categorizer.strategy';

@Injectable()
export class NewIssueCategorizer implements IIssueCategorizer {
  categorize(issue: JiraIssueEntity): 'productPoint' | 'techDebtPoint' {
    const storyPointType = issue.fields.customfield_11312?.value || '';
    return storyPointType === 'Product' ? 'productPoint' : 'techDebtPoint';
  }

  getWeightPointsCategory(
    issue: JiraIssueEntity,
  ): 'weightPointsProduct' | 'weightPointsTechDebt' {
    return this.categorize(issue) === 'productPoint'
      ? 'weightPointsProduct'
      : 'weightPointsTechDebt';
  }
}
