import { sql } from 'drizzle-orm';
import { db } from '@server/lib/db';
import type { ConfiguredReportingGroup, GroupRuleConfig, RuleVersion } from '@shared/types/reporting-group.types';

export interface ReportingGroupRuleStore {
  findRuleAtOrBefore(
    group: ConfiguredReportingGroup,
    month: string,
  ): Promise<GroupRuleConfig | null>;
}

export class ReportingGroupRuleRepository implements ReportingGroupRuleStore {
  async findRuleAtOrBefore(
    group: ConfiguredReportingGroup,
    month: string,
  ): Promise<GroupRuleConfig | null> {
    const rows = await db.execute<{ reporting_group: string; effective_month: string; rule_version: string }>(sql`
      SELECT reporting_group, effective_month, rule_version
      FROM group_rule_config
      WHERE reporting_group = ${group} AND effective_month <= ${`${month}-01`}
      ORDER BY effective_month DESC
      LIMIT 1
    `);
    const row = rows[0];
    return row ? {
      group: row.reporting_group as ConfiguredReportingGroup,
      effectiveMonth: row.effective_month.slice(0, 7),
      ruleVersion: row.rule_version as RuleVersion,
    } : null;
  }
}
