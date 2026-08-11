import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDashboardBoardIdsForMember,
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

test('dashboard access leaves leads unrestricted', () => {
  assert.equal(
    getDashboardBoardIdsForMember({ isLead: true, teams: [] }, boards),
    undefined,
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
