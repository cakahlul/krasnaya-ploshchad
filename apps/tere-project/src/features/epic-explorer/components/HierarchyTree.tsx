'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMediaQuery } from 'react-responsive';
import { useThemeColors } from '@src/hooks/useTheme';
import type { ExplorerDescendant } from '../types/epic-explorer.types';
import { buildTree, type TreeNode } from '../utils/buildTree';
import { StatusBadge } from './StatusBadge';
import { spOrNA, num } from '../utils/format';
import DescendantDetail from './DescendantDetail';
import DescendantControls from './DescendantControls';
import {
  filterSortDescendants,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  type DescendantFilters,
  type SortSpec,
} from '../utils/filterSort';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

function activate(e: KeyboardEvent, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    fn();
  }
}

/**
 * Descendant hierarchy (SLS-16806). Tree built from `parentKey`. Desktop uses
 * an antd tree Table; mobile falls back to nested cards. Every row/card is
 * keyboard-operable (role="button", tabIndex 0, Enter/Space) and selecting one
 * opens its DescendantDetail.
 */
export default function HierarchyTree({
  descendants,
  epicKey,
}: {
  descendants: ExplorerDescendant[];
  epicKey: string;
}) {
  const c = useThemeColors();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Local-only state (NOT Zustand / URL / query key) — filtering never refetches.
  const [filters, setFilters] = useState<DescendantFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortSpec>(DEFAULT_SORT);

  // Filtered/sorted view of the ALREADY-fetched set. The roll-up summary + authz
  // "N items hidden" note upstream stay bound to the FULL `descendants` and are
  // never fed this array — only the tree render consumes it.
  const filtered = useMemo(
    () => filterSortDescendants(descendants, filters, sort, epicKey),
    [descendants, filters, sort, epicKey],
  );

  const roots = useMemo(() => buildTree(filtered, epicKey), [filtered, epicKey]);
  const selected = useMemo(
    () => descendants.find(d => d.key === selectedKey) ?? null,
    [descendants, selectedKey],
  );

  const columns: ColumnsType<TreeNode> = [
    { title: 'Key', dataIndex: 'key', width: 130 },
    { title: 'Summary', dataIndex: 'summary', ellipsis: true },
    { title: 'Type', dataIndex: 'issueType', width: 110 },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 150,
      render: (_, r) => <StatusBadge status={r.status} category={r.statusCategory} />,
    },
    { title: 'WP', dataIndex: 'weightPoint', width: 70, render: (_, r) => num(r.weightPoint) },
    { title: 'SP', dataIndex: 'storyPoint', width: 70, render: (_, r) => spOrNA(r.storyPoint) },
  ];

  const detail = selected ? (
    <div style={{ marginTop: 16 }}>
      <DescendantDetail item={selected} />
    </div>
  ) : null;

  const controls = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
      <DescendantControls
        descendants={descendants}
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
      />
      {/* Filter-result count — distinct from the roll-up summary, which counts the FULL set. */}
      <span
        data-qa="explorer-filter-count"
        role="status"
        aria-live="polite"
        style={{ fontSize: 12, fontWeight: 600, color: c.subCol, fontFamily: sans }}
      >
        Showing {filtered.length} of {descendants.length}
      </span>
    </div>
  );

  if (isMobile) {
    return (
      <div>
        {controls}
        <MobileCards nodes={roots} depth={0} selectedKey={selectedKey} onSelect={setSelectedKey} />
        {detail}
      </div>
    );
  }

  return (
    <div className="tere-table">
      {controls}
      <Table<TreeNode>
        columns={columns}
        dataSource={roots}
        rowKey="key"
        pagination={false}
        size="small"
        aria-label="Epic child issue hierarchy"
        onRow={record => ({
          role: 'button',
          tabIndex: 0,
          'aria-label': `${record.key}: ${record.summary}. ${record.status}`,
          'aria-pressed': record.key === selectedKey,
          style: {
            cursor: 'pointer',
            background: record.key === selectedKey ? c.headBg : undefined,
          },
          onClick: () => setSelectedKey(record.key),
          onKeyDown: (e: KeyboardEvent) => activate(e, () => setSelectedKey(record.key)),
        })}
      />
      {detail}
    </div>
  );
}

function MobileCards({
  nodes,
  depth,
  selectedKey,
  onSelect,
}: {
  nodes: TreeNode[];
  depth: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const c = useThemeColors();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {nodes.map(node => (
        <div key={node.key}>
          <div
            role="button"
            tabIndex={0}
            aria-label={`${node.key}: ${node.summary}. ${node.status}`}
            aria-pressed={node.key === selectedKey}
            onClick={() => onSelect(node.key)}
            onKeyDown={e => activate(e, () => onSelect(node.key))}
            style={{
              marginLeft: depth * 16,
              background: node.key === selectedKey ? c.headBg : c.cardBg,
              border: `1px solid ${c.cardBrd}`,
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              fontFamily: sans,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.rowCol }}>{node.key}</span>
              <StatusBadge status={node.status} category={node.statusCategory} />
            </div>
            <div style={{ fontSize: 12.5, color: c.rowCol, marginTop: 4 }}>{node.summary}</div>
            <div style={{ fontSize: 11, color: c.subCol, marginTop: 4 }}>
              {node.issueType} · WP {num(node.weightPoint)} · SP {spOrNA(node.storyPoint)}
            </div>
          </div>
          {node.children && node.children.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <MobileCards nodes={node.children} depth={depth + 1} selectedKey={selectedKey} onSelect={onSelect} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
