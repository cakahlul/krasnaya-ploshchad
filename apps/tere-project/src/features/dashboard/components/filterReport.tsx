import { EpicSelect } from './epicSelect';
import { TeamSelect } from './TeamSelect';
import { SprintSelect } from './SprintSelect';
import { DateRangeSelect } from './DateRangeSelect';
import { useSprintDataTransform } from '../hooks/useSprintDataTransform';
import { useSprintFilterStore } from '../store/sprintFilterStore';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';
import dayjs from 'dayjs';
import './FilterReport.css';

export function FilterReport() {
  const { sprints, isLoading } = useSprintDataTransform();
  const board = useSprintFilterStore(state => state.board);
  const setBoardId = useSprintFilterStore(state => state.setSelectedBoard);

  const boardNameMap: Record<number, string> = {
    143: 'DS',
    142: 'SLS',
  };

  const teamOptions = [
    { value: 143, label: 'Funding - DS Board' },
    { value: 142, label: 'Lending - SLS Board' },
  ];

  const { sprint, startDate, endDate } = useTeamReportFilterStore(
    state => state.selectedFilter,
  );
  const setSprintFilter = useTeamReportFilterStore(state => state.setSprintFilter);
  const setDateRangeFilter = useTeamReportFilterStore(state => state.setDateRangeFilter);
  const clearFilter = useTeamReportFilterStore(state => state.clearFilter);

  const handleTeamChange = (value: number) => {
    if (board.id !== value) {
      clearFilter();
    }
    setBoardId({ id: value, name: boardNameMap[value] });
  };

  const handleSprintChange = (value: string) => {
    setSprintFilter(value, board.name);
  };

  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRangeFilter(
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD'),
        board.name,
      );
    } else {
      clearFilter();
    }
  };

  const isSprintMode = !!sprint;
  const isDateRangeMode = !!startDate && !!endDate;

  return (
    <div className="filter-bar">
      <div className="filter-bar__row">
        {/* Team Select */}
        <div className="filter-bar__group">
          <label className="filter-bar__label">
            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
              <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
            </svg>
            Team
          </label>
          <TeamSelect
            options={teamOptions}
            value={board.id || undefined}
            onChange={handleTeamChange}
          />
        </div>

        <div className="filter-bar__divider" />

        {/* Sprint Select */}
        <div className="filter-bar__group">
          <label className="filter-bar__label">
            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.451a.75.75 0 000-1.5H4.5a.75.75 0 00-.75.75v3.75a.75.75 0 001.5 0v-2.127l.269.269a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-10.624-2.85a5.5 5.5 0 019.201-2.465l.312.311H11.75a.75.75 0 000 1.5H15.5a.75.75 0 00.75-.75V3.42a.75.75 0 00-1.5 0v2.126l-.269-.268A7 7 0 002.769 8.416a.75.75 0 001.449.389l.47.769z" clipRule="evenodd" />
            </svg>
            Sprint
            {isSprintMode && (
              <span className="filter-bar__badge filter-bar__badge--blue">● Active</span>
            )}
          </label>
          <SprintSelect
            sprints={sprints}
            value={sprint || undefined}
            onChange={handleSprintChange}
            onClear={() => clearFilter()}
            loading={isLoading}
          />
        </div>

        <div className="filter-bar__or">or</div>

        {/* Date Range Select */}
        <div className="filter-bar__group">
          <label className="filter-bar__label">
            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
            </svg>
            Date Range
            {isDateRangeMode && (
              <span className="filter-bar__badge filter-bar__badge--purple">● Active</span>
            )}
          </label>
          <DateRangeSelect
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
            isActive={isDateRangeMode}
          />
        </div>

        <div className="filter-bar__divider" />

        <EpicSelect />
      </div>

      {/* Helper text */}
      <div className="filter-bar__hint">
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        {isSprintMode
          ? 'Showing report based on selected sprint'
          : isDateRangeMode
            ? `Showing report from ${startDate} to ${endDate}`
            : 'Select a sprint or date range to view the report'}
      </div>
    </div>
  );
}
