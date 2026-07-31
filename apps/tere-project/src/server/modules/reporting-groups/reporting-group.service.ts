import type {
  ConfiguredReportingGroup,
  ReportingBoardConfiguration,
  ReportingGroup,
  ResolvedRuleVersion,
} from '@shared/types/reporting-group.types';
import { ReportingGroupRuleRepository, type ReportingGroupRuleStore } from './reporting-group.repository';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export class ReportingGroupConfigurationError extends Error {
  constructor(
    readonly code: 'INVALID_MONTH' | 'RULE_NOT_CONFIGURED' | 'MULTIPLE_REPORTING_GROUPS',
    message: string,
  ) {
    super(message);
  }
}

export class ReportingGroupService {
  constructor(private readonly rules: ReportingGroupRuleStore) {}

  async resolveRule(group: ReportingGroup, month: string): Promise<{ ruleVersion: ResolvedRuleVersion }> {
    if (!MONTH_PATTERN.test(month)) {
      throw new ReportingGroupConfigurationError('INVALID_MONTH', 'Month must use YYYY-MM');
    }
    if (group === 'Ungrouped') return { ruleVersion: 'issue-field-presence' };

    const rule = await this.rules.findRuleAtOrBefore(group, month);
    if (!rule) {
      throw new ReportingGroupConfigurationError(
        'RULE_NOT_CONFIGURED',
        `No reporting rule configured for ${group} in ${month}`,
      );
    }
    return { ruleVersion: rule.ruleVersion };
  }

  resolveBoardGroup(config: Partial<ReportingBoardConfiguration> | null | undefined): ReportingGroup {
    return config?.reportingGroup ?? 'Ungrouped';
  }

  resolveMemberGroup(groups: readonly ReportingGroup[]): ReportingGroup {
    const configured = [...new Set(groups.filter((group): group is ConfiguredReportingGroup => group !== 'Ungrouped'))];
    if (configured.length === 0) return 'Ungrouped';
    if (configured.length === 1) return configured[0];
    throw new ReportingGroupConfigurationError(
      'MULTIPLE_REPORTING_GROUPS',
      `Member belongs to multiple reporting groups: ${configured.join(', ')}`,
    );
  }
}

export const reportingGroupService = new ReportingGroupService(new ReportingGroupRuleRepository());
