'use client';

import type { TableColumnsType } from 'antd';
import ConfigAuditLogPanel from './ConfigAuditLogPanel';
import { snapshot, type ConfigAuditEntry } from './ConfigAuditLogPanel.api';
import type { Holiday } from '@src/features/holiday-management/types/holiday-management.types';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";

const snapshotColumns: TableColumnsType<ConfigAuditEntry<Holiday>> = [
  {
    title: 'Date',
    width: 130,
    render: (_: unknown, entry) => (
      <span style={{ fontFamily: mono }}>
        {snapshot(entry)?.holiday_date ?? '—'}
      </span>
    ),
  },
  {
    title: 'Name',
    width: 220,
    render: (_: unknown, entry) => snapshot(entry)?.holiday_name ?? '—',
  },
  {
    title: 'National holiday',
    width: 150,
    render: (_: unknown, entry) =>
      snapshot(entry)?.is_national_holiday ? 'Yes' : 'No',
  },
];

export default function HolidayAuditLogPanel() {
  return (
    <ConfigAuditLogPanel<Holiday>
      entityType="holiday"
      label="Holiday"
      snapshotColumns={snapshotColumns}
    />
  );
}
