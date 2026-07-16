'use client';

import type { TableColumnsType } from 'antd';
import ConfigAuditLogPanel from './ConfigAuditLogPanel';
import { snapshot, type ConfigAuditEntry } from './ConfigAuditLogPanel.api';
import { WEIGHT_KEYS, type WPWeightConfig } from './WpWeightConfigPanel.api';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";

const snapshotColumns: TableColumnsType<ConfigAuditEntry<WPWeightConfig>> = [
  {
    title: 'Effective date',
    width: 150,
    render: (_: unknown, entry) => (
      <span style={{ fontFamily: mono }}>
        {snapshot(entry)?.effective_date ?? '—'}
      </span>
    ),
  },
  ...WEIGHT_KEYS.map(key => ({
    title: key,
    width: 115,
    render: (_: unknown, entry: ConfigAuditEntry<WPWeightConfig>) => (
      <span style={{ fontFamily: mono }}>
        {snapshot(entry)?.weights[key] ?? '—'}
      </span>
    ),
  })),
];

export default function WpWeightAuditLogPanel() {
  return (
    <ConfigAuditLogPanel<WPWeightConfig>
      entityType="wp-weight-config"
      label="WP Weight"
      snapshotColumns={snapshotColumns}
    />
  );
}
