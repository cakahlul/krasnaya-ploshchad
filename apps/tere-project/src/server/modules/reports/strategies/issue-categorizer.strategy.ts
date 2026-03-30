import type { JiraIssueEntity } from '@shared/types/report.types';

export interface IIssueCategorizer {
  categorize(issue: JiraIssueEntity): 'productPoint' | 'techDebtPoint';
  getWeightPointsCategory(issue: JiraIssueEntity): 'weightPointsProduct' | 'weightPointsTechDebt';
}
