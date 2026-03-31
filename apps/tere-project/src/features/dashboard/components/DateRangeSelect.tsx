'use client';

import React, { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import './FilterReport.css';

interface DateRangeSelectProps {
  startDate?: string;
  endDate?: string;
  onChange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
  isActive?: boolean;
  disabled?: boolean;
}

export function DateRangeSelect({ startDate, endDate, onChange, isActive, disabled }: DateRangeSelectProps) {
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Quick presets
  const presets = [
    { label: 'Last 7 days', getDates: () => [dayjs().subtract(7, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: 'Last 14 days', getDates: () => [dayjs().subtract(14, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: 'Last 30 days', getDates: () => [dayjs().subtract(30, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: 'This month', getDates: () => [dayjs().startOf('month'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: 'Last month', getDates: () => [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] as [dayjs.Dayjs, dayjs.Dayjs] },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setTempStart(startDate || '');
    setTempEnd(endDate || '');
  }, [startDate, endDate]);

  const handlePreset = (getDates: () => [dayjs.Dayjs, dayjs.Dayjs]) => {
    const [s, e] = getDates();
    onChange([s, e]);
    setOpen(false);
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange([dayjs(tempStart), dayjs(tempEnd)]);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setTempStart('');
    setTempEnd('');
  };

  const hasValue = !!startDate && !!endDate;

  const formatDisplay = () => {
    if (!startDate || !endDate) return null;
    const s = dayjs(startDate);
    const e = dayjs(endDate);
    return `${s.format('MMM D')} – ${e.format('MMM D, YYYY')}`;
  };

  return (
    <div ref={containerRef} className="fr-select" style={{ width: 300, opacity: disabled ? 0.5 : 1 }}>
      <button
        type="button"
        disabled={disabled}
        className={`fr-select__trigger ${open ? 'fr-select__trigger--open' : ''} ${hasValue ? 'fr-select__trigger--has-value fr-select__trigger--purple' : ''}`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <div className="fr-select__trigger-content">
          {/* Calendar icon */}
          <svg className={`fr-select__trigger-icon ${hasValue ? 'fr-select__trigger-icon--purple' : 'fr-select__trigger-icon--gray'}`} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
          </svg>
          {hasValue ? (
            <span className="fr-select__trigger-text">{formatDisplay()}</span>
          ) : (
            <span className="fr-select__trigger-placeholder">Select date range</span>
          )}
        </div>
        <div className="fr-select__trigger-actions">
          {hasValue && (
            <span className="fr-select__clear" onClick={handleClear} title="Clear">✕</span>
          )}
          <svg
            className={`fr-select__chevron ${open ? 'fr-select__chevron--open' : ''}`}
            viewBox="0 0 20 20" fill="currentColor" width="14" height="14"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="fr-select__dropdown fr-daterange__dropdown">
          {/* Quick Presets */}
          <div className="fr-daterange__presets">
            <div className="fr-daterange__presets-label">Quick select</div>
            <div className="fr-daterange__presets-grid">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="fr-daterange__preset-btn"
                  onClick={() => handlePreset(preset.getDates)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="fr-daterange__divider" />

          {/* Custom Range */}
          <div className="fr-daterange__custom">
            <div className="fr-daterange__custom-label">Custom range</div>
            <div className="fr-daterange__inputs">
              <div className="fr-daterange__input-group">
                <label className="fr-daterange__input-label">From</label>
                <input
                  type="date"
                  className="fr-daterange__input"
                  value={tempStart}
                  onChange={e => setTempStart(e.target.value)}
                />
              </div>
              <div className="fr-daterange__arrow">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638l-3.175-2.847a.75.75 0 011.004-1.115l4.5 4.035a.75.75 0 010 1.115l-4.5 4.036a.75.75 0 01-1.004-1.115l3.175-2.849H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="fr-daterange__input-group">
                <label className="fr-daterange__input-label">To</label>
                <input
                  type="date"
                  className="fr-daterange__input"
                  value={tempEnd}
                  onChange={e => setTempEnd(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="fr-daterange__apply"
              disabled={!tempStart || !tempEnd}
              onClick={handleApply}
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
