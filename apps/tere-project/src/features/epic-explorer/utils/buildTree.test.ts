import assert from 'node:assert';
import { buildTree } from './buildTree';
import type { ExplorerDescendant } from '../types/epic-explorer.types';

// Minimal descendant factory — only fields buildTree reads matter.
function d(key: string, parentKey: string | null): ExplorerDescendant {
  return {
    key,
    parentKey,
    summary: key,
    issueType: 'Story',
    status: 'To Do',
    statusCategory: 'To Do',
    assignee: null,
    assigneeAccountId: null,
    appendixLevel: null,
    category: 'product',
    weightPoint: 0,
    isMeeting: false,
    storyPoint: null,
    spMeeting: 0,
    isDefect: false,
    missingMetricData: false,
  };
}

// direct child (parentKey === epic) and null-parent are both roots
{
  const roots = buildTree([d('S-1', 'EPIC-1'), d('S-2', null)], 'EPIC-1');
  assert.equal(roots.length, 2, 'both top-level items are roots');
  assert.ok(roots.every(r => !r.children), 'no children yet');
}

// nesting under a sibling descendant
{
  const roots = buildTree([d('S-1', 'EPIC-1'), d('T-1', 'S-1')], 'EPIC-1');
  assert.equal(roots.length, 1, 'one root');
  assert.equal(roots[0].key, 'S-1');
  assert.equal(roots[0].children?.length, 1, 'T-1 nested under S-1');
  assert.equal(roots[0].children?.[0].key, 'T-1');
}

// orphan (parent not in list) surfaces as a root, not dropped
{
  const roots = buildTree([d('T-9', 'GHOST-1')], 'EPIC-1');
  assert.equal(roots.length, 1, 'orphan surfaced');
  assert.equal(roots[0].key, 'T-9');
}

// self-referential parent does not duplicate or loop
{
  const roots = buildTree([d('X-1', 'X-1')], 'EPIC-1');
  assert.equal(roots.length, 1, 'self-parent becomes a root, once');
}

console.log('buildTree.test.ts OK');
