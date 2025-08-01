import { JiraIssueEntity } from '../interfaces/report.entity';

export interface IIssueCategorizer {
  categorize(issue: JiraIssueEntity): 'productPoint' | 'techDebtPoint';
  getWeightPointsCategory(
    issue: JiraIssueEntity,
  ): 'weightPointsProduct' | 'weightPointsTechDebt';
}
