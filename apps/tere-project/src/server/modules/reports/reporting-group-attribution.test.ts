import assert from 'node:assert/strict';
import type { JiraIssueEntity } from '@shared/types/report.types';
import { processRawData, resolveReportMemberGroups } from './reports.service';

const member = {
  id: 'member-1', jiraId: 'account-1', name: 'Member', fullName: 'Member One',
  email: 'member@example.com', level: 'senior', isLead: false, teams: ['LOAN-A', 'LOAN-B'],
} as never;

const loanBoards = [
  { id: '1', boardId: 1, name: 'Loan A', shortName: 'LOAN-A', reportingGroup: 'Loan' },
  { id: '2', boardId: 2, name: 'Loan B', shortName: 'LOAN-B', reportingGroup: 'Loan' },
] as never;

assert.equal(resolveReportMemberGroups([member], loanBoards).get('Member One'), 'Loan');
assert.throws(
  () => resolveReportMemberGroups(
    [member],
    [loanBoards[0], { id: '3', boardId: 3, name: 'Transaction', shortName: 'LOAN-B', reportingGroup: 'Transaction' }] as never,
  ),
  (error: unknown) => error instanceof Error
    && 'code' in error
    && error.code === 'MULTIPLE_REPORTING_GROUPS',
);

const issue = {
  id: 'issue-1',
  key: 'LOAN-A-1',
  summary: 'Conflicting fields prove the configured member rule wins',
  fields: {
    assignee: { accountId: 'account-1', displayName: 'Member One' },
    customfield_11015: { id: '10651' },
    customfield_11444: { value: 'ALL-High' },
    customfield_11543: [{ value: 'ALL-Medium' }],
    customfield_10796: { value: 'SP Tech Debt' },
    customfield_11312: { value: 'Product' },
    issuetype: { name: 'Story' },
    resolution: { name: 'Done' },
  },
} as JiraIssueEntity;

const report = processRawData(
  [issue],
  [member],
  undefined,
  undefined,
  [],
  false,
  undefined,
  undefined,
  ['LOAN-A'],
  new Map([['Member One', 'legacy']]),
);

assert.equal(report[0].totalWeightPoints, 2, 'member Group legacy rule selects legacy complexity');
assert.equal(report[0].weightPointsTechDebt, 2, 'member Group legacy rule selects legacy categorizer');
assert.equal(report[0].weightPointsProduct, 0);
