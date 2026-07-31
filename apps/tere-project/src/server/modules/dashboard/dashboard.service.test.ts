import assert from 'node:assert/strict';
import test from 'node:test';
import { toDashboardMemberSummary } from './dashboard.service';

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
