'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import '@src/features/dashboard/components/FilterReport.css';

export interface FrOption {
  value: string;
  label: string;
  description?: string;
}

interface FrSelectProps {
  options: FrOption[];
  value?: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Enable a search box inside the dropdown (filters on label). */
  showSearch?: boolean;
  /** Show an inline clear (✕) when a value is set. */
  allowClear?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Leading trigger icon (matches Team Reporting per-control glyphs). */
  icon?: React.ReactNode;
  notFoundContent?: React.ReactNode;
  'aria-label'?: string;
  minWidth?: number;
}

const CHEVRON = (
  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
);
const CHECK = (
  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
);

/**
 * Generic single-select with the shared TERE `.fr-select` look (custom trigger,
 * glass dropdown, chevron, checkmarks) — same visual system as Team Reporting's
 * SprintSelect/TeamSelect, but domain-agnostic so Epic Explorer's controls stop
 * falling back to plain antd. Closes on outside click; optional search + clear.
 */
export function FrSelect({
  options,
  value,
  onChange,
  placeholder = 'Select',
  showSearch = false,
  allowClear = false,
  loading = false,
  disabled = false,
  icon,
  notFoundContent = 'No results',
  'aria-label': ariaLabel,
  minWidth = 200,
}: FrSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (open && showSearch && inputRef.current) inputRef.current.focus();
  }, [open, showSearch]);

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    if (!showSearch) return options;
    const q = search.toLowerCase().trim();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, showSearch, search]);

  return (
    <div ref={containerRef} className="fr-select" style={{ width: minWidth }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        className={`fr-select__trigger ${open ? 'fr-select__trigger--open' : ''} ${selected ? 'fr-select__trigger--has-value' : ''}`}
        style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        onClick={() => !disabled && setOpen(o => !o)}
      >
        <div className="fr-select__trigger-content">
          {icon && (
            <span className="fr-select__trigger-icon fr-select__trigger-icon--blue" aria-hidden>
              {icon}
            </span>
          )}
          {selected ? (
            <span className="fr-select__trigger-text">{selected.label}</span>
          ) : (
            <span className="fr-select__trigger-placeholder">{loading ? 'Loading…' : placeholder}</span>
          )}
        </div>
        <div className="fr-select__trigger-actions">
          {allowClear && selected && !disabled && (
            <span
              className="fr-select__clear"
              role="button"
              aria-label="Clear"
              title="Clear"
              onClick={e => {
                e.stopPropagation();
                onChange(null);
                setSearch('');
              }}
            >
              ✕
            </span>
          )}
          <svg
            className={`fr-select__chevron ${open ? 'fr-select__chevron--open' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            width="14"
            height="14"
          >
            {CHEVRON}
          </svg>
        </div>
      </button>

      {open && (
        <div
          className={`fr-select__dropdown ${showSearch ? 'fr-select__dropdown--multi' : 'fr-select__dropdown--compact'}`}
          role="listbox"
        >
          {showSearch && (
            <input
              ref={inputRef}
              type="text"
              className="fr-daterange__input"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 6 }}
            />
          )}
          {loading ? (
            <div className="fr-select__option-desc" style={{ padding: '10px 12px' }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="fr-select__option-desc" style={{ padding: '10px 12px' }}>
              {notFoundContent}
            </div>
          ) : (
            filtered.map(option => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                className={`fr-select__option ${value === option.value ? 'fr-select__option--selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <div className="fr-select__option-content">
                  <span className="fr-select__option-label">{option.label}</span>
                  {option.description && <span className="fr-select__option-desc">{option.description}</span>}
                </div>
                {value === option.value && (
                  <svg className="fr-select__option-check" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    {CHECK}
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
