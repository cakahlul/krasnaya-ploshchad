import type { ExplorerDescendant } from '../types/epic-explorer.types';

/**
 * Pure client-side filter + sort over the already-fetched `descendants[]`
 * (SLS-16895, FR-07). Never re-requests, never touches roll-up metrics — the
 * summary/authz counts stay bound to the FULL authorized array upstream; this
 * only narrows/orders what the tree renders.
 *
 * Consumes two BE-owned fields (SLS-16893, added to `ExplorerDescendant` in
 * parallel): `sprint: string | null` and `updatedAt: string` (ISO 8601).
 */

/** Sentinel filter value for descendants with no active sprint (sprint === null). */
export const NO_SPRINT = '__no_sprint__';

export type ScopeFilter = 'all' | 'direct' | 'subtask';
export type SortKey = 'status' | 'assignee' | 'key' | 'wp' | 'sp' | 'updated';
export type SortDir = 'asc' | 'desc';

export interface DescendantFilters {
  /** Jira status category name, or null = any. */
  statusCategory: string | null;
  /** Issue type name, or null = any. */
  issueType: string | null;
  /** Assignee display name (matched against `assignee`), or null = any. */
  assignee: string | null;
  /** Sprint name, `NO_SPRINT` for the no-sprint bucket, or null = any. */
  sprint: string | null;
  /** direct = child of the epic; subtask = nested under another descendant. */
  scope: ScopeFilter;
  /** Case-insensitive substring over key + summary. */
  search: string;
}

export interface SortSpec {
  key: SortKey;
  dir: SortDir;
}

export const DEFAULT_FILTERS: DescendantFilters = {
  statusCategory: null,
  issueType: null,
  assignee: null,
  sprint: null,
  scope: 'all',
  search: '',
};

export const DEFAULT_SORT: SortSpec = { key: 'key', dir: 'asc' };

const STATUS_RANK: Record<string, number> = { 'to do': 0, 'in progress': 1, done: 2 };

/** ms since epoch, or -Infinity (treated as oldest) when unparseable — FR-07. */
function updatedMs(d: ExplorerDescendant): number {
  const t = Date.parse(d.updatedAt);
  return Number.isNaN(t) ? -Infinity : t;
}

function matches(d: ExplorerDescendant, f: DescendantFilters, epicKey: string): boolean {
  if (f.statusCategory && d.statusCategory !== f.statusCategory) return false;
  if (f.issueType && d.issueType !== f.issueType) return false;
  if (f.assignee && d.assignee !== f.assignee) return false;
  if (f.sprint) {
    if (f.sprint === NO_SPRINT) {
      if (d.sprint !== null) return false;
    } else if (d.sprint !== f.sprint) {
      return false;
    }
  }
  if (f.scope === 'direct' && d.parentKey !== epicKey) return false;
  if (f.scope === 'subtask' && d.parentKey === epicKey) return false;
  const q = f.search.trim().toLowerCase();
  if (q && !d.key.toLowerCase().includes(q) && !d.summary.toLowerCase().includes(q)) return false;
  return true;
}

function compare(a: ExplorerDescendant, b: ExplorerDescendant, sort: SortSpec): number {
  const dir = sort.dir === 'desc' ? -1 : 1;
  switch (sort.key) {
    case 'status': {
      const ra = STATUS_RANK[(a.statusCategory || '').toLowerCase()] ?? 99;
      const rb = STATUS_RANK[(b.statusCategory || '').toLowerCase()] ?? 99;
      return (ra - rb || a.status.localeCompare(b.status)) * dir;
    }
    case 'assignee': {
      // null assignee always sinks last, regardless of direction.
      if (a.assignee === null && b.assignee === null) return 0;
      if (a.assignee === null) return 1;
      if (b.assignee === null) return -1;
      return a.assignee.localeCompare(b.assignee) * dir;
    }
    case 'key':
      return a.key.localeCompare(b.key, undefined, { numeric: true }) * dir;
    case 'wp':
      return (a.weightPoint - b.weightPoint) * dir;
    case 'sp': {
      // null SP always sinks last, regardless of direction (FR-07).
      if (a.storyPoint === null && b.storyPoint === null) return 0;
      if (a.storyPoint === null) return 1;
      if (b.storyPoint === null) return -1;
      return (a.storyPoint - b.storyPoint) * dir;
    }
    case 'updated':
      return (updatedMs(a) - updatedMs(b)) * dir;
    default:
      return 0;
  }
}

/**
 * Filter then sort. Returns a NEW array — the input `descendants` (the full
 * authorized set the summary/authz note are bound to) is never mutated.
 */
export function filterSortDescendants(
  descendants: ExplorerDescendant[],
  filters: DescendantFilters,
  sort: SortSpec,
  epicKey: string,
): ExplorerDescendant[] {
  return descendants.filter(d => matches(d, filters, epicKey)).sort((a, b) => compare(a, b, sort));
}

export interface FilterOptions {
  statusCategories: string[];
  issueTypes: string[];
  assignees: string[];
  /** Sprint names present; `hasNoSprint` true when any descendant has sprint === null. */
  sprints: string[];
  hasNoSprint: boolean;
}

/** Distinct filter option values derived from the full descendant set. */
export function deriveFilterOptions(descendants: ExplorerDescendant[]): FilterOptions {
  const statusCategories = new Set<string>();
  const issueTypes = new Set<string>();
  const assignees = new Set<string>();
  const sprints = new Set<string>();
  let hasNoSprint = false;

  for (const d of descendants) {
    if (d.statusCategory) statusCategories.add(d.statusCategory);
    if (d.issueType) issueTypes.add(d.issueType);
    if (d.assignee) assignees.add(d.assignee);
    if (d.sprint === null) hasNoSprint = true;
    else if (d.sprint) sprints.add(d.sprint);
  }

  const sorted = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
  return {
    statusCategories: sorted(statusCategories),
    issueTypes: sorted(issueTypes),
    assignees: sorted(assignees),
    sprints: sorted(sprints),
    hasNoSprint,
  };
}
