import type { TreeNode } from './buildTree';

/** One visible row of the flattened hierarchy (SLS-16901). */
export interface FlatRow {
  /** Underlying tree node from buildTree. */
  node: TreeNode;
  /** Indent level; epic's direct children (roots) start at 0. */
  depth: number;
  /** Node has >=1 child — render an expand caret even when collapsed. */
  hasChildren: boolean;
  /** Whether this node is currently expanded (key ∈ expandedKeys). */
  isExpanded: boolean;
  /** Subtask vs parent/child distinction (for indent/label). */
  isSubtask: boolean;
}

/**
 * Flatten a descendant tree (buildTree output) into the visible pre-order row
 * list an antd virtual Table windows over — virtual mode has no nested-children
 * tree, so we flatten to only the currently-visible rows ourselves.
 *
 * Pre-order DFS: a node's children are emitted immediately after it and ONLY
 * when its key ∈ `expandedKeys` (collapsed subtrees omitted). `hasChildren`
 * reflects the real tree (caret shown even when collapsed). Child order is
 * whatever buildTree already produced — not re-sorted. No cycle guard:
 * buildTree guarantees each node appears once.
 */
export function flattenTree(
  roots: TreeNode[],
  expandedKeys: Set<string>,
): FlatRow[] {
  const rows: FlatRow[] = [];

  const walk = (nodes: TreeNode[], depth: number): void => {
    for (const node of nodes) {
      const hasChildren = !!node.children && node.children.length > 0;
      const isExpanded = expandedKeys.has(node.key);
      rows.push({
        node,
        depth,
        hasChildren,
        isExpanded,
        isSubtask: node.issueType === 'Sub-task',
      });
      if (hasChildren && isExpanded) walk(node.children!, depth + 1);
    }
  };

  walk(roots, 0);
  return rows;
}
