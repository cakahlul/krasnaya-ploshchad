import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSprintTrendPoints } from './reports.service';

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
