import type { IIssueCategorizer } from './issue-categorizer.strategy';
import type { JiraIssueEntity } from '@shared/types/report.types';

export class LegacyIssueCategorizer implements IIssueCategorizer {
  categorize(issue: JiraIssueEntity): 'productPoint' | 'techDebtPoint' {
    return issue.fields.customfield_10796?.value === 'SP Product' ? 'productPoint' : 'techDebtPoint';
  }
  getWeightPointsCategory(issue: JiraIssueEntity): 'weightPointsProduct' | 'weightPointsTechDebt' {
    return this.categorize(issue) === 'productPoint' ? 'weightPointsProduct' : 'weightPointsTechDebt';
  }
}

export const legacyIssueCategorizer = new LegacyIssueCategorizer();
