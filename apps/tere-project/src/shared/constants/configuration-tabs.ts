export const CONFIG_TABS = [
  { id: 'holiday', label: 'Holiday' },
  { id: 'wp-weight', label: 'WP Weight Config' },
  { id: 'target-wp', label: 'Target WP Config' },
  { id: 'audit-log', label: 'Audit Log' },
] as const;

export type ConfigTabId = (typeof CONFIG_TABS)[number]['id'];

export const DEFAULT_CONFIG_TAB: ConfigTabId = 'holiday';
