import assert from 'node:assert';
import test from 'node:test';
import type { ExplorerDescendant } from '../types/epic-explorer.types';
import {
  filterSortDescendants,
  deriveFilterOptions,
  NO_SPRINT,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  type DescendantFilters,
} from './filterSort';

// Minimal descendant factory. `sprint`/`updatedAt` are the BE-owned FR-07 fields
// (SLS-16893); constructed here as fixtures — not a redefinition of the contract.
function d(over: Partial<ExplorerDescendant> = {}): ExplorerDescendant {
  return {
    key: 'SLS-1',
    summary: 'summary',
    issueType: 'Story',
    status: 'To Do',
    statusCategory: 'To Do',
    assignee: null,
    assigneeAccountId: null,
    parentKey: 'EPIC-1',
    appendixLevel: null,
    category: 'product',
    weightPoint: 0,
    isMeeting: false,
    storyPoint: null,
    spMeeting: 0,
    isDefect: false,
    missingMetricData: false,
    sprint: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  } as ExplorerDescendant;
}

const f = (over: Partial<DescendantFilters> = {}): DescendantFilters => ({ ...DEFAULT_FILTERS, ...over });

test('No Sprint filter matches only sprint === null', () => {
  const list = [
    d({ key: 'A', sprint: null }),
    d({ key: 'B', sprint: 'Sprint 12' }),
    d({ key: 'C', sprint: null }),
  ];
  const out = filterSortDescendants(list, f({ sprint: NO_SPRINT }), DEFAULT_SORT, 'EPIC-1');
  assert.deepEqual(out.map(x => x.key), ['A', 'C']);
});

test('named sprint filter matches that sprint only', () => {
  const list = [d({ key: 'A', sprint: null }), d({ key: 'B', sprint: 'Sprint 12' })];
  const out = filterSortDescendants(list, f({ sprint: 'Sprint 12' }), DEFAULT_SORT, 'EPIC-1');
  assert.deepEqual(out.map(x => x.key), ['B']);
});

test('scope direct vs subtask splits on parentKey === epicKey', () => {
  const list = [d({ key: 'A', parentKey: 'EPIC-1' }), d({ key: 'B', parentKey: 'A' })];
  assert.deepEqual(
    filterSortDescendants(list, f({ scope: 'direct' }), DEFAULT_SORT, 'EPIC-1').map(x => x.key),
    ['A'],
  );
  assert.deepEqual(
    filterSortDescendants(list, f({ scope: 'subtask' }), DEFAULT_SORT, 'EPIC-1').map(x => x.key),
    ['B'],
  );
});

test('text search matches key or summary, case-insensitive', () => {
  const list = [d({ key: 'SLS-1', summary: 'Login flow' }), d({ key: 'SLS-2', summary: 'Payment' })];
  assert.deepEqual(
    filterSortDescendants(list, f({ search: 'login' }), DEFAULT_SORT, 'EPIC-1').map(x => x.key),
    ['SLS-1'],
  );
  assert.deepEqual(
    filterSortDescendants(list, f({ search: 'sls-2' }), DEFAULT_SORT, 'EPIC-1').map(x => x.key),
    ['SLS-2'],
  );
});

test('SP sort places null last in both directions', () => {
  const list = [d({ key: 'A', storyPoint: 3 }), d({ key: 'B', storyPoint: null }), d({ key: 'C', storyPoint: 1 })];
  assert.deepEqual(
    filterSortDescendants(list, DEFAULT_FILTERS, { key: 'sp', dir: 'asc' }, 'EPIC-1').map(x => x.key),
    ['C', 'A', 'B'],
  );
  assert.deepEqual(
    filterSortDescendants(list, DEFAULT_FILTERS, { key: 'sp', dir: 'desc' }, 'EPIC-1').map(x => x.key),
    ['A', 'C', 'B'],
  );
});

test('updated sort treats unparseable updatedAt as oldest', () => {
  const list = [
    d({ key: 'A', updatedAt: '2026-05-01T00:00:00.000Z' }),
    d({ key: 'B', updatedAt: 'not-a-date' }),
    d({ key: 'C', updatedAt: '2026-06-01T00:00:00.000Z' }),
  ];
  // asc → oldest first; unparseable (B) is oldest.
  assert.deepEqual(
    filterSortDescendants(list, DEFAULT_FILTERS, { key: 'updated', dir: 'asc' }, 'EPIC-1').map(x => x.key),
    ['B', 'A', 'C'],
  );
});

test('key sort is numeric-aware', () => {
  const list = [d({ key: 'SLS-10' }), d({ key: 'SLS-2' }), d({ key: 'SLS-1' })];
  assert.deepEqual(
    filterSortDescendants(list, DEFAULT_FILTERS, { key: 'key', dir: 'asc' }, 'EPIC-1').map(x => x.key),
    ['SLS-1', 'SLS-2', 'SLS-10'],
  );
});

test('INVARIANT: filtering never mutates or shrinks the source array (summary stays whole)', () => {
  const source = [
    d({ key: 'A', statusCategory: 'Done' }),
    d({ key: 'B', statusCategory: 'To Do' }),
    d({ key: 'C', statusCategory: 'Done' }),
  ];
  const sumBefore = source.length;
  const filtered = filterSortDescendants(source, f({ statusCategory: 'Done' }), DEFAULT_SORT, 'EPIC-1');
  // filtered result is a strict subset...
  assert.equal(filtered.length, 2, 'showing 2');
  // ...but the source (what the roll-up summary is bound to) is untouched.
  assert.equal(source.length, sumBefore, 'source length unchanged');
  assert.notEqual(filtered.length, source.length, 'filter count != summary count');
  assert.deepEqual(source.map(x => x.key), ['A', 'B', 'C'], 'source order/contents intact');
});

test('deriveFilterOptions: distinct, sorted, flags No Sprint', () => {
  const opts = deriveFilterOptions([
    d({ issueType: 'Story', assignee: 'Zoe', sprint: 'Sprint 2' }),
    d({ issueType: 'Bug', assignee: 'Ann', sprint: null }),
    d({ issueType: 'Story', assignee: 'Ann', sprint: 'Sprint 1' }),
  ]);
  assert.deepEqual(opts.issueTypes, ['Bug', 'Story']);
  assert.deepEqual(opts.assignees, ['Ann', 'Zoe']);
  assert.deepEqual(opts.sprints, ['Sprint 1', 'Sprint 2']);
  assert.equal(opts.hasNoSprint, true);
});
