import assert from 'node:assert/strict';
import test from 'node:test';
import {
  employmentPeriodFor,
  isMemberActiveDuring,
  isIsoDate,
  monthPeriod,
} from './member-lifecycle.util';

test('uses inclusive employment overlap for a selected period', () => {
  const period = { startDate: '2026-01-05', endDate: '2026-01-16' };
  assert.equal(isMemberActiveDuring({ joinDate: '2026-01-16', resignDate: null }, period), true);
  assert.equal(isMemberActiveDuring({ joinDate: '2026-01-17', resignDate: null }, period), false);
  assert.equal(isMemberActiveDuring({ joinDate: '2025-01-01', resignDate: '2026-01-05' }, period), true);
  assert.equal(isMemberActiveDuring({ joinDate: '2025-01-01', resignDate: '2026-01-04' }, period), false);
});

test('clamps live calculations to the employed portion of a period', () => {
  assert.deepEqual(
    employmentPeriodFor(
      { joinDate: '2026-01-08', resignDate: '2026-01-20' },
      { startDate: '2026-01-05', endDate: '2026-01-30' },
    ),
    { startDate: '2026-01-08', endDate: '2026-01-20' },
  );
  assert.equal(
    employmentPeriodFor(
      { joinDate: '2026-02-01', resignDate: '2026-02-02' },
      { startDate: '2026-01-01', endDate: '2026-01-31' },
    ),
    null,
  );
});

test('calculates real month ends', () => {
  assert.deepEqual(monthPeriod('2026-02'), { startDate: '2026-02-01', endDate: '2026-02-28' });
  assert.deepEqual(monthPeriod('2026-04'), { startDate: '2026-04-01', endDate: '2026-04-30' });
});

test('accepts only real ISO calendar dates', () => {
  assert.equal(isIsoDate('2026-02-28'), true);
  assert.equal(isIsoDate('2026-02-29'), false);
  assert.equal(isIsoDate('2026-2-01'), false);
});
