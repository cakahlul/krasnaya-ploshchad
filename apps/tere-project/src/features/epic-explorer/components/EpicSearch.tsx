'use client';

import { useMemo } from 'react';
import { Select } from 'antd';
import { useExplorerStore } from '../store/explorerStore';
import { useEpicList } from '../hooks/useEpicExplorer';
import { errorStatus } from '../api/explorerError';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

/**
 * Epic search/select (SLS-16800). The epic list is pre-fetched once per
 * project (useEpicList); options are derived with useMemo and filtered
 * CLIENT-SIDE by antd's built-in search (optionFilterProp) — no per-keystroke
 * network call, no setState-during-render.
 */
export default function EpicSearch() {
  const project = useExplorerStore(s => s.project);
  const epicKey = useExplorerStore(s => s.epicKey);
  const setEpicKey = useExplorerStore(s => s.setEpicKey);

  const { data, isLoading, isError, error } = useEpicList(project);

  const options = useMemo(
    () =>
      (data ?? []).map(e => ({
        value: e.key,
        // label is what antd searches on; include key + summary + status
        label: `${e.key} · ${e.summary} — ${e.status}`,
      })),
    [data],
  );

  const disabled = !project;

  let listError: string | null = null;
  if (isError) {
    const status = errorStatus(error);
    listError =
      status === 401
        ? 'Session expired — please sign in again.'
        : status === 403
          ? 'You do not have access to this project.'
          : status === 400
            ? 'Invalid project.'
            : 'Could not load epics. Please try again.';
  }

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: sans }}>
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Epic</span>
      <Select
        aria-label="Search and select epic"
        placeholder={disabled ? 'Select a project first' : 'Search epic by key or name'}
        disabled={disabled}
        loading={isLoading}
        value={epicKey ?? undefined}
        onChange={val => setEpicKey(val ?? null)}
        options={options}
        style={{ minWidth: 340 }}
        showSearch
        optionFilterProp="label"
        notFoundContent={isLoading ? 'Loading…' : 'No epics found'}
      />
      {listError && (
        <span role="status" aria-live="polite" style={{ fontSize: 11.5, color: '#ef4444' }}>
          {listError}
        </span>
      )}
    </label>
  );
}
