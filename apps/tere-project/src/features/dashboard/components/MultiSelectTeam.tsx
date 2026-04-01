'use client';

import React, { useState, useRef, useEffect } from 'react';
import './FilterReport.css';
import './SprintSelect.css';

interface TeamOption {
  value: number;
  label: string;
  description?: string;
}

interface MultiSelectTeamProps {
  options: TeamOption[];
  values?: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  loading?: boolean;
}

export function MultiSelectTeam({
  options,
  values = [],
  onChange,
  placeholder = 'Select teams',
  loading = false,
}: MultiSelectTeamProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.filter(o => values.includes(o.value));
  const isAllSelected = selected.length === options.length;
  const isSomeSelected = selected.length > 0 && !isAllSelected;

  const handleToggle = (value: number) => {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText = 
    values.length === 0 
      ? placeholder 
      : values.length === 1
        ? options.find(o => o.value === values[0])?.label || placeholder
        : `${values.length} team${values.length !== 1 ? 's' : ''} selected`;

  return (
    <div ref={containerRef} className="fr-select">
      <button
        type="button"
        className={`fr-select__trigger ${open ? 'fr-select__trigger--open' : ''} ${values.length > 0 ? 'fr-select__trigger--has-value' : ''}`}
        onClick={() => !loading && setOpen(!open)}
        disabled={loading}
        style={loading ? { cursor: 'not-allowed', opacity: 0.7 } : undefined}
      >
        <div className="fr-select__trigger-content">
          <svg className="fr-select__trigger-icon fr-select__trigger-icon--blue" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
          </svg>
          <span className={`fr-select__trigger-text ${values.length === 0 ? 'fr-select__trigger-placeholder' : ''}`}>
            {loading ? 'Loading teams...' : displayText}
          </span>
          {!loading && values.length > 0 && (
            <span className="fr-select__count-badge">{values.length}</span>
          )}
        </div>
        <div className="fr-select__trigger-actions">
          {!loading && values.length > 0 && (
            <span className="fr-select__clear" onClick={handleClear} title="Clear all">
              ✕
            </span>
          )}
          {loading ? (
            <div className="select-trigger-spinner" />
          ) : (
            <svg
              className={`fr-select__chevron ${open ? 'fr-select__chevron--open' : ''}`}
              viewBox="0 0 20 20" fill="currentColor" width="14" height="14"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </button>

      {open && (
        <div className="fr-select__dropdown fr-select__dropdown--multi">
          {/* Select All */}
          <button
            type="button"
            className={`fr-select__option fr-select__option--select-all ${isAllSelected ? 'fr-select__option--selected' : ''} ${isSomeSelected ? 'fr-select__option--partial' : ''}`}
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
              <span className="fr-select__option-label">Select All Teams</span>
            </div>
          </button>

          <div className="fr-select__divider" />

          {/* Team Options */}
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`fr-select__option ${values.includes(option.value) ? 'fr-select__option--selected' : ''}`}
              onClick={() => handleToggle(option.value)}
            >
              <div className="fr-select__checkbox-wrapper">
                <input
                  type="checkbox"
                  className="fr-select__checkbox"
                  checked={values.includes(option.value)}
                  readOnly
                />
                <div className="fr-select__option-content">
                  <span className="fr-select__option-label">{option.label}</span>
                  {option.description && (
                    <span className="fr-select__option-desc">{option.description}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
