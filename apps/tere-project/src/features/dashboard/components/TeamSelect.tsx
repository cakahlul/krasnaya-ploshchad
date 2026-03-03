'use client';

import React, { useState, useRef, useEffect } from 'react';
import './FilterReport.css';

interface TeamOption {
  value: number;
  label: string;
  description?: string;
}

interface TeamSelectProps {
  options: TeamOption[];
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

export function TeamSelect({ options, value, onChange, placeholder = 'Select team' }: TeamSelectProps) {
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

  const selected = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className="fr-select">
      <button
        type="button"
        className={`fr-select__trigger ${open ? 'fr-select__trigger--open' : ''} ${selected ? 'fr-select__trigger--has-value' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <div className="fr-select__trigger-content">
          {/* Team/Users icon */}
          <svg className="fr-select__trigger-icon fr-select__trigger-icon--blue" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
          </svg>
          {selected ? (
            <span className="fr-select__trigger-text">{selected.label}</span>
          ) : (
            <span className="fr-select__trigger-placeholder">{placeholder}</span>
          )}
        </div>
        <svg
          className={`fr-select__chevron ${open ? 'fr-select__chevron--open' : ''}`}
          viewBox="0 0 20 20" fill="currentColor" width="14" height="14"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="fr-select__dropdown fr-select__dropdown--compact">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`fr-select__option ${value === option.value ? 'fr-select__option--selected' : ''}`}
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              <div className="fr-select__option-content">
                <span className="fr-select__option-label">{option.label}</span>
                {option.description && (
                  <span className="fr-select__option-desc">{option.description}</span>
                )}
              </div>
              {value === option.value && (
                <svg className="fr-select__option-check" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
