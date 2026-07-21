import assert from 'node:assert';
import { flattenTree } from './flattenTree';
import type { TreeNode } from './buildTree';

// Minimal node factory — children + issueType are the only fields flattenTree reads.
function node(
  key: string,
  opts: { children?: TreeNode[]; issueType?: string } = {},
): TreeNode {
  return {
    key,
    summary: key,
    issueType: opts.issueType ?? 'Story',
    status: 'To Do',
    statusCategory: 'To Do',
    assignee: null,
    assigneeAccountId: null,
    parentKey: null,
    appendixLevel: null,
    category: 'product',
    weightPoint: 0,
    isMeeting: false,
    storyPoint: null,
    spMeeting: 0,
    isDefect: false,
    missingMetricData: false,
    sprint: null,
    updatedAt: '',
    children: opts.children,
  };
}

// empty roots -> []
{
  assert.deepEqual(flattenTree([], new Set()), [], 'empty roots yield no rows');
}

// single level, no expansion: roots at depth 0, leaves, not expanded
{
  const rows = flattenTree([node('A'), node('B')], new Set());
  assert.equal(rows.length, 2, 'two root rows');
  assert.deepEqual(rows.map(r => r.node.key), ['A', 'B'], 'source order kept');
  assert.ok(rows.every(r => r.depth === 0), 'roots at depth 0');
  assert.ok(rows.every(r => !r.hasChildren), 'leaves have no children');
  assert.ok(rows.every(r => !r.isExpanded), 'nothing expanded');
}

// nested, parent collapsed: children hidden but caret (hasChildren) still shown
{
  const rows = flattenTree([node('P', { children: [node('C')] })], new Set());
  assert.equal(rows.length, 1, 'collapsed subtree omitted');
  assert.equal(rows[0].node.key, 'P');
  assert.equal(rows[0].hasChildren, true, 'caret shown when collapsed');
  assert.equal(rows[0].isExpanded, false);
}

// nested, parent expanded: pre-order, depth values correct, leaf hasChildren=false
{
  const rows = flattenTree(
    [node('P', { children: [node('C1'), node('C2')] }), node('Q')],
    new Set(['P']),
  );
  assert.deepEqual(
    rows.map(r => r.node.key),
    ['P', 'C1', 'C2', 'Q'],
    'children emitted immediately after expanded parent, pre-order',
  );
  assert.deepEqual(rows.map(r => r.depth), [0, 1, 1, 0], 'depth reflects nesting');
  assert.equal(rows[0].hasChildren, true);
  assert.equal(rows[0].isExpanded, true);
  assert.equal(rows[1].hasChildren, false, 'child is a leaf');
}

// deep chain, partial expand: P+C expanded, G collapsed -> L hidden
{
  const rows = flattenTree(
    [
      node('P', {
        children: [
          node('C', { children: [node('G', { children: [node('L')] })] }),
        ],
      }),
    ],
    new Set(['P', 'C']),
  );
  assert.deepEqual(rows.map(r => r.node.key), ['P', 'C', 'G'], 'L omitted (G collapsed)');
  assert.deepEqual(rows.map(r => r.depth), [0, 1, 2], 'depth increments down the chain');
  assert.equal(rows[2].hasChildren, true, 'G has child L though collapsed');
  assert.equal(rows[2].isExpanded, false);
}

// subtask flag derived from issueType
{
  const rows = flattenTree(
    [node('S-1', { children: [node('ST-1', { issueType: 'Sub-task' })] })],
    new Set(['S-1']),
  );
  assert.equal(rows[0].isSubtask, false, 'Story is not a subtask');
  assert.equal(rows[1].isSubtask, true, 'Sub-task flagged');
}

console.log('flattenTree.test.ts OK');
