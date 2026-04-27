'use client';
import React, { useMemo, useEffect, useState } from 'react';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import { useTalentLeave } from '../hooks/useTalentLeave';
import { useHolidays } from '../hooks/useHolidays';
import { generateDateRange } from '../utils/dateUtils';
import { groupByTeam } from '../utils/calendarUtils';
import { getSprintNameWithDateRange } from '../utils/sprintUtils';
import { useThemeColors } from '@src/hooks/useTheme';
import { Spin, Alert, Badge, Tooltip } from 'antd';
import {
  TeamOutlined,
  CheckCircleFilled,
  EditOutlined,
} from '@ant-design/icons';

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

type CalendarCell = {
  date: string;
  dayName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  isNationalHoliday: boolean;
  holidayName?: string;
};

export function LeaveCalendarSimple() {
  const { dateRangeStart, dateRangeEnd, openEditModal } = useTalentLeaveStore();
  const [isMounted, setIsMounted] = useState(false);
  const {
    isDark, accent, accentL,
    cardBg, cardBrd, titleCol, subCol, rowCol, headBg,
  } = useThemeColors();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Format dates to YYYY-MM-DD
  const startDate = useMemo(() => {
    const year = dateRangeStart.getFullYear();
    const month = String(dateRangeStart.getMonth() + 1).padStart(2, '0');
    const day = String(dateRangeStart.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [dateRangeStart]);

  const endDate = useMemo(() => {
    const year = dateRangeEnd.getFullYear();
    const month = String(dateRangeEnd.getMonth() + 1).padStart(2, '0');
    const day = String(dateRangeEnd.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [dateRangeEnd]);

  // Fetch data
  const {
    data: leaveRecords,
    isLoading: isLeaveLoading,
    isError: isLeaveError,
  } = useTalentLeave();
  const { data: holidays, isLoading: isHolidaysLoading } = useHolidays(
    startDate,
    endDate,
  );

  // Generate date columns based on date range
  const dateColumns = useMemo(
    () => generateDateRange(dateRangeStart, dateRangeEnd),
    [dateRangeStart, dateRangeEnd]
  );

  // Mark holidays in date columns
  const dateColumnsWithHolidays = useMemo(() => {
    return dateColumns.map(cell => {
      const holiday = holidays?.find(h => h.date === cell.date);
      return {
        ...cell,
        isHoliday: !!holiday,
        isNationalHoliday: holiday?.isNational || false,
        holidayName: holiday?.name,
      };
    });
  }, [dateColumns, holidays]);

  // Group data by sprint for sprint headers
  const sprintGroups = useMemo(() => {
    const groups: Record<string, CalendarCell[]> = {};
    dateColumnsWithHolidays.forEach(cell => {
      const sprintName = getSprintNameWithDateRange(new Date(cell.date));
      if (!groups[sprintName]) {
        groups[sprintName] = [];
      }
      groups[sprintName].push(cell);
    });
    return groups;
  }, [dateColumnsWithHolidays]);

  // Extract holiday dates for leave count calculation
  const holidayDates = useMemo(
    () => holidays?.map(h => h.date) || [],
    [holidays],
  );

  // Helper function to check if a member has any future leave dates
  const hasFutureLeaveDates = (member: { dateRanges: Array<{ dateFrom: string; dateTo: string }> }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return member.dateRanges.some(range => new Date(range.dateTo) >= today);
  };

  // Group leave records by team
  const teamGroups = useMemo(() => {
    if (!leaveRecords) return [];
    return groupByTeam(leaveRecords, holidayDates, startDate, endDate);
  }, [leaveRecords, holidayDates, startDate, endDate]);

  // Theme-aware cell background
  const getCellBg = (cell: CalendarCell, isLeaveDate: boolean, leaveStatus?: string) => {
    if (cell.isNationalHoliday) return isDark ? '#2a0f10' : '#fee2e2';
    if (cell.isWeekend) return isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9';
    if (isLeaveDate) {
      if (leaveStatus === 'Draft') return isDark ? '#2e1f08' : '#fef3c7';
      if (leaveStatus === 'Sick') return isDark ? '#1a0f2e' : '#ede9fe';
      return isDark ? '#0a2a1e' : '#d1fae5'; // Confirmed
    }
    return cardBg;
  };

  // Loading state (including hydration guard)
  if (!isMounted || isLeaveLoading || isHolidaysLoading) {
    return (
      <div
        className="flex justify-center items-center p-12"
        style={{ background: cardBg, borderRadius: 12, border: '1px solid ' + cardBrd }}
      >
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 font-medium" style={{ color: subCol }}>
            Loading calendar data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isLeaveError) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Calendar"
          description="Failed to load leave records. Please try again later."
          type="error"
          showIcon
          className="shadow-lg"
        />
      </div>
    );
  }

  // Shared sticky header cell style
  const stickyHeaderBase: React.CSSProperties = {
    background: headBg,
    borderColor: cardBrd,
    borderWidth: 1,
    borderStyle: 'solid',
  };

  const headerLabelStyle: React.CSSProperties = {
    color: titleCol,
    fontFamily: sans,
    fontSize: 9.5,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  };

  // Team header tinted background
  const teamBg = isDark ? accent + '15' : accent + '08';

  return (
    <div style={{ background: cardBg, borderRadius: 14, border: '1px solid ' + cardBrd }}>
      <div
        className="overflow-x-auto overflow-y-auto custom-scrollbar max-w-full max-h-[calc(10*3.5rem+8rem)]"
        role="region"
        aria-label="Talent leave calendar"
      >
        <table className="w-full border-collapse text-sm">
          {/* Table Header */}
          <thead className="sticky top-0 z-30" style={{ background: cardBg }}>
            <tr>
              {/* Static columns */}
              <th
                className="sticky left-0 z-40 px-3 py-2 text-left"
                style={{ ...stickyHeaderBase, width: 60, minWidth: 60 }}
              >
                <div style={headerLabelStyle}>No</div>
              </th>
              <th
                className="sticky z-40 px-3 py-2 text-left"
                style={{ ...stickyHeaderBase, left: 60, width: 150, minWidth: 150 }}
              >
                <div style={headerLabelStyle}>Nama</div>
              </th>
              <th
                className="sticky z-40 px-3 py-2 text-center"
                style={{ ...stickyHeaderBase, left: 210, width: 80, minWidth: 80 }}
              >
                <div style={headerLabelStyle}>Jumlah</div>
              </th>
              <th
                className="sticky z-40 px-3 py-2 text-left"
                style={{ ...stickyHeaderBase, left: 290, width: 180, minWidth: 180 }}
              >
                <div className="flex items-center gap-1" style={headerLabelStyle}>
                  <span>Tanggal Cuti Terdekat</span>
                </div>
              </th>

              {/* Date columns */}
              {dateColumnsWithHolidays.map(cell => {
                const dateBg = cell.isNationalHoliday
                  ? (isDark ? '#2a0f10' : '#fff5f5')
                  : cell.isWeekend
                    ? (isDark ? 'rgba(255,255,255,0.03)' : '#fafbfd')
                    : headBg;

                const date = new Date(cell.date);
                const day = date.getDate();

                const content = (
                  <div className="p-2 rounded-md min-w-[70px]" style={{ background: dateBg }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: mono,
                        color: cell.isNationalHoliday ? '#ef4444' : titleCol,
                      }}
                    >
                      {day}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: subCol,
                        textTransform: 'uppercase',
                        fontFamily: sans,
                      }}
                    >
                      {cell.dayName}
                    </div>
                    {cell.isHoliday && (
                      <div
                        className="mt-1 truncate"
                        style={{ fontSize: 9, fontWeight: 600, color: '#ef4444' }}
                      >
                        {cell.holidayName}
                      </div>
                    )}
                  </div>
                );

                return (
                  <th
                    key={cell.date}
                    className="px-1 py-1"
                    style={{ minWidth: 70, borderWidth: 1, borderStyle: 'solid', borderColor: cardBrd }}
                  >
                    {cell.isHoliday ? (
                      <Tooltip title={cell.holidayName}>{content}</Tooltip>
                    ) : (
                      content
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {teamGroups.map((group) => (
              <React.Fragment key={group.teamName}>
                {/* Team Header Row */}
                <tr style={{ background: teamBg }}>
                  <td
                    className="px-4 py-3 sticky left-0 z-10 shadow-md"
                    style={{ background: teamBg, borderWidth: 1, borderStyle: 'solid', borderColor: cardBrd }}
                  >
                    {/* Empty */}
                  </td>
                  <td
                    colSpan={3}
                    className="px-4 py-3 sticky z-10 shadow-md"
                    style={{ left: 60, background: teamBg, borderWidth: 1, borderStyle: 'solid', borderColor: cardBrd }}
                  >
                    <div className="flex items-center gap-2">
                      <TeamOutlined className="text-lg" style={{ color: accent }} />
                      <span style={{ color: titleCol, fontFamily: sans, fontWeight: 700 }}>
                        {group.teamName}
                      </span>
                      <Badge
                        count={group.members.length}
                        style={{ backgroundColor: accent }}
                      />
                    </div>
                  </td>

                  {/* Sprint headers for team row */}
                  {(() => {
                    const sprintCells: React.ReactElement[] = [];
                    const renderedSprints = new Set<string>();

                    dateColumnsWithHolidays.forEach((cell) => {
                      const sprintName = getSprintNameWithDateRange(new Date(cell.date));

                      // Only render if we haven't rendered this sprint yet
                      if (!renderedSprints.has(sprintName)) {
                        renderedSprints.add(sprintName);
                        const sprintDates = sprintGroups[sprintName] || [];

                        sprintCells.push(
                          <td
                            key={`sprint-${sprintName}`}
                            colSpan={sprintDates.length}
                            className="px-2 py-1"
                            style={{ borderWidth: 1, borderStyle: 'solid', borderColor: cardBrd }}
                          >
                            <div
                              style={{
                                background: 'linear-gradient(135deg, ' + accent + ', ' + accentL + ')',
                                color: '#fff',
                                fontWeight: 700,
                                textAlign: 'center',
                                padding: '8px 12px',
                                borderRadius: 8,
                                fontFamily: sans,
                                fontSize: 12,
                              }}
                            >
                              <div>{sprintName}</div>
                            </div>
                          </td>
                        );
                      }
                    });

                    return sprintCells;
                  })()}
                </tr>

                {/* Member Rows */}
                {group.members.map((member, memberIdx) => (
                  <tr key={member.id} className="transition-colors duration-150">
                    {/* Static columns */}
                    <td
                      className="px-3 py-2 sticky left-0 z-10 shadow-sm"
                      style={{ width: 60, background: cardBg, borderWidth: 1, borderStyle: 'solid', borderColor: cardBrd }}
                    >
                      <div className="text-center" style={{ color: subCol, fontFamily: sans, fontWeight: 500 }}>
                        {memberIdx + 1}
                      </div>
                    </td>
                    <td
                      className="px-3 py-2 sticky z-10 shadow-sm"
                      style={{ left: 60, width: 150, background: cardBg, borderWidth: 1, borderStyle: 'solid', borderColor: cardBrd }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="truncate flex-1"
                          style={{ color: rowCol, fontFamily: sans, fontWeight: 500 }}
                        >
                          {member.name}
                        </span>
                        {hasFutureLeaveDates(member) && (
                          <button
                            onClick={() => openEditModal(member.id)}
                            className="p-1 rounded transition-all duration-150 flex-shrink-0"
                            style={{ color: accent }}
                            title="Edit leave record"
                          >
                            <EditOutlined className="text-base" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-3 py-2 sticky z-10 shadow-sm"
                      style={{ left: 210, width: 80, background: cardBg, borderWidth: 1, borderStyle: 'solid', borderColor: cardBrd }}
                    >
                      <div className="text-center">
                        <Badge
                          count={member.leaveCount}
                          showZero
                          style={{
                            backgroundColor: member.leaveCount > 0 ? '#52c41a' : '#d9d9d9',
                            fontWeight: 'bold',
                          }}
                        />
                      </div>
                    </td>
                    <td
                      className="px-3 py-2 sticky z-10 shadow-sm"
                      style={{ left: 290, width: 180, background: cardBg, borderWidth: 1, borderStyle: 'solid', borderColor: cardBrd }}
                    >
                      <div
                        className="truncate"
                        style={{ color: subCol, fontSize: 12, fontFamily: sans }}
                        title={member.dateRange}
                      >
                        {member.dateRange || '-'}
                      </div>
                    </td>

                    {/* Date cells */}
                    {dateColumnsWithHolidays.map(cell => {
                      const isLeaveDate = member.leaveDates.includes(cell.date);
                      const leaveStatus = isLeaveDate
                        ? member.leaveDatesWithStatus[cell.date]
                        : undefined;
                      const cellBg = getCellBg(cell, isLeaveDate, leaveStatus);
                      const showCheckmark = isLeaveDate && !cell.isWeekend && !cell.isNationalHoliday;
                      const isDraft = leaveStatus === 'Draft';
                      const isSick = leaveStatus === 'Sick';

                      return (
                        <td
                          key={cell.date}
                          className="relative overflow-hidden"
                          style={{ minWidth: 70, maxWidth: 70, padding: 0, background: cellBg, borderWidth: 1, borderStyle: 'solid', borderColor: cardBrd }}
                        >
                          <div className="h-full flex items-center justify-center py-2 px-2">
                            {showCheckmark && (
                              <CheckCircleFilled
                                className={`text-lg drop-shadow-md ${
                                  isDraft ? 'text-amber-600' : isSick ? 'text-purple-600' : 'text-emerald-600'
                                }`}
                              />
                            )}
                          </div>
                          {isLeaveDate && (
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1 ${
                                isDraft ? 'bg-amber-500' : isSick ? 'bg-purple-600' : 'bg-emerald-600'
                              }`}
                            ></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'};
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${accent};
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${accentL};
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'};
        }
      `}</style>
    </div>
  );
}
