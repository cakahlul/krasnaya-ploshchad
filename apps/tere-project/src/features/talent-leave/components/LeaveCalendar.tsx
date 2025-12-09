'use client';
import React, { useMemo, useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import { useTalentLeave } from '../hooks/useTalentLeave';
import { useHolidays } from '../hooks/useHolidays';
import { generateDateRange } from '../utils/dateUtils';
import { groupByTeam, getCellColorClass } from '../utils/calendarUtils';
import {
  getSprintNameWithDateRange,
  getSprintStartDate,
} from '../utils/sprintUtils';
import { Spin, Alert, Badge, Tooltip } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';

type TeamMember = {
  id: string;
  name: string;
  team: string;
  role: string;
  leaveCount: number;
  dateRange: string;
  status: string;
  leaveDates: string[];
  leaveDatesWithStatus: Record<string, string>;
};

type TeamGroup = {
  teamName: string;
  members: TeamMember[];
};

export function LeaveCalendar() {
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
    [dateRangeStart, dateRangeEnd],
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
    return dateColumnsWithHolidays.reduce(
      (acc, cell) => {
        const sprintName = getSprintNameWithDateRange(new Date(cell.date));
        if (!acc[sprintName]) {
          acc[sprintName] = [];
        }
        acc[sprintName].push(cell);
        return acc;
      },
      {} as Record<string, typeof dateColumnsWithHolidays>,
    );
  }, [dateColumnsWithHolidays]);

  // Extract holiday dates for leave count calculation
  const holidayDates = useMemo(
    () => holidays?.map(h => h.date) || [],
    [holidays],
  );

  // Group by team
  const teamGroups = useMemo(
    () =>
      leaveRecords
        ? groupByTeam(leaveRecords, holidayDates, startDate, endDate)
        : [],
    [leaveRecords, holidayDates, startDate, endDate],
  );

  // Flatten team groups into rows for the table
  const tableData = useMemo(() => {
    const rows: Array<{
      type: 'team' | 'member';
      data: TeamGroup | TeamMember;
      teamName?: string;
    }> = [];
    teamGroups.forEach(group => {
      rows.push({ type: 'team', data: group });
      group.members.forEach(member => {
        rows.push({ type: 'member', data: member, teamName: group.teamName });
      });
    });
    return rows;
  }, [teamGroups]);

  // Define columns
  const columns = useMemo<ColumnDef<(typeof tableData)[number]>[]>(() => {
    const staticColumns: ColumnDef<(typeof tableData)[number]>[] = [
      {
        id: 'no',
        header: () => <div className="font-semibold text-gray-700">No</div>,
        cell: ({ row }) => {
          if (row.original.type === 'team') return null;
          const memberIndex = tableData
            .filter(
              r => r.type === 'member' && r.teamName === row.original.teamName,
            )
            .findIndex(r => r.data === row.original.data);
          return (
            <div className="text-center font-medium text-gray-600">
              {memberIndex + 1}
            </div>
          );
        },
        size: 60,
      },
      {
        id: 'name',
        header: () => <div className="font-semibold text-gray-700">Nama</div>,
        cell: ({ row }) => {
          if (row.original.type === 'team') {
            const group = row.original.data as TeamGroup;
            return (
              <div className="flex items-center gap-2 font-bold text-blue-900 py-1">
                <TeamOutlined className="text-lg" />
                <span>{group.teamName}</span>
                <Badge
                  count={group.members.length}
                  style={{ backgroundColor: '#1677ff' }}
                />
              </div>
            );
          }
          const member = row.original.data as TeamMember;
          return (
            <button
              onClick={() => openEditModal(member.id)}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left w-full transition-all duration-200"
            >
              {member.name}
            </button>
          );
        },
        size: 150,
      },
      {
        id: 'count',
        header: () => (
          <div className="font-semibold text-gray-700 text-center">Jumlah</div>
        ),
        cell: ({ row }) => {
          if (row.original.type === 'team') return null;
          const member = row.original.data as TeamMember;
          return (
            <div className="text-center">
              <Badge
                count={member.leaveCount}
                showZero
                style={{
                  backgroundColor:
                    member.leaveCount > 0 ? '#52c41a' : '#d9d9d9',
                  fontWeight: 'bold',
                }}
              />
            </div>
          );
        },
        size: 80,
      },
      {
        id: 'dateRange',
        header: () => (
          <div className="font-semibold text-gray-700 flex items-center gap-1">
            <CalendarOutlined />
            <span>Tanggal Cuti</span>
          </div>
        ),
        cell: ({ row }) => {
          if (row.original.type === 'team') return null;
          const member = row.original.data as TeamMember;
          return (
            <div
              className="text-xs text-gray-600 truncate"
              title={member.dateRange}
            >
              {member.dateRange || '-'}
            </div>
          );
        },
        size: 180,
      },
      {
        id: 'status',
        header: () => (
          <div className="font-semibold text-gray-700 text-center">Status</div>
        ),
        cell: ({ row }) => {
          if (row.original.type === 'team') return null;
          const member = row.original.data as TeamMember;
          const statusColor =
            member.status === 'Confirmed' ? '#faad14' : '#d9d9d9';
          return (
            <div className="text-center">
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{ backgroundColor: statusColor, color: '#000' }}
              >
                {member.status || 'N/A'}
              </span>
            </div>
          );
        },
        size: 100,
      },
      {
        id: 'role',
        header: () => <div className="font-semibold text-gray-700">Role</div>,
        cell: ({ row }) => {
          if (row.original.type === 'team') return null;
          const member = row.original.data as TeamMember;
          return (
            <div className="text-xs text-gray-600 truncate">{member.role}</div>
          );
        },
        size: 120,
      },
    ];

    // Add date columns
    const dynamicColumns: ColumnDef<(typeof tableData)[number]>[] =
      dateColumnsWithHolidays.map(cell => ({
        id: cell.date,
        header: () => {
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

          return cell.isHoliday ? (
            <Tooltip title={cell.holidayName}>{content}</Tooltip>
          ) : (
            content
          );
        },
        cell: ({ row }) => {
          if (row.original.type === 'team') {
            // Get sprint info for this date
            const sprintName = getSprintNameWithDateRange(new Date(cell.date));
            const sprintStart = getSprintStartDate(new Date(cell.date));
            const isFirstInSprint =
              sprintStart.toISOString().split('T')[0] === cell.date;

            if (isFirstInSprint) {
              const sprintDates = sprintGroups[sprintName] || [];
              return {
                colSpan: sprintDates.length,
                content: (
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-center py-2 px-3 rounded-lg shadow-md">
                    <div className="text-sm">{sprintName}</div>
                  </div>
                ),
              };
            }
            return { colSpan: 0, content: null };
          }

          const member = row.original.data as TeamMember;
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
          const showCheckmark =
            isLeaveDate && !cell.isWeekend && !cell.isNationalHoliday;

          return (
            <div
              className={`${colorClass} h-full flex items-center justify-center transition-all duration-200 hover:scale-110`}
            >
              {showCheckmark && (
                <CheckCircleFilled className="text-green-600 text-lg drop-shadow-md" />
              )}
            </div>
          );
        },
        size: 70,
      }));

    return [...staticColumns, ...dynamicColumns];
  }, [dateColumnsWithHolidays, tableData, sprintGroups, openEditModal]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

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
        className="overflow-x-auto custom-scrollbar max-w-full"
        role="region"
        aria-label="Talent leave calendar"
      >
        <table className="w-full border-collapse text-sm">
          <thead className="bg-white shadow-md">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => {
                  const isSticky = idx < 4; // First 4 columns are sticky (No, Nama, Jumlah, Tanggal Cuti)
                  const stickyLeft =
                    idx === 0
                      ? 0
                      : idx === 1
                        ? 60
                        : idx === 2
                          ? 210
                          : idx === 3
                            ? 290
                            : undefined;

                  return (
                    <th
                      key={header.id}
                      className={`
                        border-b-2 border-gray-300 px-3 py-3 text-left
                        ${isSticky ? 'sticky bg-gradient-to-r from-indigo-50 to-blue-50 z-20 shadow-lg' : 'bg-gradient-to-br from-gray-50 to-white'}
                      `}
                      style={{
                        ...(isSticky && { left: stickyLeft }),
                        width: header.getSize(),
                        minWidth: header.getSize(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => {
              const isTeamRow = row.original.type === 'team';
              return (
                <tr
                  key={row.id}
                  className={`
                    ${isTeamRow ? 'bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200' : 'hover:bg-blue-50'}
                    transition-colors duration-150
                  `}
                >
                  {row.getVisibleCells().map((cell, idx) => {
                    const cellContent = flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    );
                    const isSticky = idx < 4; // First 4 columns are sticky (No, Nama, Jumlah, Tanggal Cuti)
                    const stickyLeft =
                      idx === 0
                        ? 0
                        : idx === 1
                          ? 60
                          : idx === 2
                            ? 210
                            : idx === 3
                              ? 290
                              : undefined;

                    // Handle dynamic colspan for sprint headers
                    if (
                      typeof cellContent === 'object' &&
                      cellContent &&
                      'colSpan' in cellContent &&
                      'content' in cellContent
                    ) {
                      const spanContent = cellContent as unknown as {
                        colSpan: number;
                        content: React.ReactNode;
                      };
                      if (spanContent.colSpan === 0) return null;
                      return (
                        <td
                          key={cell.id}
                          colSpan={spanContent.colSpan}
                          className="border border-gray-200 px-2 py-1"
                        >
                          {spanContent.content}
                        </td>
                      );
                    }

                    // Team row - render each cell to maintain sticky behavior
                    if (isTeamRow) {
                      if (idx === 0) {
                        // First column: render sticky with team name
                        return (
                          <td
                            key={cell.id}
                            className="border border-indigo-200 px-4 py-3 sticky bg-gradient-to-r from-blue-100 to-indigo-100 z-10 shadow-md"
                            style={{ left: 0 }}
                          >
                            {/* Empty for No column */}
                          </td>
                        );
                      }
                      if (idx === 1) {
                        // Second column: render sticky with team name
                        return (
                          <td
                            key={cell.id}
                            colSpan={3}
                            className="border border-indigo-200 px-4 py-3 sticky bg-gradient-to-r from-blue-100 to-indigo-100 z-10 shadow-md"
                            style={{ left: 60 }}
                          >
                            {cellContent}
                          </td>
                        );
                      }
                      if (idx < 4) {
                        // Skip columns 2 and 3 as they're included in colspan
                        return null;
                      }
                      // Other columns: render with team styling but not sticky
                      return (
                        <td
                          key={cell.id}
                          className="border border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50"
                        >
                          {/* Empty cell with team styling */}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={cell.id}
                        className={`
                          border border-gray-200 px-3 py-2
                          ${isSticky ? 'sticky bg-white z-10 shadow-sm' : ''}
                        `}
                        style={{
                          ...(isSticky && { left: stickyLeft }),
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                        }}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
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
          border: 2px solid #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
      `}</style>
    </div>
  );
}
