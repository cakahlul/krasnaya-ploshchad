/**
 * Deep-link param mapping for Epic Explorer (SLS-16894 / FR-10). Pure funcs so
 * the URL⇄state sync in `useExplorerUrlSync` stays free of framework glue and
 * is unit-testable. URL carries `project` + `epicKey`; the Zustand store is the
 * source of truth and the URL merely mirrors it.
 */
export type ExplorerSelection = {
  project: string | null;
  epicKey: string | null;
};

// Minimal shape shared by URLSearchParams and Next's ReadonlyURLSearchParams.
type ReadableParams = { get(name: string): string | null };

/** Read a selection from URL params. Empty/absent values normalise to null. */
export function readSelection(params: ReadableParams): ExplorerSelection {
  return {
    project: params.get('project') || null,
    epicKey: params.get('epicKey') || null,
  };
}

/**
 * Serialise a selection to a query string. `epicKey` is only emitted alongside
 * a `project` — a lone epicKey is meaningless (store clears epicKey on project
 * change), so we never mirror one to the URL.
 */
export function toQueryString(sel: ExplorerSelection): string {
  const p = new URLSearchParams();
  if (sel.project) {
    p.set('project', sel.project);
    if (sel.epicKey) p.set('epicKey', sel.epicKey);
  }
  return p.toString();
}

/** Value-equality guard so the sync effect only writes the URL on real change. */
export function selectionEquals(a: ExplorerSelection, b: ExplorerSelection): boolean {
  return a.project === b.project && a.epicKey === b.epicKey;
}
