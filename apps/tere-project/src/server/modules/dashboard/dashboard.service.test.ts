import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDashboardBoardIdsForMember,
  restrictDashboardSummaryToMember,
  toDashboardMemberSummary,
} from './dashboard.service';

const boards = [
  { boardId: 1, shortName: 'LOAN', isBugMonitoring: false },
  { boardId: 2, shortName: 'USER', isBugMonitoring: false },
  { boardId: 3, shortName: 'BUGS', isBugMonitoring: true },
];

test('dashboard access limits members to their assigned boards', () => {
  assert.deepEqual(
    getDashboardBoardIdsForMember({ isLead: false, teams: ['loan'] }, boards),
    [1],
  );
  assert.deepEqual(
    getDashboardBoardIdsForMember({ isLead: false, teams: [] }, boards),
    [],
  );
});

test('dashboard access still limits leads to assigned boards', () => {
  assert.deepEqual(
    getDashboardBoardIdsForMember({ isLead: true, teams: ['USER'] }, boards),
    [2],
  );
});

test('dashboard member summary exposes the SP productivity rate used by Team Report', () => {
  const summary = toDashboardMemberSummary({
    member: 'Arijona Purba',
    wpProductivity: '146.67%',
    productivityRate: '154.17%',
    totalWeightPoints: 66,
    targetWeightPoints: 45,
    spTotal: 123.33,
  });

  assert.equal(summary.productivityRate, '154.17%');
  assert.equal(summary.wpProductivity, '146.67%');
});

test('non-lead dashboard data excludes teammates and team aggregates', () => {
  const summary = restrictDashboardSummaryToMember({
    generatedAt: '2026-09-22T00:00:00.000Z',
    teams: [{
      teamName: 'Loans', boardId: 1, sprintName: 'Sprint 1', sprintState: 'active', sprintStartDate: null, sprintEndDate: null,
      averageProductivity: '120%', averageWpPerHour: 3, teamMembers: 2,
      memberSummaries: [
        { name: 'Dev One', wpProductivity: '100%', productivityRate: '100%', totalWeightPoints: 10, targetWeightPoints: 10, spTotal: 8 },
        { name: 'Dev Two', wpProductivity: '200%', productivityRate: '200%', totalWeightPoints: 20, targetWeightPoints: 10, spTotal: 16 },
      ],
      totalEpics: 2, isStoryGrouping: false, productPercentage: '50%', techDebtPercentage: '50%', totalWorkingDays: 10,
      totalWorkItems: 12, closedWorkItems: 8, averageHoursOpen: 24,
    }],
  }, 'dev one');

  assert.deepEqual(summary.teams[0].memberSummaries.map(member => member.name), ['Dev One']);
  assert.equal(summary.teams[0].averageProductivity, null);
  assert.equal(summary.teams[0].totalWorkItems, 0);
});
