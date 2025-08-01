import { Injectable } from '@nestjs/common';
import { JiraIssueEntity } from '../interfaces/report.entity';
import { IIssueCategorizer } from './issue-categorizer.strategy';

@Injectable()
export class LegacyIssueCategorizer implements IIssueCategorizer {
  categorize(issue: JiraIssueEntity): 'productPoint' | 'techDebtPoint' {
    return issue.fields.customfield_10796?.value === 'SP Product'
      ? 'productPoint'
      : 'techDebtPoint';
  }

  getWeightPointsCategory(
    issue: JiraIssueEntity,
  ): 'weightPointsProduct' | 'weightPointsTechDebt' {
    return this.categorize(issue) === 'productPoint'
      ? 'weightPointsProduct'
      : 'weightPointsTechDebt';
  }
}
