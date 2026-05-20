'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jiraRepository } from '../repositories/jiraRepository';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';
import { EpicDto } from '../types/dashboard';
import { TagOutlined, CheckCircleFilled, SyncOutlined, ClockCircleFilled, SearchOutlined, DownOutlined, CloseCircleFilled } from '@ant-design/icons';
import './FilterReport.css';

function getStatusGroup(status?: string): 'Done' | 'In Progress' | 'To Do' {
  const n = (status ?? '').toLowerCase();
  if (n === 'done' || n === 'closed' || n === 'resolved') return 'Done';
  if (n === 'in progress' || n === 'in review' || n === 'in development') return 'In Progress';
  return 'To Do';
}

function StatusIcon({ group }: { group: 'Done' | 'In Progress' | 'To Do' }) {
  if (group === 'Done') return <CheckCircleFilled className="text-emerald-500 text-[10px]" />;
  if (group === 'In Progress') return <SyncOutlined spin className="text-blue-500 text-[10px]" />;
  return <ClockCircleFilled className="text-gray-400 text-[10px]" />;
}

export function EpicSelect({ isStoryGrouping = false }: { isStoryGrouping?: boolean }) {
  const { sprint, project, startDate, endDate, epicId } = useTeamReportFilterStore(
    state => state.selectedFilter
  );
  const setEpicFilters = useTeamReportFilterStore(state => state.setEpicFilters);
  const label = isStoryGrouping ? 'Story' : 'Epic';

  const { data: epics, isLoading } = useQuery({
    queryKey: [isStoryGrouping ? 'stories' : 'epics', sprint, startDate, endDate, project],
    queryFn: () => isStoryGrouping
      ? jiraRepository.fetchStories(sprint, project, startDate, endDate)
      : jiraRepository.fetchEpics(sprint, project, startDate, endDate),
    enabled: !!project && (!!sprint || (!!startDate && !!endDate)),
    staleTime: 5 * 60 * 1000,
  });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const committed = epicId ?? [];

  useEffect(() => {
    if (open) {
      setDraft([...committed]);
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset draft when committed filter changes externally (sprint/date change clears epicId)
  useEffect(() => {
    if (!open) setDraft([...committed]);
  }, [committed.join(',')]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const epicItems = (epics || []) as EpicDto[];

  const filtered = useMemo(() => {
    if (!search.trim()) return epicItems;
    const q = search.toLowerCase();
    return epicItems.filter(e =>
      e.summary.toLowerCase().includes(q) || e.key.toLowerCase().includes(q)
    );
  }, [epicItems, search]);

  if (!project || (!sprint && (!startDate || !endDate))) return null;

  const statusCounts = epicItems.reduce<Record<string, number>>((acc, epic) => {
    const g = getStatusGroup(epic.status);
    acc[g] = (acc[g] ?? 0) + 1;
    return acc;
  }, {});

  const isDraftNoEpic = draft.includes('null');
  const draftEpicKeys = draft.filter(d => d !== 'null');
  const isDirty = (() => {
    const a = [...committed].sort();
    const b = [...draft].sort();
    if (a.length !== b.length) return true;
    return a.some((v, i) => v !== b[i]);
  })();

  const toggleDraft = (value: string) => {
    setDraft(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleApply = () => {
    setEpicFilters(draft.length > 0 ? draft : undefined);
    setOpen(false);
  };

  const handleClear = () => setDraft([]);
  const handleCancel = () => setOpen(false);
  const handleSelectAll = () => setDraft(epicItems.map(e => e.key));

  // Trigger label
  const triggerText = committed.length === 0
    ? `All ${label}s`
    : committed.length === 1 && committed[0] === 'null'
      ? `No ${label}`
      : committed.length === 1
        ? epicItems.find(e => e.key === committed[0])?.summary ?? `1 ${label}`
        : `${committed.length} ${label}${committed.length !== 1 ? 's' : ''} selected`;

  return (
    <div ref={containerRef} className="fr-select" style={{ minWidth: 200 }}>
      <button
        type="button"
        className={`fr-select__trigger ${open ? 'fr-select__trigger--open' : ''} ${committed.length > 0 ? 'fr-select__trigger--has-value' : ''}`}
        onClick={() => !isLoading && setOpen(!open)}
        disabled={isLoading}
        style={isLoading ? { cursor: 'not-allowed', opacity: 0.7 } : undefined}
      >
        <span className="fr-select__trigger-content">
          <TagOutlined style={{ color: '#7c3aed', flexShrink: 0 }} />
          {isLoading ? (
            <span className="fr-select__trigger-placeholder">Loading {label.toLowerCase()}s...</span>
          ) : (
            <span className="fr-select__trigger-text" style={{ fontSize: 13, fontWeight: 500, color: committed.length > 0 ? '#1f2937' : '#9ca3af' }}>
              {triggerText}
            </span>
          )}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {committed.length > 0 && !isLoading && (
            <span
              onClick={(e) => { e.stopPropagation(); setEpicFilters(undefined); }}
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#9ca3af' }}
            >
              <CloseCircleFilled style={{ fontSize: 14 }} />
            </span>
          )}
          {isLoading ? (
            <span className="select-trigger-spinner" />
          ) : (
            <DownOutlined style={{ fontSize: 10, color: '#9ca3af', transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : undefined }} />
          )}
        </span>
      </button>

      {open && (
        <div className="sprint-select-dropdown" style={{ minWidth: 340, maxHeight: 420 }}>
          {/* Search */}
          <div className="sprint-select-search">
            <SearchOutlined className="sprint-select-search__icon" />
            <input
              ref={searchRef}
              className="sprint-select-search__input"
              placeholder={`Search ${label.toLowerCase()}s...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="sprint-select-search__count">{filtered.length} {label.toLowerCase()}s</span>
          </div>

          {/* Status summary */}
          {epicItems.length > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '8px 14px', borderBottom: '1px solid #f3f0ff', flexWrap: 'wrap' }}>
              {statusCounts['Done'] && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircleFilled className="text-emerald-500 text-[10px]" /> {statusCounts['Done']} Done
                </span>
              )}
              {statusCounts['In Progress'] && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  <SyncOutlined spin className="text-blue-500 text-[10px]" /> {statusCounts['In Progress']} In Progress
                </span>
              )}
              {statusCounts['To Do'] && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                  <ClockCircleFilled className="text-gray-400 text-[10px]" /> {statusCounts['To Do']} To Do
                </span>
              )}
            </div>
          )}

          {/* List */}
          <div className="sprint-select-list" style={{ maxHeight: 240 }}>
            {/* No Epic option */}
            {!search.trim() && (
              <button
                type="button"
                onClick={() => toggleDraft('null')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isDraftNoEpic ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
              >
                <span className={`flex items-center justify-center w-4 h-4 rounded border text-[10px] transition-colors ${isDraftNoEpic ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300'}`}>
                  {isDraftNoEpic && '✓'}
                </span>
                <span className="text-xs font-medium text-gray-500 italic">No {label}</span>
              </button>
            )}

            {/* Epic items */}
            {filtered.length === 0 ? (
              <div className="sprint-select-empty">
                <SearchOutlined className="sprint-select-empty__icon" style={{ fontSize: 20 }} />
                <span>No {label.toLowerCase()}s found</span>
              </div>
            ) : (
              filtered.map(epic => {
                const checked = draftEpicKeys.includes(epic.key);
                const group = getStatusGroup(epic.status);
                return (
                  <button
                    key={epic.key}
                    type="button"
                    onClick={() => toggleDraft(epic.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${checked ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`flex items-center justify-center w-4 h-4 rounded border text-[10px] transition-colors flex-shrink-0 ${checked ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300'}`}>
                      {checked && '✓'}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-xs font-medium text-gray-800 truncate">{epic.summary}</span>
                      <span className="text-[10px] text-gray-400">{epic.key}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${group === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : group === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                      <StatusIcon group={group} />
                      {epic.status ?? 'To Do'}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid #f3f0ff', background: 'linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-medium text-violet-600 hover:text-violet-800 px-2 py-1 rounded hover:bg-violet-50 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                disabled={draft.length === 0}
              >
                Clear
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={handleCancel}
                className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!isDirty}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${isDirty ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                Apply{draft.length > 0 ? ` (${draft.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
