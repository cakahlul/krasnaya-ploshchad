import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { boardsService } from '@server/modules/boards/boards.service';
import { holidaysService } from '@server/modules/holidays/holidays.service';
import { membersService } from '@server/modules/members/members.service';
import { snapshotChecksum } from '@server/modules/report-snapshots/report-snapshot';
import { sprintService } from '@server/modules/sprint/sprint.service';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';
import { targetWpConfigService } from '@server/modules/target-wp-config/target-wp-config.service';
import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';
import {
  buildSprintTrendPoints,
  filterReportForLifecycle,
  filterReportMembersForProject,
  generateReport,
  processRawData,
  summarizeTeamReport,
} from './reports.service';

test('keeps failed sprint trend requests as unavailable points', () => {
  const points = buildSprintTrendPoints([
    { sprintId: '1', report: { issues: [], totalWeightPointsProduct: 0, totalWeightPointsTechDebt: 0, productPercentage: '0%', techDebtPercentage: '0%', averageProductivity: '0%' } },
    { sprintId: '2' },
  ]);

  assert.deepEqual(points.map(point => point.sprintId), ['1', '2']);
  assert.equal(points[0].sourceMetadata, undefined);
  assert.equal(points[1].sourceMetadata?.source, 'unavailable');
  assert.deepEqual(points[1].teams, []);
});

test('omits undefined optional summary values so snapshot checksums stay JSON-safe', () => {
  const summary = summarizeTeamReport([], null, []);

  assert.equal('totalWorkingDays' in summary, false);
  assert.equal('averageWorkingDays' in summary, false);
  assert.equal('sprintStartDate' in summary, false);
  assert.equal('sprintEndDate' in summary, false);
  assert.doesNotThrow(() => snapshotChecksum(summary));
});

test('uses capture sprint dates for Scrum report calendar inputs', async () => {
  const holidayRange: Date[] = [];
  let leaveRange: { startDate?: string; endDate?: string } | undefined;
  mock.method(membersService, 'findAll', async () => []);
  mock.method(boardsService, 'findAll', async () => []);
  mock.method(sprintService, 'fetchAllSprint', async () => { throw new Error('override should avoid sprint lookup'); });
  mock.method(talentLeaveService, 'findAll', async (filters) => {
    leaveRange = filters;
    return [];
  });
  mock.method(holidaysService, 'getNationalHolidays', async (startDate, endDate) => {
    holidayRange.push(startDate, endDate);
    return [];
  });
  mock.method(wpWeightConfigService, 'getEffectiveWeights', async () => undefined as never);
  mock.method(targetWpConfigService, 'getEffectiveRates', async () => undefined as never);

  try {
    const report = await generateReport(
      'not-looked-up',
      'TEAM',
      undefined,
      [],
      undefined,
      { startDate: '2026-01-05', endDate: '2026-01-16' },
    );

    assert.equal(report.sprintStartDate, '2026-01-05');
    assert.equal(report.sprintEndDate, '2026-01-16');
    assert.equal(report.totalWorkingDays, 10);
    assert.deepEqual(leaveRange, { startDate: '2026-01-05', endDate: '2026-01-16' });
    assert.equal(holidayRange.length, 2);
    assert.deepEqual(
      holidayRange.map(date => [date.getFullYear(), date.getMonth() + 1, date.getDate()]),
      [[2026, 1, 5], [2026, 1, 16]],
    );
  } finally {
    mock.restoreAll();
  }
});

test('filters report members by employment overlap before Jira assignee selection', () => {
  const members = [
    { fullName: 'Active', teams: ['TEAM'], joinDate: '2026-01-16', resignDate: null, isLead: false },
    { fullName: 'Not Yet Joined', teams: ['TEAM'], joinDate: '2026-01-17', resignDate: null, isLead: false },
    { fullName: 'Already Resigned', teams: ['TEAM'], joinDate: '2025-01-01', resignDate: '2026-01-04', isLead: false },
  ] as never;

  assert.deepEqual(
    filterReportMembersForProject(members, 'TEAM', '2026-01-05', '2026-01-16')
      .map(member => member.fullName),
    ['Active'],
  );
});

test('clamps live report capacity to the member employment interval', () => {
  const report = processRawData(
    [{
      id: '1',
      key: 'TEAM-1',
      fields: {
        assignee: { accountId: 'acc-1' },
        issuetype: { name: 'Story' },
        resolution: { name: 'Done' },
        customfield_10796: { value: 'SP Product' },
        customfield_11015: { id: '10651' },
      },
    }] as never,
    [{
      fullName: 'Joins Mid-Sprint',
      jiraId: 'acc-1',
      level: 'senior',
      teams: ['TEAM'],
      joinDate: '2026-01-08',
      resignDate: null,
    }] as never,
    { startDate: '2026-01-05', endDate: '2026-01-16' },
    new Map(),
    [],
    false,
    undefined,
    { senior: 8 },
  );

  assert.equal(report[0].workingDays, 7);
  assert.equal(report[0].targetWeightPoints, 56);
});

test('removes out-of-lifecycle members from stored report responses', async () => {
  mock.method(membersService, 'findAll', async () => [
    { fullName: 'Active', joinDate: '2025-01-01', resignDate: null },
    { fullName: 'Former', joinDate: '2025-01-01', resignDate: '2025-12-31' },
  ] as never);

  const issue = (member: string) => ({
    member,
    team: 'TEAM',
    productivityRate: '100%',
    wpProductivity: '100%',
    totalWeightPoints: 8,
    devDefect: 0,
    devDefectRate: '100%',
    level: 'senior',
    weightPointsProduct: 8,
    weightPointsTechDebt: 0,
    targetWeightPoints: 8,
    issueKeys: [`${member}-1`],
    epicKeys: [],
    epicBreakdown: {},
    workingDays: 1,
    wpToHours: 1,
    spProduct: 8,
    spTechDebt: 0,
    spMeeting: 0,
    spTotal: 8,
    leaveDays: 0,
    sickDays: 0,
  });

  try {
    const filtered = await filterReportForLifecycle({
      issues: [issue('Active'), issue('Former')],
      totalWeightPointsProduct: 16,
      totalWeightPointsTechDebt: 0,
      productPercentage: '100%',
      techDebtPercentage: '0%',
      averageProductivity: '100%',
      sprintStartDate: '2026-01-01',
      sprintEndDate: '2026-01-31',
    } as never, { startDate: '2026-01-01', endDate: '2026-01-31' });

    assert.deepEqual(filtered.issues.map(item => item.member), ['Active']);
    assert.equal(filtered.totalWeightPointsProduct, 8);
  } finally {
    mock.restoreAll();
  }
});
