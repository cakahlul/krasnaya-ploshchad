import type { IIssueCategorizer } from './issue-categorizer.strategy';
import type { JiraIssueEntity } from '@shared/types/report.types';

export class NewIssueCategorizer implements IIssueCategorizer {
  categorize(issue: JiraIssueEntity): 'productPoint' | 'techDebtPoint' {
    const storyPointType = issue.fields.customfield_11312?.value || '';
    return storyPointType === 'Product' ? 'productPoint' : 'techDebtPoint';
  }
  getWeightPointsCategory(issue: JiraIssueEntity): 'weightPointsProduct' | 'weightPointsTechDebt' {
    return this.categorize(issue) === 'productPoint' ? 'weightPointsProduct' : 'weightPointsTechDebt';
  }
}

export const newIssueCategorizer = new NewIssueCategorizer();
