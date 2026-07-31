/**
 * Deep-link param mapping for Epic Explorer (SLS-16894 / FR-10). Pure funcs so
 * the URL⇄state sync in `useExplorerUrlSync` stays free of framework glue and
 * is unit-testable. URL carries `project` + `epicKey`; the Zustand store is the
 * source of truth and the URL merely mirrors it.
 */
export type ExplorerSelection = {
  projects: string[];
  epicKeys: string[];
};

// Minimal shape shared by URLSearchParams and Next's ReadonlyURLSearchParams.
type ReadableParams = { get(name: string): string | null };

/** Read a selection from URL params. Empty/absent values normalise to null. */
export function readSelection(params: ReadableParams): ExplorerSelection {
  return {
    projects: csv(params.get('project')),
    epicKeys: csv(params.get('epicKey')),
  };
}

function csv(value: string | null): string[] {
  return [...new Set((value ?? '').split(',').map(item => item.trim()).filter(Boolean))];
}

/**
 * Serialise a selection to a query string. `epicKey` is only emitted alongside
 * a `project` — a lone epicKey is meaningless (store clears epicKey on project
 * change), so we never mirror one to the URL.
 */
export function toQueryString(sel: ExplorerSelection): string {
  const p = new URLSearchParams();
  if (sel.projects.length > 0) {
    p.set('project', sel.projects.join(','));
    if (sel.epicKeys.length > 0) p.set('epicKey', sel.epicKeys.join(','));
  }
  return p.toString();
}

/** Value-equality guard so the sync effect only writes the URL on real change. */
export function selectionEquals(a: ExplorerSelection, b: ExplorerSelection): boolean {
  return a.projects.join(',') === b.projects.join(',') && a.epicKeys.join(',') === b.epicKeys.join(',');
}
