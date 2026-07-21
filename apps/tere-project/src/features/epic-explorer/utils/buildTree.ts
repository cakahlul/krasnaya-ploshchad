import type { ExplorerDescendant } from '../types/epic-explorer.types';

export interface TreeNode extends ExplorerDescendant {
  children?: TreeNode[];
}

/**
 * Build a descendant tree from a flat list using `parentKey` (SLS-16806).
 * A node is a root when its parentKey is null, equals the epic key, or points
 * to a key not present in the list (orphan — surfaced rather than dropped).
 * Cycles are broken: a node already attached is never attached twice, so a
 * malformed parent chain cannot infinite-loop or duplicate rows.
 */
export function buildTree(
  descendants: ExplorerDescendant[],
  epicKey: string,
): TreeNode[] {
  const byKey = new Map<string, TreeNode>();
  for (const d of descendants) byKey.set(d.key, { ...d });

  const roots: TreeNode[] = [];
  const attached = new Set<string>();

  for (const d of descendants) {
    const node = byKey.get(d.key)!;
    const parent =
      d.parentKey && d.parentKey !== epicKey ? byKey.get(d.parentKey) : undefined;

    if (parent && parent.key !== node.key && !attached.has(node.key)) {
      (parent.children ??= []).push(node);
      attached.add(node.key);
    } else if (!attached.has(node.key)) {
      roots.push(node);
      attached.add(node.key);
    }
  }

  return roots;
}
