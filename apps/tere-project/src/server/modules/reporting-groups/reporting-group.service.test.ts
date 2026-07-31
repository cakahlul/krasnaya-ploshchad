import assert from 'node:assert/strict';
import {
  ReportingGroupConfigurationError,
  ReportingGroupService,
} from './reporting-group.service';
import { issueProcessingStrategyFactory } from '../reports/strategies/issue-processing-strategy.factory';

const service = new ReportingGroupService({
  findRuleAtOrBefore: async (group, month) => {
    const rules = {
      Loan: [
        { group: 'Loan' as const, effectiveMonth: '2026-05', ruleVersion: 'v3' as const },
        { group: 'Loan' as const, effectiveMonth: '2020-01', ruleVersion: 'legacy' as const },
      ],
      Transaction: [
        { group: 'Transaction' as const, effectiveMonth: '2026-05', ruleVersion: 'v3' as const },
        { group: 'Transaction' as const, effectiveMonth: '2020-01', ruleVersion: 'new' as const },
      ],
      User: [
        { group: 'User' as const, effectiveMonth: '2026-04', ruleVersion: 'v3' as const },
        { group: 'User' as const, effectiveMonth: '2020-01', ruleVersion: 'legacy' as const },
      ],
    }[group];
    return rules.find(rule => rule.effectiveMonth <= month) ?? null;
  },
});

async function main() {
  assert.equal((await service.resolveRule('Loan', '2026-04')).ruleVersion, 'legacy');
  assert.equal((await service.resolveRule('Loan', '2026-05')).ruleVersion, 'v3');
  assert.equal((await service.resolveRule('Transaction', '2026-04')).ruleVersion, 'new');
  assert.equal((await service.resolveRule('Transaction', '2026-05')).ruleVersion, 'v3');
  assert.equal((await service.resolveRule('User', '2026-03')).ruleVersion, 'legacy');
  assert.equal((await service.resolveRule('User', '2026-04')).ruleVersion, 'v3');
  assert.equal((await service.resolveRule('Ungrouped', '2026-07')).ruleVersion, 'issue-field-presence');
  await assert.rejects(
    new ReportingGroupService({ findRuleAtOrBefore: async () => null }).resolveRule('Loan', '2026-04'),
    error => error instanceof ReportingGroupConfigurationError && error.code === 'RULE_NOT_CONFIGURED',
  );
  await assert.rejects(
    service.resolveRule('Loan', '2026-13'),
    error => error instanceof ReportingGroupConfigurationError && error.code === 'INVALID_MONTH',
  );

  assert.equal(service.resolveMemberGroup(['Loan', 'Loan']), 'Loan');
  assert.equal(service.resolveMemberGroup([]), 'Ungrouped');
  assert.equal(service.resolveBoardGroup({ reportingGroup: 'User', reportingBoardLeadEmail: 'user-lead@amarbank.co.id' }), 'User');
  assert.equal(service.resolveBoardGroup({ reportingGroup: null, reportingBoardLeadEmail: null }), 'Ungrouped');
  assert.throws(
    () => service.resolveMemberGroup(['Loan', 'Transaction']),
    error => error instanceof ReportingGroupConfigurationError
      && error.code === 'MULTIPLE_REPORTING_GROUPS',
  );

  const issue = { fields: {
    customfield_11015: { id: '10651' },
    customfield_11444: { value: 'ALL-High' },
    customfield_11543: [{ value: 'ALL-Medium' }],
    customfield_11312: { value: 'Product' },
    customfield_10796: { value: 'SP Tech Debt' },
  } } as never;
  const legacy = issueProcessingStrategyFactory.createStrategies(issue, undefined, 'legacy');
  const next = issueProcessingStrategyFactory.createStrategies(issue, undefined, 'new');
  const v3 = issueProcessingStrategyFactory.createStrategies(issue, undefined, 'v3');
  const issueFieldPresence = issueProcessingStrategyFactory.createStrategies(issue);
  assert.equal(legacy.complexityWeightStrategy.calculateWeight(issue), 2);
  assert.equal(legacy.issueCategorizer.getWeightPointsCategory(issue), 'weightPointsTechDebt');
  assert.equal(next.complexityWeightStrategy.calculateWeight(issue), 8);
  assert.equal(next.issueCategorizer.getWeightPointsCategory(issue), 'weightPointsProduct');
  assert.equal(v3.complexityWeightStrategy.calculateWeight(issue), 4);
  assert.equal(v3.issueCategorizer.getWeightPointsCategory(issue), 'weightPointsProduct');
  assert.equal(issueFieldPresence.complexityWeightStrategy.calculateWeight(issue), 4);
  assert.equal(issueFieldPresence.issueCategorizer.getWeightPointsCategory(issue), 'weightPointsProduct');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
