'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SprintOption } from '../hooks/useSprintDataTransform';
import dayjs from 'dayjs';
import './SprintSelect.css';
import './FilterReport.css';

interface SprintSelectProps {
  sprints: SprintOption[];
  value?: string;
  onChange: (value: string) => void;
  onClear: () => void;
  loading?: boolean;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('MMM D, YYYY');
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

export function SprintSelect({
  sprints,
  value,
  onChange,
  onClear,
  loading,
}: SprintSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Group and filter sprints
  const { activeSprints, closedSprints } = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = sprints.filter(s =>
      s.label.toLowerCase().includes(q) ||
      formatDate(s.startDate).toLowerCase().includes(q) ||
      formatDate(s.endDate).toLowerCase().includes(q)
    );
    return {
      activeSprints: filtered.filter(s => s.state === 'active'),
      closedSprints: filtered.filter(s => s.state === 'closed').reverse(),
    };
  }, [sprints, search]);

  const selectedSprint = sprints.find(s => s.label === value);
  const totalFiltered = activeSprints.length + closedSprints.length;

  const handleSelect = (sprint: SprintOption) => {
    onChange(sprint.label);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
    setSearch('');
  };

  return (
    <div ref={containerRef} className="sprint-select-container">
      {/* Trigger Button */}
      <button
        type="button"
        className={`sprint-select-trigger ${open ? 'sprint-select-trigger--open' : ''} ${value ? 'sprint-select-trigger--has-value' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <div className="sprint-select-trigger__content">
          {/* Sprint/Iteration icon */}
          <svg className="sprint-select-trigger__icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.451a.75.75 0 000-1.5H4.5a.75.75 0 00-.75.75v3.75a.75.75 0 001.5 0v-2.127l.269.269a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-10.624-2.85a5.5 5.5 0 019.201-2.465l.312.311H11.75a.75.75 0 000 1.5H15.5a.75.75 0 00.75-.75V3.42a.75.75 0 00-1.5 0v2.126l-.269-.268A7 7 0 002.769 8.416a.75.75 0 001.449.389l.47.769z" clipRule="evenodd" />
          </svg>
          {selectedSprint ? (
            <div className="sprint-select-trigger__selected">
              <span className="sprint-select-trigger__name">{selectedSprint.label}</span>
              <span className={`sprint-select-badge sprint-select-badge--${selectedSprint.state}`}>
                {selectedSprint.state === 'active' ? '● Active' : 'Closed'}
              </span>
            </div>
          ) : (
            <span className="sprint-select-trigger__placeholder">
              {loading ? 'Loading sprints...' : 'Select sprint'}
            </span>
          )}
        </div>
        <div className="sprint-select-trigger__actions">
          {value && (
            <span className="sprint-select-trigger__clear" onClick={handleClear} title="Clear">
              ✕
            </span>
          )}
          <svg
            className={`sprint-select-trigger__chevron ${open ? 'sprint-select-trigger__chevron--open' : ''}`}
            viewBox="0 0 20 20" fill="currentColor" width="16" height="16"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
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
          <div ref={listRef} className="sprint-select-list">
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

            {/* Active Sprints Group */}
            {activeSprints.length > 0 && (
              <div className="sprint-select-group">
                <div className="sprint-select-group__header">
                  <span className="sprint-select-group__dot sprint-select-group__dot--active" />
                  Active Sprint
                  <span className="sprint-select-group__count">{activeSprints.length}</span>
                </div>
                {activeSprints.map(sprint => (
                  <SprintItem
                    key={sprint.value}
                    sprint={sprint}
                    selected={value === sprint.label}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {/* Closed Sprints Group */}
            {closedSprints.length > 0 && (
              <div className="sprint-select-group">
                <div className="sprint-select-group__header">
                  <span className="sprint-select-group__dot sprint-select-group__dot--closed" />
                  Closed Sprints
                  <span className="sprint-select-group__count">{closedSprints.length}</span>
                </div>
                {closedSprints.map(sprint => (
                  <SprintItem
                    key={sprint.value}
                    sprint={sprint}
                    selected={value === sprint.label}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SprintItem({
  sprint,
  selected,
  onSelect,
}: {
  sprint: SprintOption;
  selected: boolean;
  onSelect: (sprint: SprintOption) => void;
}) {
  return (
    <button
      type="button"
      className={`sprint-select-item ${selected ? 'sprint-select-item--selected' : ''}`}
      onClick={() => onSelect(sprint)}
    >
      <div className="sprint-select-item__main">
        <span className="sprint-select-item__name">{sprint.label}</span>
        <span className={`sprint-select-badge sprint-select-badge--${sprint.state} sprint-select-badge--sm`}>
          {sprint.state === 'active' ? '● Active' : 'Closed'}
        </span>
      </div>
      <div className="sprint-select-item__dates">
        <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
        {formatDateRange(sprint.startDate, sprint.endDate)}
      </div>
      {selected && (
        <svg className="sprint-select-item__check" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
