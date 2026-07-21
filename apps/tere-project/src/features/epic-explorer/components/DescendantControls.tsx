'use client';

import { useMemo } from 'react';
import type { ExplorerDescendant } from '../types/epic-explorer.types';
import {
  deriveFilterOptions,
  NO_SPRINT,
  type DescendantFilters,
  type SortSpec,
  type SortKey,
} from '../utils/filterSort';
import { FrSelect } from './FrSelect';
import '@src/features/dashboard/components/FilterReport.css';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

const SORT_LABELS: Record<SortKey, string> = {
  status: 'Status',
  assignee: 'Assignee',
  key: 'Key',
  wp: 'Weight Points',
  sp: 'Story Points',
  updated: 'Updated date',
};

/** Labelled control wrapper. `data-qa` lands on a queryable DOM element. */
function Field({ label, qa, children }: { label: string; qa: string; children: React.ReactNode }) {
  return (
    <label data-qa={qa} className="filter-bar__group" style={{ fontFamily: sans }}>
      <span className="filter-bar__label">{label}</span>
      {children}
    </label>
  );
}

/**
 * Filter + sort controls over the already-fetched descendants (SLS-16895).
 * Options are derived CLIENT-SIDE from the full authorized set; changing a
 * control only updates local filter/sort state — no network, no metric recompute.
 */
export default function DescendantControls({
  descendants,
  filters,
  sort,
  onFiltersChange,
  onSortChange,
}: {
  descendants: ExplorerDescendant[];
  filters: DescendantFilters;
  sort: SortSpec;
  onFiltersChange: (next: DescendantFilters) => void;
  onSortChange: (next: SortSpec) => void;
}) {
  const opts = useMemo(() => deriveFilterOptions(descendants), [descendants]);

  const set = <K extends keyof DescendantFilters>(k: K, v: DescendantFilters[K]) =>
    onFiltersChange({ ...filters, [k]: v });

  const sprintOptions = [
    ...(opts.hasNoSprint ? [{ value: NO_SPRINT, label: 'No Sprint' }] : []),
    ...opts.sprints.map(s => ({ value: s, label: s })),
  ];

  return (
    <div role="group" aria-label="Filter and sort child issues" className="filter-bar">
      <div className="filter-bar__row">
      <Field label="Search" qa="explorer-filter-search">
        <input
          type="text"
          aria-label="Search by key or summary"
          placeholder="Key or summary"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          className="fr-daterange__input"
          style={{ width: 220, height: 40, borderRadius: 10 }}
        />
      </Field>

      <Field label="Status" qa="explorer-filter-status">
        <FrSelect
          aria-label="Filter by status category"
          allowClear
          placeholder="All statuses"
          value={filters.statusCategory ?? undefined}
          onChange={v => set('statusCategory', v)}
          options={opts.statusCategories.map(s => ({ value: s, label: s }))}
          minWidth={150}
        />
      </Field>

      <Field label="Type" qa="explorer-filter-type">
        <FrSelect
          aria-label="Filter by issue type"
          allowClear
          placeholder="All types"
          value={filters.issueType ?? undefined}
          onChange={v => set('issueType', v)}
          options={opts.issueTypes.map(s => ({ value: s, label: s }))}
          minWidth={140}
        />
      </Field>

      <Field label="Assignee" qa="explorer-filter-assignee">
        <FrSelect
          aria-label="Filter by assignee"
          allowClear
          showSearch
          placeholder="Anyone"
          value={filters.assignee ?? undefined}
          onChange={v => set('assignee', v)}
          options={opts.assignees.map(s => ({ value: s, label: s }))}
          minWidth={160}
          notFoundContent="No assignees"
        />
      </Field>

      <Field label="Sprint" qa="explorer-filter-sprint">
        <FrSelect
          aria-label="Filter by sprint"
          allowClear
          placeholder="All sprints"
          value={filters.sprint ?? undefined}
          onChange={v => set('sprint', v)}
          options={sprintOptions}
          minWidth={150}
        />
      </Field>

      <Field label="Level" qa="explorer-filter-scope">
        <FrSelect
          aria-label="Filter by hierarchy level"
          value={filters.scope}
          onChange={v => set('scope', (v ?? 'all') as DescendantFilters['scope'])}
          options={[
            { value: 'all', label: 'All levels' },
            { value: 'direct', label: 'Direct children' },
            { value: 'subtask', label: 'Subtasks' },
          ]}
          minWidth={150}
        />
      </Field>

      <Field label="Sort by" qa="explorer-sort">
        <div style={{ display: 'flex', gap: 6 }}>
          <FrSelect
            aria-label="Sort field"
            value={sort.key}
            onChange={v => onSortChange({ ...sort, key: (v ?? 'key') as SortKey })}
            options={(Object.keys(SORT_LABELS) as SortKey[]).map(k => ({ value: k, label: SORT_LABELS[k] }))}
            minWidth={150}
          />
          <FrSelect
            aria-label="Sort direction"
            value={sort.dir}
            onChange={v => onSortChange({ ...sort, dir: (v ?? 'asc') as SortSpec['dir'] })}
            options={[
              { value: 'asc', label: 'Asc ↑' },
              { value: 'desc', label: 'Desc ↓' },
            ]}
            minWidth={110}
          />
        </div>
      </Field>
      </div>
    </div>
  );
}
