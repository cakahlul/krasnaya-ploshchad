import { JiraIssueEntity } from '../interfaces/report.entity';

export interface IComplexityWeightStrategy {
  calculateWeight(issue: JiraIssueEntity): number;
}
