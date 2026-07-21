'use client';

import { useMemo } from 'react';
import { Select } from 'antd';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
import { useExplorerStore } from '../store/explorerStore';

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
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: sans }}>
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Project</span>
      <Select
        aria-label="Select project"
        placeholder="Select a project"
        loading={isLoading}
        value={project ?? undefined}
        onChange={val => setProject(val ?? null)}
        options={options}
        style={{ minWidth: 240 }}
        showSearch
        optionFilterProp="label"
      />
    </label>
  );
}
