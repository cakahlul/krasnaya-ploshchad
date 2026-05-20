'use client';

import { useMemo } from 'react';
import { useTalentLeave } from '../hooks/useTalentLeave';
import { useHolidays } from '../hooks/useHolidays';
import { useLeaveDelete } from '../hooks/useLeaveDelete';
import { useLeaveUpdate } from '../hooks/useLeaveUpdate';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import { useThemeColors } from '@src/hooks/useTheme';
import { calculateDayCount } from '../utils/dateUtils';
import { Spin, Popconfirm, Button } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TalentLeaveResponse, LeaveDateRange } from '../types/talent-leave.types';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

interface FlattenedLeave {
  recordId: string;
  memberName: string;
  team: string;
  dateFrom: string;
  dateTo: string;
  status: 'Draft' | 'Confirmed' | 'Sick';
  dayCount: number;
}

function getStatusStyle(status: string, isDark: boolean, pal: { statusSuccess: string; statusSuccessBg: string; statusSuccessBrd: string; statusWarning: string; statusWarningBg: string; statusWarningBrd: string; statusPurple: string; statusPurpleBg: string; statusPurpleBrd: string }) {
  if (status === 'Confirmed') return { color: pal.statusSuccess, bg: pal.statusSuccessBg, brd: pal.statusSuccessBrd };
  if (status === 'Draft') return { color: pal.statusWarning, bg: pal.statusWarningBg, brd: pal.statusWarningBrd };
  if (status === 'Sick') return { color: pal.statusPurple, bg: pal.statusPurpleBg, brd: pal.statusPurpleBrd };
  return { color: '#9ca3af', bg: isDark ? 'rgba(255,255,255,0.06)' : '#f5f6fb', brd: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' };
}

function getTypeLabel(status: string): { icon: string; label: string } {
  if (status === 'Sick') return { icon: '🩺', label: 'Sick Leave' };
  if (status === 'Draft') return { icon: '📝', label: 'Draft Leave' };
  return { icon: '✈', label: 'Confirmed Leave' };
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function LeaveListView() {
  const { isDark, accent, cardBg, cardBrd, titleCol, subCol, rowCol,
    statusSuccess, statusSuccessBg, statusSuccessBrd,
    statusWarning, statusWarningBg, statusWarningBrd,
    statusPurple, statusPurpleBg, statusPurpleBrd } = useThemeColors();
  const { dateRangeStart, dateRangeEnd, openEditModal } = useTalentLeaveStore();
  const { data: leaveRecords, isLoading } = useTalentLeave();
  const { member } = useMemberProfile();
  const canEdit = !!member;
  const deleteMutation = useLeaveDelete();
  const updateMutation = useLeaveUpdate();

  const startDate = useMemo(() => {
    const y = dateRangeStart.getFullYear();
    const m = String(dateRangeStart.getMonth() + 1).padStart(2, '0');
    const d = String(dateRangeStart.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [dateRangeStart]);

  const endDate = useMemo(() => {
    const y = dateRangeEnd.getFullYear();
    const m = String(dateRangeEnd.getMonth() + 1).padStart(2, '0');
    const d = String(dateRangeEnd.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [dateRangeEnd]);

  const { data: holidays } = useHolidays(startDate, endDate);
  const holidayDates = useMemo(() => holidays?.map(h => h.date) || [], [holidays]);

  // Flatten all leave records into individual leave rows
  const flatLeaves: FlattenedLeave[] = useMemo(() => {
    if (!leaveRecords) return [];
    const result: FlattenedLeave[] = [];
    leaveRecords.forEach((record: TalentLeaveResponse) => {
      record.leaveDate.forEach((range: LeaveDateRange) => {
        // Only include ranges that overlap with the visible date range
        const rangeStart = new Date(range.dateFrom);
        const rangeEnd = new Date(range.dateTo);
        const visibleStart = new Date(startDate);
        const visibleEnd = new Date(endDate);
        if (rangeEnd < visibleStart || rangeStart > visibleEnd) return;

        const clippedFrom = rangeStart < visibleStart ? startDate : range.dateFrom.split('T')[0];
        const clippedTo = rangeEnd > visibleEnd ? endDate : range.dateTo.split('T')[0];
        const dayCount = calculateDayCount(clippedFrom, clippedTo, holidayDates);

        result.push({
          recordId: record.id,
          memberName: record.name,
          team: record.team,
          dateFrom: range.dateFrom.split('T')[0],
          dateTo: range.dateTo.split('T')[0],
          status: range.status,
          dayCount,
        });
      });
    });
    // Sort by date descending (most recent first)
    result.sort((a, b) => new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime());
    return result;
  }, [leaveRecords, startDate, endDate, holidayDates]);

  // KPI calculations
  const totalRequests = flatLeaves.length;
  const totalDays = flatLeaves.reduce((s, l) => s + l.dayCount, 0);
  const confirmed = flatLeaves.filter(l => l.status === 'Confirmed').length;
  const draft = flatLeaves.filter(l => l.status === 'Draft').length;
  const sick = flatLeaves.filter(l => l.status === 'Sick').length;

  const kpis = [
    { label: 'Total Requests', value: totalRequests },
    { label: 'Total Days', value: totalDays },
    { label: 'Confirmed', value: confirmed, col: statusSuccess },
    { label: 'Draft', value: draft, col: statusWarning },
    { label: 'Sick', value: sick, col: statusPurple },
  ];

  const handleDelete = async (leave: FlattenedLeave) => {
    const record = leaveRecords?.find((r) => r.id === leave.recordId);
    if (!record) return;
    const remaining = record.leaveDate.filter((r) => {
      const rFrom = r.dateFrom.split('T')[0];
      const rTo = r.dateTo.split('T')[0];
      return !(rFrom === leave.dateFrom && rTo === leave.dateTo && r.status === leave.status);
    });
    if (remaining.length === 0) {
      await deleteMutation.mutateAsync(record.id);
    } else {
      await updateMutation.mutateAsync({
        id: record.id,
        data: { name: record.name, team: record.team, leaveDate: remaining },
      });
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48, background: cardBg, borderRadius: 14, border: '1px solid ' + cardBrd }}>
        <Spin size="large" />
        <span style={{ color: subCol, marginLeft: 12, fontFamily: sans }}>Loading leave records...</span>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: cardBg, borderRadius: 12, padding: 16, border: '1px solid ' + cardBrd }}>
            <div style={{ fontSize: 9.5, color: subCol, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontFamily: sans, marginBottom: 6 }}>
              {k.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.col || titleCol, fontFamily: mono, letterSpacing: -0.5 }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Leave Records List */}
      {flatLeaves.length === 0 ? (
        <div style={{ background: cardBg, borderRadius: 14, border: '1px solid ' + cardBrd, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          <div style={{ color: subCol, fontSize: 13, fontFamily: sans }}>No leave records found in this date range</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {flatLeaves.map((leave, i) => {
            const ss = getStatusStyle(leave.status, isDark, { statusSuccess, statusSuccessBg, statusSuccessBrd, statusWarning, statusWarningBg, statusWarningBrd, statusPurple, statusPurpleBg, statusPurpleBrd });
            const typeInfo = getTypeLabel(leave.status);
            return (
              <div
                key={`${leave.recordId}-${leave.dateFrom}-${i}`}
                style={{
                  background: cardBg,
                  borderRadius: 12,
                  padding: '16px 18px',
                  border: '1px solid ' + cardBrd,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                {/* Type icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: accent + '12',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {typeInfo.icon}
                </div>

                {/* Member + type */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: rowCol, fontFamily: sans, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {leave.memberName}
                  </div>
                  <div style={{ fontSize: 11.5, color: subCol, fontFamily: sans, marginTop: 2 }}>
                    {typeInfo.label}
                  </div>
                </div>

                {/* Team badge */}
                <span style={{
                  background: accent + '15', color: accent,
                  fontSize: 10, fontWeight: 600,
                  padding: '2px 7px', borderRadius: 5,
                  fontFamily: sans, flexShrink: 0,
                }}>
                  {leave.team}
                </span>

                {/* Date range */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontFamily: mono, fontSize: 12, color: rowCol, fontWeight: 600 }}>
                    {formatShortDate(leave.dateFrom)}
                  </div>
                  <div style={{ fontFamily: sans, fontSize: 10, color: subCol, margin: '2px 0' }}>to</div>
                  <div style={{ fontFamily: mono, fontSize: 12, color: rowCol, fontWeight: 600 }}>
                    {formatShortDate(leave.dateTo)}
                  </div>
                </div>

                {/* Day count */}
                <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: titleCol, fontFamily: mono, lineHeight: 1 }}>
                    {leave.dayCount}
                  </div>
                  <div style={{ fontSize: 10, color: subCol, fontFamily: sans }}>
                    day{leave.dayCount !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Status badge */}
                <div style={{
                  background: ss.bg, border: '1px solid ' + ss.brd,
                  borderRadius: 8, padding: '5px 12px', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: ss.color, fontFamily: sans }}>
                    {leave.status}
                  </span>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      aria-label={`Edit leave for ${leave.memberName}`}
                      onClick={() => openEditModal(leave.recordId)}
                      style={{ color: accent }}
                    />
                    <Popconfirm
                      title="Delete this leave?"
                      description={`Remove ${formatShortDate(leave.dateFrom)} → ${formatShortDate(leave.dateTo)} for ${leave.memberName}?`}
                      okText="Delete"
                      okButtonProps={{ danger: true, loading: deleteMutation.isPending || updateMutation.isPending }}
                      cancelText="Cancel"
                      onConfirm={() => handleDelete(leave)}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`Delete leave for ${leave.memberName}`}
                      />
                    </Popconfirm>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
