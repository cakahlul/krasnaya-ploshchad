'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import { Modal } from 'antd';
import { useThemeColors } from '@src/hooks/useTheme';
import type { ExplorerDescendant } from '../types/epic-explorer.types';
import { buildTree } from '../utils/buildTree';
import { flattenTree, type FlatRow } from '../utils/flattenTree';
import { StatusBadge } from './StatusBadge';
import { spOrNA, num } from '../utils/format';
import { issueTypeStyle } from '../utils/issueTypeStyle';
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
const INDENT = 22;
const PAGE = 60; // windowed render chunk / initial cap (perf on big trees)

function activate(e: KeyboardEvent, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    fn();
  }
}

/**
 * Descendant hierarchy — colorful card tree (replaces the monotone antd Table).
 * filter+sort and tree-build run over the WHOLE fetched array; only the RENDER
 * is windowed (PAGE-sized slice + Load-more), so large epics stay fast.
 * Pipeline: filterSortDescendants(full) → buildTree(filtered) →
 * flattenTree(roots, expandedKeys) → windowed card render. Each row is an issue
 * card with a type-colored accent bar, glyph, WP/SP pills and a status badge;
 * clicking a card opens the detail Modal.
 *
 * INVARIANT: the roll-up metrics panel + authz "N hidden" note stay bound to the
 * FULL `descendants` — the windowed/filtered view is never fed to them.
 */
export default function HierarchyTree({
  descendants,
  epicKey,
}: {
  descendants: ExplorerDescendant[];
  epicKey: string;
}) {
  const c = useThemeColors();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Local-only state (NOT Zustand / URL / query key) — filtering never refetches.
  const [filters, setFilters] = useState<DescendantFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortSpec>(DEFAULT_SORT);
  // Track COLLAPSED keys (empty default = everything expanded).
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(
    () => filterSortDescendants(descendants, filters, sort, epicKey),
    [descendants, filters, sort, epicKey],
  );

  const roots = useMemo(() => buildTree(filtered, epicKey), [filtered, epicKey]);

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

  const shown = flatRows.slice(0, visible);

  return (
    <div style={{ fontFamily: sans }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        <DescendantControls
          descendants={descendants}
          filters={filters}
          sort={sort}
          onFiltersChange={setFilters}
          onSortChange={setSort}
        />
        <span
          data-qa="explorer-filter-count"
          role="status"
          aria-live="polite"
          style={{ fontSize: 12, fontWeight: 600, color: c.subCol }}
        >
          Showing {filtered.length} of {descendants.length}
        </span>
      </div>

      <div
        role="tree"
        aria-label="Epic child issue hierarchy"
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {shown.map(row => (
          <IssueCard
            key={row.node.key}
            row={row}
            selected={row.node.key === selectedKey}
            onSelect={setSelectedKey}
            onToggle={toggle}
            c={c}
          />
        ))}
      </div>

      {visible < flatRows.length && (
        <button
          type="button"
          data-qa="explorer-hierarchy-load-more"
          onClick={() => setVisible(v => v + PAGE)}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '11px 12px',
            borderRadius: 12,
            border: `1px dashed ${c.cardBrd}`,
            background: c.headBg,
            color: c.accent,
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 12.5,
            cursor: 'pointer',
          }}
        >
          Load more ({flatRows.length - visible} remaining)
        </button>
      )}

      <Modal
        open={!!selected}
        onCancel={() => setSelectedKey(null)}
        footer={null}
        width={520}
        title={null}
        styles={{ body: { padding: 0 } }}
        destroyOnClose
      >
        {selected && <DescendantDetail item={selected} />}
      </Modal>
    </div>
  );
}

function Assignee({ name, c }: { name: string | null; c: ReturnType<typeof useThemeColors> }) {
  const label = name && name.trim() !== '' ? name : 'Unassigned';
  const initial = name && name.trim() !== '' ? name.trim()[0].toUpperCase() : '?';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 2, minWidth: 0 }}>
      <span
        aria-hidden
        style={{
          width: 16,
          height: 16,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          background: name ? c.accent : c.iconBg,
          color: name ? '#fff' : c.subCol,
          fontSize: 9,
          fontWeight: 700,
        }}
      >
        {initial}
      </span>
      <span style={{ fontSize: 11, color: c.subCol, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </span>
  );
}

function Pill({ label, value, tone, c }: { label: string; value: React.ReactNode; tone: string; c: ReturnType<typeof useThemeColors> }) {
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        background: c.iconBg,
        border: `1px solid ${c.cardBrd}`,
        fontSize: 11,
        fontWeight: 700,
        color: tone,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, color: c.subCol }}>{label}</span>
      {value}
    </span>
  );
}

function IssueCard({
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
  const ts = issueTypeStyle(node.issueType, c);

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', marginLeft: row.depth * INDENT }}>
      {/* Connector guide for nested rows */}
      {row.depth > 0 && (
        <span
          aria-hidden
          style={{ width: 12, marginRight: 6, borderLeft: `2px solid ${c.cardBrd}`, borderBottom: `2px solid ${c.cardBrd}`, borderBottomLeftRadius: 8, marginTop: -4, marginBottom: 18 }}
        />
      )}

      <div
        role="treeitem"
        aria-level={row.depth + 1}
        aria-expanded={row.hasChildren ? row.isExpanded : undefined}
        aria-selected={selected}
        tabIndex={0}
        aria-label={`${node.key}: ${node.summary}. ${node.status}`}
        onClick={() => onSelect(node.key)}
        onKeyDown={e => activate(e, () => onSelect(node.key))}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          padding: '10px 14px',
          borderRadius: 12,
          background: selected ? ts.bg : c.cardBg,
          // Per-side borders so the accent left bar is NEVER clobbered by a
          // borderColor hover mutation (that bug made the color vanish on hover).
          borderTop: `1px solid ${selected ? ts.accent : c.cardBrd}`,
          borderRight: `1px solid ${selected ? ts.accent : c.cardBrd}`,
          borderBottom: `1px solid ${selected ? ts.accent : c.cardBrd}`,
          borderLeft: `4px solid ${ts.accent}`,
          cursor: 'pointer',
          transition: 'transform 0.12s ease, box-shadow 0.12s ease',
          boxShadow: selected ? `0 4px 16px -6px ${ts.accent}66` : 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `0 6px 18px -8px ${ts.accent}55`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = selected ? `0 4px 16px -6px ${ts.accent}66` : 'none';
        }}
      >
        {/* Expand caret */}
        {row.hasChildren ? (
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
              width: 22,
              height: 22,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: 'none',
              background: c.iconBg,
              cursor: 'pointer',
              color: c.rowCol,
              fontSize: 11,
              transition: 'transform 0.15s ease',
              transform: row.isExpanded ? 'rotate(90deg)' : 'none',
            }}
          >
            ▸
          </button>
        ) : (
          <span aria-hidden style={{ width: 22, flexShrink: 0 }} />
        )}

        {/* Type glyph chip */}
        <span
          aria-hidden
          style={{
            width: 30,
            height: 30,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: ts.bg,
            fontSize: 15,
          }}
        >
          {ts.glyph}
        </span>

        {/* Key + summary + assignee */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: ts.accent, letterSpacing: 0.2 }}>
            {node.key}
          </span>
          <span style={{ fontSize: 13, color: c.rowCol, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.summary || '—'}
          </span>
          <Assignee name={node.assignee} c={c} />
        </div>

        {/* Metrics + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Pill label="WP" value={num(node.weightPoint)} tone={c.rowCol} c={c} />
          <Pill label="SP" value={spOrNA(node.storyPoint)} tone={c.rowCol} c={c} />
          <StatusBadge status={node.status} category={node.statusCategory} />
        </div>
      </div>
    </div>
  );
}
