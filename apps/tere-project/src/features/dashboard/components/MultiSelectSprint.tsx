'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SprintOption } from '../hooks/useSprintDataTransform';
import dayjs from 'dayjs';
import './SprintSelect.css';
import './FilterReport.css';

interface MultiSelectSprintProps {
  sprints: SprintOption[];
  values?: string[];
  onChange: (values: string[]) => void;
  onClear: () => void;
  loading?: boolean;
  teamNames?: Record<number, string>;
}

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate && !endDate) return '';
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (start.year() === end.year() && start.month() === end.month()) {
    return `${start.format('MMM D')} – ${end.format('D, YYYY')}`;
  }
  return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`;
}

function sortByEndDateDesc(a: SprintOption, b: SprintOption) {
  const aDate = a.endDate || a.startDate || '';
  const bDate = b.endDate || b.startDate || '';
  return bDate.localeCompare(aDate);
}

export function MultiSelectSprint({
  sprints,
  values = [],
  onChange,
  onClear,
  loading,
  teamNames = {},
}: MultiSelectSprintProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingValues, setPendingValues] = useState<string[]>(values);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync pending to committed values when dropdown opens
  useEffect(() => {
    if (open) {
      setPendingValues(values);
    }
  }, [open]);

  // Close on outside click — discard pending changes
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
        setPendingValues(values);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [values]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Group sprints by team and filter; sort closed latest → oldest
  const { groupedSprints, allActiveSprints, allClosedSprints, totalFiltered } = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = sprints.filter(s =>
      s.label.toLowerCase().includes(q) ||
      (teamNames[s.boardId || 0] || '').toLowerCase().includes(q)
    );

    const grouped: Record<number, { active: SprintOption[]; closed: SprintOption[] }> = {};
    const active: SprintOption[] = [];
    const closed: SprintOption[] = [];

    filtered.forEach(s => {
      const boardId = s.boardId || 0;
      if (!grouped[boardId]) {
        grouped[boardId] = { active: [], closed: [] };
      }
      if (s.state === 'active') {
        grouped[boardId].active.push(s);
        active.push(s);
      } else {
        grouped[boardId].closed.push(s);
        closed.push(s);
      }
    });

    // Sort each team's closed sprints latest → oldest
    Object.values(grouped).forEach(group => {
      group.closed.sort(sortByEndDateDesc);
    });

    return {
      groupedSprints: grouped,
      allActiveSprints: active,
      allClosedSprints: closed.sort(sortByEndDateDesc),
      totalFiltered: filtered.length,
    };
  }, [sprints, search, teamNames]);

  const handleToggle = (sprintValue: string) => {
    if (pendingValues.includes(sprintValue)) {
      setPendingValues(pendingValues.filter(v => v !== sprintValue));
    } else {
      setPendingValues([...pendingValues, sprintValue]);
    }
  };

  const handleSelectAll = () => {
    if (pendingValues.length === totalFiltered && totalFiltered > 0) {
      setPendingValues([]);
    } else {
      const allSprintValues = allActiveSprints.concat(allClosedSprints).map(s => String(s.value));
      setPendingValues(allSprintValues);
    }
  };

  const handleSearch = () => {
    onChange(pendingValues);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingValues([]);
    onClear();
    setSearch('');
  };

  const displayText =
    values.length === 0
      ? 'Select sprints'
      : values.length === 1
        ? sprints.find(s => String(s.value) === values[0])?.label || 'Select sprints'
        : `${values.length} sprint${values.length !== 1 ? 's' : ''} selected`;

  const isAllSelected = pendingValues.length === totalFiltered && totalFiltered > 0;
  const isSomeSelected = pendingValues.length > 0 && pendingValues.length < totalFiltered;
  const hasChanges = JSON.stringify([...pendingValues].sort()) !== JSON.stringify([...values].sort());

  return (
    <div ref={containerRef} className="sprint-select-container">
      {/* Trigger Button */}
      <button
        type="button"
        className={`sprint-select-trigger ${open ? 'sprint-select-trigger--open' : ''} ${values.length > 0 ? 'sprint-select-trigger--has-value' : ''}`}
        onClick={() => !loading && setOpen(!open)}
        disabled={loading}
        style={loading ? { cursor: 'not-allowed', opacity: 0.7 } : undefined}
      >
        <div className="sprint-select-trigger__content">
          <svg className="sprint-select-trigger__icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.451a.75.75 0 000-1.5H4.5a.75.75 0 00-.75.75v3.75a.75.75 0 001.5 0v-2.127l.269.269a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-10.624-2.85a5.5 5.5 0 019.201-2.465l.312.311H11.75a.75.75 0 000 1.5H15.5a.75.75 0 00.75-.75V3.42a.75.75 0 00-1.5 0v2.126l-.269-.268A7 7 0 002.769 8.416a.75.75 0 001.449.389l.47.769z" clipRule="evenodd" />
          </svg>
          <span className={`sprint-select-trigger__text ${values.length === 0 ? 'sprint-select-trigger__placeholder' : ''}`}>
            {loading ? 'Loading sprints...' : displayText}
          </span>
          {!loading && values.length > 0 && (
            <span className="fr-select__count-badge">{values.length}</span>
          )}
        </div>
        <div className="sprint-select-trigger__actions">
          {!loading && values.length > 0 && (
            <span className="sprint-select-trigger__clear" onClick={handleClear} title="Clear all">
              ✕
            </span>
          )}
          {loading ? (
            <div className="select-trigger-spinner" />
          ) : (
            <svg
              className={`sprint-select-trigger__chevron ${open ? 'sprint-select-trigger__chevron--open' : ''}`}
              viewBox="0 0 20 20" fill="currentColor" width="16" height="16"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="sprint-select-dropdown">
          {/* Search Input */}
          <div className="sprint-select-search">
            <svg className="sprint-select-search__icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="sprint-select-search__input"
              placeholder="Search sprints..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <span className="sprint-select-search__count">
                {totalFiltered} found
              </span>
            )}
          </div>

          {/* Sprint List */}
          <div ref={listRef} className="sprint-select-list sprint-select-list--multi">
            {loading && (
              <div className="sprint-select-empty">
                <div className="sprint-select-spinner" />
                Loading sprints...
              </div>
            )}

            {!loading && totalFiltered === 0 && (
              <div className="sprint-select-empty">
                <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24" className="sprint-select-empty__icon">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                {search ? `No sprints matching "${search}"` : 'No sprints available'}
              </div>
            )}

            {!loading && totalFiltered > 0 && (
              <>
                {/* Select All */}
                <button
                  type="button"
                  className={`sprint-select-item sprint-select-item--select-all ${isAllSelected ? 'sprint-select-item--selected' : ''} ${isSomeSelected ? 'sprint-select-item--partial' : ''}`}
                  onClick={handleSelectAll}
                >
                  <div className="fr-select__checkbox-wrapper">
                    <input
                      type="checkbox"
                      className="fr-select__checkbox"
                      checked={isAllSelected}
                      ref={el => {
                        if (el && isSomeSelected) {
                          el.indeterminate = true;
                        }
                      }}
                      readOnly
                    />
                    <span className="fr-select__option-label">Select All</span>
                  </div>
                  <span className="sprint-select-group__count">{totalFiltered}</span>
                </button>

                <div className="fr-select__divider" />

                {/* Grouped Sprints by Team */}
                {Object.entries(groupedSprints).map(([boardIdStr, { active, closed }]) => {
                  const boardId = Number(boardIdStr);
                  const teamName = teamNames[boardId] || `Board ${boardId}`;

                  return (
                    <div key={boardId}>
                      {/* Active Sprints */}
                      {active.length > 0 && (
                        <div className="sprint-select-group">
                          <div className="sprint-select-group__header">
                            <span className="sprint-select-group__dot sprint-select-group__dot--active" />
                            <span className="sprint-select-group__team-name">{teamName}</span>
                            <span className="sprint-select-group__dot sprint-select-group__dot--active sprint-select-group__dot--status" />
                            Active
                            <span className="sprint-select-group__count">{active.length}</span>
                          </div>
                          {active.map(sprint => (
                            <MultiSprintItem
                              key={sprint.value}
                              sprint={sprint}
                              selected={pendingValues.includes(String(sprint.value))}
                              onToggle={handleToggle}
                            />
                          ))}
                        </div>
                      )}

                      {/* Closed Sprints — latest → oldest */}
                      {closed.length > 0 && (
                        <div className="sprint-select-group">
                          <div className="sprint-select-group__header">
                            <span className="sprint-select-group__dot sprint-select-group__dot--closed" />
                            <span className="sprint-select-group__team-name">{teamName}</span>
                            <span className="sprint-select-group__dot sprint-select-group__dot--closed sprint-select-group__dot--status" />
                            Closed
                            <span className="sprint-select-group__count">{closed.length}</span>
                          </div>
                          {closed.map(sprint => (
                            <MultiSprintItem
                              key={sprint.value}
                              sprint={sprint}
                              selected={pendingValues.includes(String(sprint.value))}
                              onToggle={handleToggle}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer — Search button */}
          <div className="sprint-select-footer">
            <span className="sprint-select-footer__hint">
              {pendingValues.length > 0
                ? `${pendingValues.length} sprint${pendingValues.length !== 1 ? 's' : ''} selected`
                : 'No sprints selected'}
            </span>
            <button
              type="button"
              className={`sprint-select-footer__search-btn ${hasChanges ? 'sprint-select-footer__search-btn--highlight' : ''}`}
              onClick={handleSearch}
              disabled={pendingValues.length === 0}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiSprintItem({
  sprint,
  selected,
  onToggle,
}: {
  sprint: SprintOption;
  selected: boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <button
      type="button"
      className={`sprint-select-item sprint-select-item--multi ${selected ? 'sprint-select-item--selected' : ''}`}
      onClick={() => onToggle(String(sprint.value))}
    >
      <div className="fr-select__checkbox-wrapper">
        <input
          type="checkbox"
          className="fr-select__checkbox"
          checked={selected}
          readOnly
        />
        <div className="sprint-select-item__main">
          <span className="sprint-select-item__name">{sprint.label}</span>
          <span className={`sprint-select-badge sprint-select-badge--${sprint.state} sprint-select-badge--sm`}>
            {sprint.state === 'active' ? '● Active' : 'Closed'}
          </span>
        </div>
      </div>
      <div className="sprint-select-item__dates">
        <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
        {formatDateRange(sprint.startDate, sprint.endDate)}
      </div>
    </button>
  );
}
