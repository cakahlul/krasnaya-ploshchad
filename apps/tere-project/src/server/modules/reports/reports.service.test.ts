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
import { buildSprintTrendPoints, generateReport, summarizeTeamReport } from './reports.service';

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
