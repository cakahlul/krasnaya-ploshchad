'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMediaQuery } from 'react-responsive';
import { useThemeColors } from '@src/hooks/useTheme';
import type { ExplorerDescendant } from '../types/epic-explorer.types';
import { buildTree } from '../utils/buildTree';
import { flattenTree, type FlatRow } from '../utils/flattenTree';
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
const INDENT = 16;
const TABLE_Y = 560; // fixed viewport height — antd `virtual` requires scroll.y
const TABLE_X = 1000; // sum of column widths — antd `virtual` requires scroll.x
const MOBILE_PAGE = 50; // Load-more chunk / initial cap

function activate(e: KeyboardEvent, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    fn();
  }
}

/**
 * Descendant hierarchy (SLS-16806, virtualized in SLS-16902). filter+sort and
 * tree-build run over the WHOLE fetched array; only the RENDER is windowed.
 * Pipeline: filterSortDescendants(full) → buildTree(filtered) →
 * flattenTree(roots, expandedKeys) → windowed render (desktop antd virtual
 * Table / mobile flat cards + Load-more). antd's own expandable/nested tree
 * does NOT work with `virtual`, so the FLAT rows ARE the tree (indent via
 * `depth`, own caret cell toggling a local expandedKeys set).
 *
 * INVARIANT: the roll-up metrics panel + authz "N hidden" note + "Showing X of
 * Y" upstream stay bound to the FULL `descendants` — the windowed/filtered view
 * is never fed to them.
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
  // Track COLLAPSED keys (empty default = everything expanded, matching the
  // previous always-expanded behavior). New/filtered rows default to expanded
  // without extra bookkeeping.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [mobileVisible, setMobileVisible] = useState(MOBILE_PAGE);

  // Filtered/sorted view of the ALREADY-fetched set. The roll-up summary + authz
  // "N items hidden" note upstream stay bound to the FULL `descendants` and are
  // never fed this array — only the tree render consumes it.
  const filtered = useMemo(
    () => filterSortDescendants(descendants, filters, sort, epicKey),
    [descendants, filters, sort, epicKey],
  );

  const roots = useMemo(() => buildTree(filtered, epicKey), [filtered, epicKey]);

  // Positive expanded set derived from the collapsed set over the visible keys.
  const expandedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const d of filtered) if (!collapsed.has(d.key)) s.add(d.key);
    return s;
  }, [filtered, collapsed]);

  const flatRows = useMemo(() => flattenTree(roots, expandedKeys), [roots, expandedKeys]);

  const selected = useMemo(
    () => descendants.find(d => d.key === selectedKey) ?? null,
    [descendants, selectedKey],
  );

  const toggle = (key: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const caret = (row: FlatRow) => {
    if (!row.hasChildren) {
      return <span aria-hidden style={{ display: 'inline-block', width: 20 }} />;
    }
    return (
      <button
        type="button"
        data-qa="explorer-hierarchy-row-toggle"
        aria-label={`${row.isExpanded ? 'Collapse' : 'Expand'} ${row.node.key}`}
        aria-expanded={row.isExpanded}
        onClick={e => {
          e.stopPropagation(); // do not also select the row
          toggle(row.node.key);
        }}
        onKeyDown={e => {
          // caret handles its own Enter/Space — stop the row's select handler.
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') e.stopPropagation();
        }}
        style={{
          width: 20,
          height: 20,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: c.rowCol,
          fontSize: 11,
          lineHeight: '20px',
        }}
      >
        {row.isExpanded ? '▾' : '▸'}
      </button>
    );
  };

  const columns: ColumnsType<FlatRow> = [
    {
      title: 'Key',
      dataIndex: ['node', 'key'],
      width: 240,
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: row.depth * INDENT }}>
          {caret(row)}
          <span>{row.node.key}</span>
        </div>
      ),
    },
    { title: 'Summary', dataIndex: ['node', 'summary'], width: 360, ellipsis: true },
    { title: 'Type', dataIndex: ['node', 'issueType'], width: 110 },
    {
      title: 'Status',
      width: 150,
      render: (_, row) => <StatusBadge status={row.node.status} category={row.node.statusCategory} />,
    },
    { title: 'WP', width: 70, render: (_, row) => num(row.node.weightPoint) },
    { title: 'SP', width: 70, render: (_, row) => spOrNA(row.node.storyPoint) },
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
    const shown = flatRows.slice(0, mobileVisible);
    return (
      <div>
        {controls}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map(row => (
            <MobileCard
              key={row.node.key}
              row={row}
              selected={row.node.key === selectedKey}
              onSelect={setSelectedKey}
              onToggle={toggle}
              c={c}
            />
          ))}
        </div>
        {mobileVisible < flatRows.length && (
          <button
            type="button"
            data-qa="explorer-hierarchy-load-more"
            onClick={() => setMobileVisible(v => v + MOBILE_PAGE)}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${c.cardBrd}`,
              background: c.cardBg,
              color: c.rowCol,
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Load more ({flatRows.length - mobileVisible} remaining)
          </button>
        )}
        {detail}
      </div>
    );
  }

  return (
    <div className="tere-table">
      {controls}
      <Table<FlatRow>
        virtual
        scroll={{ y: TABLE_Y, x: TABLE_X }}
        columns={columns}
        dataSource={flatRows}
        rowKey={row => row.node.key}
        pagination={false}
        size="small"
        aria-label="Epic child issue hierarchy"
        aria-rowcount={flatRows.length}
        onRow={(record, index) => ({
          role: 'button',
          tabIndex: 0,
          'aria-rowindex': (index ?? 0) + 1,
          'aria-label': `${record.node.key}: ${record.node.summary}. ${record.node.status}`,
          'aria-pressed': record.node.key === selectedKey,
          style: {
            cursor: 'pointer',
            background: record.node.key === selectedKey ? c.headBg : undefined,
          },
          onClick: () => setSelectedKey(record.node.key),
          onKeyDown: (e: KeyboardEvent) => activate(e, () => setSelectedKey(record.node.key)),
        })}
      />
      {detail}
    </div>
  );
}

function MobileCard({
  row,
  selected,
  onSelect,
  onToggle,
  c,
}: {
  row: FlatRow;
  selected: boolean;
  onSelect: (key: string) => void;
  onToggle: (key: string) => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  const node = row.node;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${node.key}: ${node.summary}. ${node.status}`}
      aria-pressed={selected}
      onClick={() => onSelect(node.key)}
      onKeyDown={e => activate(e, () => onSelect(node.key))}
      style={{
        marginLeft: row.depth * INDENT,
        background: selected ? c.headBg : c.cardBg,
        border: `1px solid ${c.cardBrd}`,
        borderRadius: 10,
        padding: '10px 12px',
        cursor: 'pointer',
        fontFamily: sans,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {row.hasChildren && (
            <button
              type="button"
              data-qa="explorer-hierarchy-row-toggle"
              aria-label={`${row.isExpanded ? 'Collapse' : 'Expand'} ${node.key}`}
              aria-expanded={row.isExpanded}
              onClick={e => {
                e.stopPropagation();
                onToggle(node.key);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') e.stopPropagation();
              }}
              style={{
                width: 20,
                height: 20,
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: c.rowCol,
                fontSize: 11,
              }}
            >
              {row.isExpanded ? '▾' : '▸'}
            </button>
          )}
          <span style={{ fontSize: 12, fontWeight: 700, color: c.rowCol }}>{node.key}</span>
        </span>
        <StatusBadge status={node.status} category={node.statusCategory} />
      </div>
      <div style={{ fontSize: 12.5, color: c.rowCol, marginTop: 4 }}>{node.summary}</div>
      <div style={{ fontSize: 11, color: c.subCol, marginTop: 4 }}>
        {node.issueType} · WP {num(node.weightPoint)} · SP {spOrNA(node.storyPoint)}
      </div>
    </div>
  );
}
