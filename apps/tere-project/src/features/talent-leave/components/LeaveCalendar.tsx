'use client';
import { useTalentLeaveStore } from '../store/talentLeaveStore';
import { useTalentLeave } from '../hooks/useTalentLeave';
import { useHolidays } from '../hooks/useHolidays';
import { generateDateRange } from '../utils/dateUtils';
import { groupByTeam, getCellColorClass } from '../utils/calendarUtils';
import { getSprintNameWithDateRange } from '../utils/sprintUtils';
import { Spin, Alert } from 'antd';

export function LeaveCalendar() {
  const { selectedMonthStart, openEditModal } = useTalentLeaveStore();

  // Calculate date range: day 1 of selected month to last day of next month
  const startDate = (() => {
    const start = new Date(selectedMonthStart);
    start.setDate(1); // First day of selected month
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const endDate = (() => {
    const end = new Date(selectedMonthStart);
    end.setMonth(end.getMonth() + 2); // Move to month after next
    end.setDate(0); // Last day of next month
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

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

  // Generate date columns
  const dateColumns = generateDateRange(selectedMonthStart);

  // Mark holidays in date columns
  const dateColumnsWithHolidays = dateColumns.map(cell => {
    const holiday = holidays?.find(h => h.date === cell.date);
    return {
      ...cell,
      isHoliday: !!holiday,
      isNationalHoliday: holiday?.isNational || false,
      holidayName: holiday?.name,
    };
  });

  // Group data by sprint for sprint headers
  const sprintGroups = dateColumnsWithHolidays.reduce(
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

  // Extract holiday dates for leave count calculation
  const holidayDates = holidays?.map(h => h.date) || [];

  // Group by team (groupByTeam internally calls transformToRowData)
  // Pass visible date range so leave count only includes dates in current view
  const teamGroups = leaveRecords
    ? groupByTeam(leaveRecords, holidayDates, startDate, endDate)
    : [];

  // Loading state
  if (isLeaveLoading || isHolidaysLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spin size="large" />
      </div>
    );
  }

  // Error state
  if (isLeaveError) {
    return (
      <div className="p-4">
        <Alert
          message="Error"
          description="Failed to load leave records. Please try again later."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto"
      role="region"
      aria-label="Talent leave calendar"
    >
      <table
        className="w-full border-collapse text-sm"
        aria-label="Team member leave schedule"
      >
        <thead>
          {/* Sprint header row */}
          <tr>
            <th
              scope="col"
              colSpan={6}
              className="border border-gray-300 px-2 py-1 bg-gray-50"
            ></th>
            {dateColumnsWithHolidays.map(cell => {
              const sprintName = getSprintNameWithDateRange(
                new Date(cell.date),
              );
              const isFirstInSprint =
                sprintGroups[sprintName]?.[0]?.date === cell.date;
              return (
                <th
                  key={`sprint-${cell.date}`}
                  scope="col"
                  colSpan={
                    isFirstInSprint
                      ? sprintGroups[sprintName].length
                      : undefined
                  }
                  className={`border border-gray-300 px-2 py-1 bg-purple-100 font-bold text-center ${!isFirstInSprint ? 'hidden' : ''}`}
                >
                  {isFirstInSprint ? sprintName : ''}
                </th>
              );
            })}
          </tr>
          {/* Date header row */}
          <tr>
            <th
              scope="col"
              className="border border-gray-300 px-2 py-1 bg-gray-50 w-16"
            >
              No
            </th>
            <th
              scope="col"
              className="border border-gray-300 px-2 py-1 bg-gray-50 w-20 text-center"
            >
              Nama
            </th>
            <th
              scope="col"
              className="border border-gray-300 px-2 py-1 bg-gray-50 w-20 text-center"
            >
              Jumlah
            </th>
            <th
              scope="col"
              className="border border-gray-300 px-2 py-1 bg-gray-50 w-[150px]"
            >
              Tanggal Cuti
            </th>
            <th
              scope="col"
              className="border border-gray-300 px-2 py-1 bg-gray-50 w-28 text-center"
            >
              Status
            </th>
            <th
              scope="col"
              className="border border-gray-300 px-2 py-1 bg-gray-50 w-[120px]"
            >
              Role
            </th>
            {dateColumnsWithHolidays.map(cell => {
              // National holiday takes priority over weekend
              const headerBgColor =
                cell.isNationalHoliday
                  ? 'bg-red-100'
                  : cell.isWeekend
                    ? 'bg-slate-100'
                    : 'bg-gray-50';

              const holidayTextColor = cell.isNationalHoliday
                ? 'text-red-700'
                : 'text-gray-600';

              return (
                <th
                  key={cell.date}
                  scope="col"
                  className={`border border-gray-300 px-2 py-1 ${headerBgColor} min-w-[80px]`}
                  title={cell.isHoliday ? cell.holidayName : undefined}
                >
                  <div className="text-center">
                    <div className="text-xs">
                      {new Date(cell.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs font-normal">{cell.dayName}</div>
                    {cell.isHoliday && (
                      <div className={`text-xs font-semibold ${holidayTextColor} mt-0.5 truncate`}>
                        {cell.holidayName}
                      </div>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {teamGroups.map((teamGroup, teamIndex) => (
            <>
              {/* Team header row */}
              <tr key={`team-${teamIndex}`}>
                <td
                  colSpan={6 + dateColumnsWithHolidays.length}
                  className="border border-gray-300 px-2 py-2 bg-sky-100 font-bold"
                >
                  {teamGroup.teamName}
                </td>
              </tr>

              {/* Team member rows */}
              {teamGroup.members.map((member, memberIndex) => (
                <tr key={member.id}>
                  <td className="border border-gray-300 px-2 py-1 text-center w-16">
                    {memberIndex + 1}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 w-20">
                    <button
                      onClick={() => openEditModal(member.id)}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-left truncate block max-w-full"
                      aria-label={`Edit leave record for ${member.name}`}
                    >
                      {member.name}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center w-20">
                    {member.leaveCount}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 w-[150px]">
                    {member.dateRange}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center w-28">
                    {member.status}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 w-[120px]">
                    {member.role}
                  </td>
                  {dateColumnsWithHolidays.map(cell => {
                    const isLeaveDate = member.leaveDates.includes(cell.date);
                    const leaveStatus = isLeaveDate ? member.leaveDatesWithStatus[cell.date] : undefined;
                    const colorClass = getCellColorClass(
                      cell.isWeekend,
                      cell.isHoliday,
                      cell.isNationalHoliday,
                      isLeaveDate,
                      leaveStatus,
                    );
                    // Only show checkmark if it's a leave date AND not a weekend/holiday
                    const showCheckmark = isLeaveDate && !cell.isWeekend && !cell.isHoliday;
                    return (
                      <td
                        key={cell.date}
                        className={`border border-gray-300 px-2 py-1 ${colorClass}`}
                        title={cell.isHoliday ? cell.holidayName : undefined}
                      >
                        {showCheckmark && <div className="text-center">✓</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
