'use client';

import { useMemo, useState } from 'react';
import { useHolidays, useDeleteHoliday } from '../hooks/useHolidayQueries';
import { useThemeColors } from '@src/hooks/useTheme';
import { Spin, message, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import type { Holiday } from '../types/holiday-management.types';
import HolidayFormModal from './HolidayFormModal';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

interface HolidayRowProps {
  holiday: Holiday;
  isPast: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function HolidayRow({ holiday, isPast, onEdit, onDelete, isDeleting }: HolidayRowProps) {
  const { isDark, accent, cardBrd, titleCol, subCol, rowCol } = useThemeColors();
  const date = new Date(holiday.holiday_date);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 18px',
      opacity: isPast ? 0.5 : 1,
    }}>
      {/* Mini calendar badge */}
      <div style={{
        width: 48,
        height: 52,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid ' + cardBrd,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          background: accent,
          padding: '3px 0',
          textAlign: 'center',
        }}>
          <span style={{
            fontSize: 8.5,
            color: '#fff',
            fontWeight: 700,
            fontFamily: sans,
            letterSpacing: 0.5,
          }}>
            {MONTHS[date.getMonth()]}
          </span>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark ? '#0a1520' : '#fff',
        }}>
          <span style={{
            fontSize: 20,
            fontWeight: 800,
            color: titleCol,
            fontFamily: mono,
            lineHeight: 1,
          }}>
            {date.getDate()}
          </span>
        </div>
      </div>

      {/* Weekday */}
      <div style={{ width: 30, textAlign: 'center', flexShrink: 0 }}>
        <span style={{
          fontSize: 11,
          color: subCol,
          fontFamily: sans,
          fontWeight: 600,
        }}>
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </span>
      </div>

      {/* Name + date */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: rowCol,
          fontFamily: sans,
        }}>
          {holiday.holiday_name}
        </div>
        <div style={{
          fontSize: 11,
          color: subCol,
          fontFamily: mono,
          marginTop: 2,
        }}>
          {holiday.holiday_date}
        </div>
      </div>

      {/* Type badge */}
      <div style={{
        background: accent + '12',
        border: '1px solid ' + accent + '25',
        borderRadius: 6,
        padding: '3px 10px',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: accent,
          fontFamily: sans,
        }}>
          National
        </span>
      </div>

      {/* Scope */}
      <div style={{ width: 80, textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: subCol, fontFamily: sans }}>
          All teams
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {onEdit && (
          <button onClick={onEdit} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: subCol, padding: 4, borderRadius: 6, transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = accent)}
            onMouseLeave={e => (e.currentTarget.style.color = subCol)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.5 1.5l3 3L5 14H2v-3z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <Popconfirm
            title="Delete holiday"
            description="Are you sure you want to delete this holiday?"
            onConfirm={onDelete}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, loading: isDeleting }}
          >
            <button style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: subCol, padding: 4, borderRadius: 6, transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = subCol)}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3,6 13,6" />
                <path d="M5.5 6V3.5a1 1 0 011-1h3a1 1 0 011 1V6" />
                <path d="M4 6l.7 8.1a1 1 0 001 .9h4.6a1 1 0 001-.9L12 6" />
              </svg>
            </button>
          </Popconfirm>
        )}
      </div>
    </div>
  );
}

export default function HolidayListView() {
  const { data: holidays, isLoading } = useHolidays();
  const { mutateAsync: deleteHoliday, isPending: isDeleting } = useDeleteHoliday();
  const { accent, cardBg, cardBrd, titleCol, subCol, rowBrd } = useThemeColors();

  const [editModal, setEditModal] = useState<{ open: boolean; holiday: Holiday | null }>({
    open: false,
    holiday: null,
  });

  const { upcoming, past } = useMemo(() => {
    if (!holidays) return { upcoming: [], past: [] };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const sorted = [...holidays].sort(
      (a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime()
    );

    return {
      upcoming: sorted.filter(h => new Date(h.holiday_date) >= now),
      past: sorted.filter(h => new Date(h.holiday_date) < now),
    };
  }, [holidays]);

  const kpis = [
    { label: 'Total Holidays', value: holidays?.length ?? 0 },
    { label: 'Upcoming', value: upcoming.length },
    { label: 'Past', value: past.length },
  ];

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday(id);
      message.success('Holiday deleted');
    } catch {
      message.error('Failed to delete holiday');
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditModal({ open: true, holiday });
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
        background: cardBg,
        borderRadius: 14,
        border: '1px solid ' + cardBrd,
      }}>
        <Spin size="large" />
        <span style={{ color: subCol, marginLeft: 12, fontFamily: sans }}>
          Loading holidays...
        </span>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 14,
      }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: cardBg,
              borderRadius: 12,
              padding: 16,
              border: '1px solid ' + cardBrd,
            }}
          >
            <div style={{
              fontSize: 9.5,
              color: subCol,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontFamily: sans,
              marginBottom: 6,
            }}>
              {kpi.label}
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: titleCol,
              fontFamily: mono,
              letterSpacing: -0.5,
            }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Add Holiday button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button
          onClick={() => setEditModal({ open: true, holiday: null })}
          style={{
            padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: accent, color: '#fff', fontWeight: 600, fontSize: 12.5,
            fontFamily: sans, transition: 'opacity 0.15s',
          }}
        >
          + Add Holiday
        </button>
      </div>

      {/* Upcoming Holidays */}
      {upcoming.length > 0 && (
        <div style={{
          background: cardBg,
          borderRadius: 14,
          border: '1px solid ' + cardBrd,
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid ' + cardBrd,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: accent,
              boxShadow: '0 0 8px ' + accent,
            }} />
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: titleCol,
              fontFamily: sans,
            }}>
              Upcoming Holidays
            </span>
          </div>
          {upcoming.map((h, i) => (
            <div
              key={h.id}
              style={{ borderTop: i > 0 ? '1px solid ' + rowBrd : 'none' }}
            >
              <HolidayRow
                holiday={h}
                isPast={false}
                onEdit={() => handleEdit(h)}
                onDelete={() => handleDelete(h.id)}
                isDeleting={isDeleting}
              />
            </div>
          ))}
        </div>
      )}

      {/* Past Holidays */}
      {past.length > 0 && (
        <div style={{
          background: cardBg,
          borderRadius: 14,
          border: '1px solid ' + cardBrd,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid ' + cardBrd,
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: subCol,
              fontFamily: sans,
            }}>
              Past Holidays
            </span>
          </div>
          {past.map((h, i) => (
            <div
              key={h.id}
              style={{ borderTop: i > 0 ? '1px solid ' + rowBrd : 'none' }}
            >
              <HolidayRow holiday={h} isPast={true} />
            </div>
          ))}
        </div>
      )}

      {/* Holiday Form Modal (add / edit) */}
      <HolidayFormModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, holiday: null })}
        selectedRange={editModal.holiday
          ? { start: editModal.holiday.holiday_date, end: editModal.holiday.holiday_date }
          : { start: dayjs().format('YYYY-MM-DD'), end: dayjs().format('YYYY-MM-DD') }
        }
        existingHolidays={editModal.holiday ? [editModal.holiday] : []}
      />
    </div>
  );
}
