'use client';

import { useMemo } from 'react';
import type { TableColumnsType } from 'antd';
import ConfigAuditLogPanel from './ConfigAuditLogPanel';
import { snapshot, useConfigAuditLog, type ConfigAuditEntry } from './ConfigAuditLogPanel.api';
import type { TargetWpConfig } from './TargetWpConfigPanel.api';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";

export default function TargetWpAuditLogPanel() {
  // Rate keys are dynamic (from API, not hardcoded) — reads the same cached
  // query ConfigAuditLogPanel below fetches (same queryKey), no extra request.
  const { data } = useConfigAuditLog<TargetWpConfig>('target-wp-config');
  const rateKeys = useMemo(() => {
    const keys = new Set<string>();
    data?.pages.forEach(page =>
      page.items.forEach(entry => {
        const value = snapshot(entry);
        if (value) Object.keys(value.rates).forEach(key => keys.add(key));
      }),
    );
    return Array.from(keys).sort();
  }, [data]);

  const snapshotColumns: TableColumnsType<ConfigAuditEntry<TargetWpConfig>> = [
    {
      title: 'Effective date',
      width: 150,
      render: (_: unknown, entry) => (
        <span style={{ fontFamily: mono }}>
          {snapshot(entry)?.effective_date ?? '—'}
        </span>
      ),
    },
    ...rateKeys.map(key => ({
      title: key,
      width: 130,
      render: (_: unknown, entry: ConfigAuditEntry<TargetWpConfig>) => (
        <span style={{ fontFamily: mono }}>
          {snapshot(entry)?.rates[key] ?? '—'}
        </span>
      ),
    })),
  ];

  return (
    <ConfigAuditLogPanel<TargetWpConfig>
      entityType="target-wp-config"
      label="Target WP"
      snapshotColumns={snapshotColumns}
    />
  );
}
