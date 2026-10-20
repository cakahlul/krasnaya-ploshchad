import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { filterReportForMember } from './report-filter';
import type { GetReportResponseDto } from '@shared/types/report.types';

const report = { issues: [
  { member: 'A', spTotal: 8, workingDays: 1, weightPointsProduct: 4, weightPointsTechDebt: 0, totalWeightPoints: 4 },
  { member: 'B', spTotal: 16, workingDays: 2, weightPointsProduct: 9, weightPointsTechDebt: 0, totalWeightPoints: 9 },
] } as GetReportResponseDto;

test('leads keep all rows, members get personal totals, unresolved callers get none', () => {
  assert.equal(filterReportForMember(report, { email: 'lead', isLead: true }), report);
  for (const caller of [undefined, { email: 'unknown', isLead: false }]) {
    const result = filterReportForMember(report, caller);
    assert.deepEqual(result.issues, []);
    assert.equal(result.totalWeightPoints, 0);
  }
  const personal = filterReportForMember(report, { email: 'a', isLead: false, fullName: 'A' });
  assert.equal(personal.issues.length, 1);
  assert.equal(personal.totalWeightPoints, 4);
});


test('trend endpoint checks lead permission before generating data', () => {
  const route = readFileSync(new URL('../../../app/api/report/sprint-trend/route.ts', import.meta.url), 'utf8');
  const guard = route.indexOf("if (!caller?.isLead) return Response.json({ message: 'Forbidden' }, { status: 403 });");
  assert.ok(guard > 0);
  assert.ok(guard < route.indexOf('await generateSprintTrend('));
});
