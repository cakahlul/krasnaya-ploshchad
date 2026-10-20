import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { getDashboardSummary } from './dashboard.service';
import { membersService } from '@server/modules/members/members.service';
import { boardsService } from '@server/modules/boards/boards.service';
import { serverCache } from '@server/cache/server-cache';
import type { GetReportResponseDto } from '@shared/types/report.types';

const report = {
  issues: [
    { member: 'Alice', spTotal: 8, workingDays: 1, weightPointsProduct: 4, weightPointsTechDebt: 0, totalWeightPoints: 4, targetWeightPoints: 8, issueKeys: ['SLS-1'], epicKeys: ['SLS-10'], wpProductivity: '50%', productivityRate: '100%' },
    { member: 'Bob', spTotal: 80, workingDays: 10, weightPointsProduct: 40, weightPointsTechDebt: 0, totalWeightPoints: 40, targetWeightPoints: 80, issueKeys: ['SLS-2', 'SLS-3'], epicKeys: ['SLS-20'], wpProductivity: '50%', productivityRate: '100%' },
  ],
  averageProductivity: '999%', averageWpPerHour: 999,
} as GetReportResponseDto;

test('dashboard filters before aggregating and isolates lead/member caches for Scrum and Kanban', async () => {
  mock.method(boardsService, 'findAll', async () => [
    { boardId: 1, shortName: 'SLS', name: 'Scrum', isKanban: false },
    { boardId: 2, shortName: 'SLS', name: 'Kanban', isKanban: true },
  ]);
  mock.method(membersService, 'findAll', async () => [
    { fullName: 'Alice', teams: ['SLS'], joinDate: '2025-01-01' },
    { fullName: 'Bob', teams: ['SLS'], joinDate: '2025-01-01' },
  ]);
  let teamWorkQueries = 0;
  const sources = {
    generateOpenSprintReport: async () => report,
    generateReportByDateRange: async () => report,
    getSprintWorkItemStats: async () => { teamWorkQueries++; return { totalWorkItems: 777, closedWorkItems: 666, averageHoursOpen: 999 }; },
  };
  serverCache.clear();
  try {
    const lead = await getDashboardSummary({ email: 'lead', isLead: true, teams: ['SLS'] }, '2026-01-01', '2026-01-31', [1, 2], sources);
    assert.equal(lead.teams[0].memberSummaries.length, 2);
    assert.equal(teamWorkQueries, 1);
    for (const [name, count, sp] of [['Alice', 1, 8], ['Bob', 2, 80]] as const) {
      const caller = { email: `${name}@amarbank.co.id`, isLead: false, fullName: name, teams: ['SLS'] };
      const personal = await getDashboardSummary(caller, '2026-01-01', '2026-01-31', [1, 2], sources);
      assert.equal(personal.teams.length, 2);
      for (const team of personal.teams) {
        assert.deepEqual(team.memberSummaries.map(item => item.name), [name]);
        assert.equal(team.memberSummaries[0].spTotal, sp);
        assert.equal(team.teamMembers, 1);
        assert.equal(team.totalWorkItems, count);
        assert.equal(team.totalEpics, 1);
        assert.notEqual(team.averageProductivity, '999%');
      }
      assert.deepEqual(await getDashboardSummary(caller, '2026-01-01', '2026-01-31', [1, 2], sources), personal);
      const revokedScope = await getDashboardSummary({ ...caller, teams: [] }, '2026-01-01', '2026-01-31', [1, 2], sources);
      assert.deepEqual(revokedScope.teams, [], 'removed board access must not reuse a previous personal cache');
    }
    assert.equal(teamWorkQueries, 1, 'members must not load team work-item totals');
    assert.equal(lead.teams[0].memberSummaries.length, 2, 'personal filtering must not mutate shared source data');
  } finally { mock.restoreAll(); serverCache.clear(); }
});

test('lead dashboard lists only current active teammates and excludes unrelated boards', async () => {
  mock.method(boardsService, 'findAll', async () => [
    { boardId: 1, shortName: 'SLS', name: 'Assigned', isKanban: true },
    { boardId: 2, shortName: 'DS', name: 'Unassigned', isKanban: true },
  ]);
  const roster = [
    { fullName: 'Alice', teams: ['sls'], joinDate: '2025-01-01', resignDate: null },
    { fullName: 'Departed', teams: ['SLS'], joinDate: '2020-01-01', resignDate: '2021-01-01' },
    { fullName: 'Future', teams: ['SLS'], joinDate: '2200-01-01', resignDate: null },
    { fullName: 'Other Team', teams: ['DS'], joinDate: '2020-01-01', resignDate: null },
  ];
  mock.method(membersService, 'findAll', async () => roster);
  const mixedReport = { ...report, issues: roster.map(member => ({ ...report.issues[0], member: member.fullName })) };
  const sources = {
    generateOpenSprintReport: async () => mixedReport,
    generateReportByDateRange: async () => mixedReport,
    getSprintWorkItemStats: async () => ({ totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null }),
  };
  serverCache.clear();
  try {
    assert.deepEqual((await membersService.findActiveTeamMembers(['SLS'], '2026-10-20')).map(member => member.fullName), ['Alice']);
    const summary = await getDashboardSummary({ email: 'lead', isLead: true, teams: ['SLS'] }, '2026-01-01', '2026-01-31', undefined, sources);
    assert.deepEqual(summary.teams.map(team => team.boardId), [1]);
    assert.deepEqual(summary.teams[0].memberSummaries.map(member => member.name), ['Alice']);
    assert.equal(summary.teams[0].teamMembers, 1);
  } finally { mock.restoreAll(); serverCache.clear(); }
});
