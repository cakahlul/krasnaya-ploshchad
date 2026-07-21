'use client';

import { useMemo } from 'react';
import { Input, Select } from 'antd';
import type { ExplorerDescendant } from '../types/epic-explorer.types';
import {
  deriveFilterOptions,
  NO_SPRINT,
  type DescendantFilters,
  type SortSpec,
  type SortKey,
} from '../utils/filterSort';

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
    <label data-qa={qa} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: sans }}>
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>{label}</span>
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
    <div
      role="group"
      aria-label="Filter and sort child issues"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}
    >
      <Field label="Search" qa="explorer-filter-search">
        <Input.Search
          aria-label="Search by key or summary"
          allowClear
          placeholder="Key or summary"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          style={{ width: 220 }}
        />
      </Field>

      <Field label="Status" qa="explorer-filter-status">
        <Select
          aria-label="Filter by status category"
          allowClear
          placeholder="All statuses"
          value={filters.statusCategory ?? undefined}
          onChange={v => set('statusCategory', v ?? null)}
          options={opts.statusCategories.map(s => ({ value: s, label: s }))}
          style={{ minWidth: 150 }}
        />
      </Field>

      <Field label="Type" qa="explorer-filter-type">
        <Select
          aria-label="Filter by issue type"
          allowClear
          placeholder="All types"
          value={filters.issueType ?? undefined}
          onChange={v => set('issueType', v ?? null)}
          options={opts.issueTypes.map(s => ({ value: s, label: s }))}
          style={{ minWidth: 130 }}
        />
      </Field>

      <Field label="Assignee" qa="explorer-filter-assignee">
        <Select
          aria-label="Filter by assignee"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Anyone"
          value={filters.assignee ?? undefined}
          onChange={v => set('assignee', v ?? null)}
          options={opts.assignees.map(s => ({ value: s, label: s }))}
          style={{ minWidth: 160 }}
        />
      </Field>

      <Field label="Sprint" qa="explorer-filter-sprint">
        <Select
          aria-label="Filter by sprint"
          allowClear
          placeholder="All sprints"
          value={filters.sprint ?? undefined}
          onChange={v => set('sprint', v ?? null)}
          options={sprintOptions}
          style={{ minWidth: 150 }}
        />
      </Field>

      <Field label="Level" qa="explorer-filter-scope">
        <Select
          aria-label="Filter by hierarchy level"
          value={filters.scope}
          onChange={v => set('scope', v)}
          options={[
            { value: 'all', label: 'All levels' },
            { value: 'direct', label: 'Direct children' },
            { value: 'subtask', label: 'Subtasks' },
          ]}
          style={{ minWidth: 150 }}
        />
      </Field>

      <Field label="Sort by" qa="explorer-sort">
        <div style={{ display: 'flex', gap: 6 }}>
          <Select
            aria-label="Sort field"
            value={sort.key}
            onChange={v => onSortChange({ ...sort, key: v })}
            options={(Object.keys(SORT_LABELS) as SortKey[]).map(k => ({ value: k, label: SORT_LABELS[k] }))}
            style={{ minWidth: 150 }}
          />
          <Select
            aria-label="Sort direction"
            value={sort.dir}
            onChange={v => onSortChange({ ...sort, dir: v })}
            options={[
              { value: 'asc', label: 'Asc ↑' },
              { value: 'desc', label: 'Desc ↓' },
            ]}
            style={{ minWidth: 100 }}
          />
        </div>
      </Field>
    </div>
  );
}
