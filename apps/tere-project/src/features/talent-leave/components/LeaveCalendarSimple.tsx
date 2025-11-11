'use client';
import React, { useMemo, useEffect, useState } from 'react';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import { useTalentLeave } from '../hooks/useTalentLeave';
import { useHolidays } from '../hooks/useHolidays';
import { generateDateRange } from '../utils/dateUtils';
import { groupByTeam, getCellColorClass } from '../utils/calendarUtils';
import { getSprintNameWithDateRange } from '../utils/sprintUtils';
import { Spin, Alert, Badge, Tooltip } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  CheckCircleFilled,
  EditOutlined,
} from '@ant-design/icons';

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

  // Group leave records by team
  const teamGroups = useMemo(() => {
    if (!leaveRecords) return [];
    return groupByTeam(leaveRecords, holidayDates, startDate, endDate);
  }, [leaveRecords, holidayDates, startDate, endDate]);

  // Loading state (including hydration guard)
  if (!isMounted || isLeaveLoading || isHolidaysLoading) {
    return (
      <div className="flex justify-center items-center p-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600 font-medium">
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

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div
        className="overflow-x-auto overflow-y-auto custom-scrollbar max-w-full max-h-[calc(10*3.5rem+8rem)]"
        role="region"
        aria-label="Talent leave calendar"
      >
        <table className="w-full border-collapse text-sm">
          {/* Table Header */}
          <thead className="bg-white shadow-md sticky top-0 z-30">
            <tr>
              {/* Static columns */}
              <th className="sticky left-0 z-40 bg-gradient-to-r from-indigo-50 to-blue-50 border border-gray-200 px-3 py-2 text-left shadow-lg" style={{ width: 60, minWidth: 60 }}>
                <div className="font-semibold text-gray-700">No</div>
              </th>
              <th className="sticky z-40 bg-gradient-to-r from-indigo-50 to-blue-50 border border-gray-200 px-3 py-2 text-left shadow-lg" style={{ left: 60, width: 150, minWidth: 150 }}>
                <div className="font-semibold text-gray-700">Nama</div>
              </th>
              <th className="sticky z-40 bg-gradient-to-r from-indigo-50 to-blue-50 border border-gray-200 px-3 py-2 text-center shadow-lg" style={{ left: 210, width: 80, minWidth: 80 }}>
                <div className="font-semibold text-gray-700">Jumlah</div>
              </th>
              <th className="sticky z-40 bg-gradient-to-r from-indigo-50 to-blue-50 border border-gray-200 px-3 py-2 text-left shadow-lg" style={{ left: 290, width: 180, minWidth: 180 }}>
                <div className="font-semibold text-gray-700 flex items-center gap-1">
                  <CalendarOutlined />
                  <span>Tanggal Cuti</span>
                </div>
              </th>

              {/* Date columns */}
              {dateColumnsWithHolidays.map(cell => {
                const headerBgColor = cell.isNationalHoliday
                  ? 'bg-gradient-to-br from-red-50 to-red-100'
                  : cell.isWeekend
                    ? 'bg-gradient-to-br from-slate-50 to-slate-100'
                    : 'bg-gradient-to-br from-gray-50 to-white';

                const holidayTextColor = cell.isNationalHoliday
                  ? 'text-red-700'
                  : 'text-gray-700';

                const date = new Date(cell.date);
                const day = date.getDate();

                const content = (
                  <div className={`${headerBgColor} p-2 rounded-md min-w-[70px]`}>
                    <div className={`text-lg font-bold ${holidayTextColor}`}>
                      {day}
                    </div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase">
                      {cell.dayName}
                    </div>
                    {cell.isHoliday && (
                      <div
                        className={`text-[9px] font-semibold ${holidayTextColor} mt-1 truncate`}
                      >
                        {cell.holidayName}
                      </div>
                    )}
                  </div>
                );

                return (
                  <th key={cell.date} className="border border-gray-200 px-1 py-1" style={{ minWidth: 70 }}>
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
                <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                  <td className="border border-indigo-200 px-4 py-3 sticky left-0 z-10 bg-gradient-to-r from-blue-100 to-indigo-100 shadow-md">
                    {/* Empty */}
                  </td>
                  <td
                    colSpan={3}
                    className="border border-indigo-200 px-4 py-3 sticky z-10 bg-gradient-to-r from-blue-100 to-indigo-100 shadow-md"
                    style={{ left: 60 }}
                  >
                    <div className="flex items-center gap-2 font-bold text-indigo-900">
                      <TeamOutlined className="text-lg" />
                      <span>{group.teamName}</span>
                      <Badge
                        count={group.members.length}
                        style={{ backgroundColor: '#4f46e5' }}
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
                            className="border border-indigo-200 px-2 py-1"
                          >
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-center py-2 px-3 rounded-lg shadow-md">
                              <div className="text-sm">{sprintName}</div>
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
                  <tr key={member.id} className="hover:bg-blue-50 transition-colors duration-150">
                    {/* Static columns */}
                    <td className="border border-gray-200 px-3 py-2 sticky left-0 z-10 bg-white shadow-sm" style={{ width: 60 }}>
                      <div className="text-center text-gray-600 font-medium">
                        {memberIdx + 1}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 sticky z-10 bg-white shadow-sm" style={{ left: 60, width: 150 }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-indigo-900 font-medium truncate flex-1">
                          {member.name}
                        </span>
                        <button
                          onClick={() => openEditModal(member.id)}
                          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1 rounded transition-all duration-150 flex-shrink-0"
                          title="Edit leave record"
                        >
                          <EditOutlined className="text-base" />
                        </button>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 sticky z-10 bg-white shadow-sm" style={{ left: 210, width: 80 }}>
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
                    <td className="border border-gray-200 px-3 py-2 sticky z-10 bg-white shadow-sm" style={{ left: 290, width: 180 }}>
                      <div className="text-xs text-gray-600 truncate" title={member.dateRange}>
                        {member.dateRange || '-'}
                      </div>
                    </td>

                    {/* Date cells */}
                    {dateColumnsWithHolidays.map(cell => {
                      const isLeaveDate = member.leaveDates.includes(cell.date);
                      const leaveStatus = isLeaveDate
                        ? member.leaveDatesWithStatus[cell.date]
                        : undefined;
                      const colorClass = getCellColorClass(
                        cell.isWeekend,
                        cell.isHoliday,
                        cell.isNationalHoliday,
                        isLeaveDate,
                        leaveStatus as 'Draft' | 'Confirmed' | undefined,
                      );
                      const showCheckmark = isLeaveDate && !cell.isWeekend && !cell.isHoliday;
                      const isDraft = leaveStatus === 'Draft';

                      return (
                        <td
                          key={cell.date}
                          className={`border border-gray-200 ${colorClass} relative overflow-hidden`}
                          style={{ minWidth: 70, maxWidth: 70, padding: 0 }}
                        >
                          <div className="h-full flex items-center justify-center py-2 px-2">
                            {showCheckmark && (
                              <CheckCircleFilled
                                className={`text-lg drop-shadow-md ${isDraft ? 'text-amber-600' : 'text-emerald-600'}`}
                              />
                            )}
                          </div>
                          {isLeaveDate && (
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1 ${isDraft ? 'bg-amber-500' : 'bg-emerald-600'}`}
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
          background: #f1f5f9;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
