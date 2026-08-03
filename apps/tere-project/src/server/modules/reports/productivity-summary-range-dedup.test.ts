import assert from 'node:assert/strict';
import test from 'node:test';
import { createSingleFlight } from './productivity-summary-range.ports';
import { generateProductivitySummaryRange } from './productivity-summary-range.service';

test('single flight shares one in-flight call and releases it after settling', async () => {
  let calls = 0;
  let release: (value: string) => void = () => {};
  const fetch = createSingleFlight((key: number) => {
    calls += 1;
    return new Promise<string>(resolve => {
      release = resolve;
    }).then(value => `${key}:${value}`);
  });

  const concurrent = [fetch(1), fetch(1), fetch(1)];
  assert.equal(calls, 1, 'concurrent callers must share one underlying fetch');
  release('a');
  assert.deepEqual(await Promise.all(concurrent), ['1:a', '1:a', '1:a']);

  // Entry is dropped once settled, so a later request re-reads instead of serving stale data.
  const later = fetch(1);
  assert.equal(calls, 2);
  release('b');
  assert.equal(await later, '1:b');
});

test('single flight does not conflate different keys', async () => {
  const seen: number[] = [];
  const fetch = createSingleFlight(async (key: number) => {
    seen.push(key);
    return key * 2;
  });
  assert.deepEqual(await Promise.all([fetch(1), fetch(2)]), [2, 4]);
  assert.deepEqual(seen.sort(), [1, 2]);
});

test('single flight clears the entry when the underlying call rejects', async () => {
  let calls = 0;
  const fetch = createSingleFlight(async (key: number) => {
    calls += 1;
    throw new Error(`boom ${key}`);
  });
  await assert.rejects(fetch(1), /boom 1/);
  await assert.rejects(fetch(1), /boom 1/);
  assert.equal(calls, 2, 'a failed fetch must not be pinned in the map');
});

test('per-month bug calls run concurrently instead of chained', async () => {
  let active = 0;
  let peak = 0;
  const bugCall = async () => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active -= 1;
    return 1;
  };

  await generateProductivitySummaryRange(
    { months: ['2026-01'], selectedGroups: ['User'], metricBasis: 'SP' },
    {
      loadMonth: async () => ({
        source: 'archive',
        archiveBacked: true,
        availability: { productivity: true },
        members: [],
        appliedRules: [],
        failures: [],
      }),
      loadBugRaisedCount: bugCall,
      loadBugDoneCount: bugCall,
    },
  );

  assert.equal(peak, 2, 'raised/done must be in flight together');
});
