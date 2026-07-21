'use client';

import { useMemo } from 'react';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
import { useExplorerStore } from '../store/explorerStore';
import { FrSelect } from './FrSelect';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

/**
 * Project picker (SLS-16800). Sources project keys from the boards list
 * (Jira project key = board.shortName), excluding bug-monitoring boards.
 * Selecting a project clears the epic selection (store handles that).
 */
export default function ProjectSelect() {
  const { boards, isLoading } = useBoards();
  const project = useExplorerStore(s => s.project);
  const setProject = useExplorerStore(s => s.setProject);

  const options = useMemo(() => {
    const seen = new Set<string>();
    return boards
      .filter(b => !b.isBugMonitoring && b.shortName)
      .filter(b => {
        const k = b.shortName.toUpperCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map(b => ({ value: b.shortName, label: `${b.name} (${b.shortName})` }));
  }, [boards]);

  return (
    <div className="filter-bar__group" style={{ fontFamily: sans }}>
      <label className="filter-bar__label">
        <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
          <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zM6 6.75A.75.75 0 016.75 6h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 016 6.75zm.75 3.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
        </svg>
        Project
      </label>
      <FrSelect
        aria-label="Select project"
        placeholder="Select a project"
        loading={isLoading}
        value={project ?? undefined}
        onChange={val => setProject(val)}
        options={options}
        minWidth={240}
        showSearch
        allowClear
        notFoundContent="No projects found"
      />
    </div>
  );
}
