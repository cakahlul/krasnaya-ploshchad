'use client';

import { useMemo } from 'react';
import { useExplorerStore } from '../store/explorerStore';
import { useEpicList } from '../hooks/useEpicExplorer';
import { errorStatus } from '../api/explorerError';
import { FrSelect } from './FrSelect';

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
    <div className="filter-bar__group" style={{ fontFamily: sans }}>
      <label className="filter-bar__label">
        <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
          <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z" />
        </svg>
        Epic
      </label>
      <FrSelect
        aria-label="Search and select epic"
        placeholder={disabled ? 'Select a project first' : 'Search epic by key or name'}
        disabled={disabled}
        loading={isLoading}
        value={epicKey ?? undefined}
        onChange={val => setEpicKey(val)}
        options={options}
        minWidth={340}
        showSearch
        allowClear
        notFoundContent="No epics found"
      />
      {listError && (
        <span role="status" aria-live="polite" style={{ fontSize: 11.5, color: '#ef4444' }}>
          {listError}
        </span>
      )}
    </div>
  );
}
