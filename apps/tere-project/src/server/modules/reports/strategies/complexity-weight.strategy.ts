import type { JiraIssueEntity } from '@shared/types/report.types';

export interface IComplexityWeightStrategy {
  calculateWeight(issue: JiraIssueEntity): number;
}
