import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryCache } from './cache';

test('collapses concurrent misses into a single load', async () => {
  const cache = new MemoryCache(60_000);
  let loads = 0;
  const load = async () => {
    loads++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return 'value';
  };

  const results = await Promise.all(Array.from({ length: 20 }, () => cache.getOrLoad('k', load)));

  assert.equal(loads, 1);
  assert.deepEqual(new Set(results), new Set(['value']));
  assert.equal(cache.get('k'), 'value');
});

test('a failed load is not cached and does not poison later callers', async () => {
  const cache = new MemoryCache(60_000);
  let attempts = 0;
  const load = async () => {
    attempts++;
    if (attempts === 1) throw new Error('boom');
    return 'ok';
  };

  await assert.rejects(cache.getOrLoad('k', load), /boom/);
  assert.equal(await cache.getOrLoad('k', load), 'ok');
  assert.equal(attempts, 2);
});

test('an expired entry reloads', async () => {
  const cache = new MemoryCache(1);
  let loads = 0;
  const load = async () => {
    loads++;
    return loads;
  };

  assert.equal(await cache.getOrLoad('k', load), 1);
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(await cache.getOrLoad('k', load), 2);
});
