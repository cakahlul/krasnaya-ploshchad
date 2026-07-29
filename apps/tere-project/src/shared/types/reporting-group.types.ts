export const REPORTING_GROUPS = ['Loan', 'Transaction', 'User', 'Ungrouped'] as const;

export type ReportingGroup = typeof REPORTING_GROUPS[number];
export type ConfiguredReportingGroup = Exclude<ReportingGroup, 'Ungrouped'>;
export type RuleVersion = 'legacy' | 'new' | 'v3';
export type ResolvedRuleVersion = RuleVersion | 'issue-field-presence';

export interface ReportingBoardConfiguration {
  reportingGroup: ConfiguredReportingGroup | null;
  reportingBoardLeadEmail: string | null;
}

export interface GroupRuleConfig {
  group: ConfiguredReportingGroup;
  effectiveMonth: string;
  ruleVersion: RuleVersion;
}
