import { Select, DatePicker, Divider } from 'antd';
import { useSprintDataTransform } from '../hooks/useSprintDataTransform';
import { useSprintFilterStore } from '../store/sprintFilterStore';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export function FilterReport() {
  const { sprints, isLoading } = useSprintDataTransform();
  const board = useSprintFilterStore(state => state.board);
  const setBoardId = useSprintFilterStore(state => state.setSelectedBoard);

  const boardNameMap: Record<number, string> = {
    143: 'DS',
    142: 'SLS',
  };

  const { sprint, startDate, endDate } = useTeamReportFilterStore(
    state => state.selectedFilter,
  );
  const setSprintFilter = useTeamReportFilterStore(state => state.setSprintFilter);
  const setDateRangeFilter = useTeamReportFilterStore(state => state.setDateRangeFilter);
  const clearFilter = useTeamReportFilterStore(state => state.clearFilter);

  const handleTeamChange = (value: number) => {
    if (board.id !== value) {
      // Reset filter if team changes
      clearFilter();
    }
    setBoardId({ id: value, name: boardNameMap[value] });
  };

  const handleSprintChange = (value: string) => {
    // Set sprint filter (clears date range)
    setSprintFilter(value, board.name);
  };

  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
  ) => {
    if (dates && dates[0] && dates[1]) {
      // Set date range filter (clears sprint)
      setDateRangeFilter(
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD'),
        board.name,
      );
    } else {
      // Cleared date range - don't auto-select anything
      clearFilter();
    }
  };

  // Determine which mode is active
  const isSprintMode = !!sprint;
  const isDateRangeMode = !!startDate && !!endDate;

  return (
    <div className="flex flex-col gap-4 pl-4">
      <div className="flex flex-row gap-4 items-end flex-wrap">
        <div className="flex flex-col gap-2">
          <label htmlFor="project">Team</label>
          <Select
            showSearch
            style={{ width: 200 }}
            placeholder="Select team"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '')
                .toLowerCase()
                .localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={[
              {
                value: 143,
                label: 'Funding - DS Board',
              },
              {
                value: 142,
                label: 'Lending - SLS Board',
              },
            ]}
            onChange={handleTeamChange}
          />
        </div>

        <Divider type="vertical" className="h-16 bg-gray-300" />

        <div className="flex flex-col gap-2">
          <label htmlFor="sprint" className="flex items-center gap-2">
            Sprint
            {isSprintMode && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </label>
          <Select
            showSearch
            style={{ width: 200 }}
            placeholder="Select sprint"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '')
                .toLowerCase()
                .localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={sprints}
            onChange={handleSprintChange}
            loading={isLoading}
            value={sprint || undefined}
            allowClear
            onClear={() => clearFilter()}
          />
        </div>

        <div className="flex items-center text-gray-400 font-medium">or</div>

        <div className="flex flex-col gap-2">
          <label htmlFor="dateRange" className="flex items-center gap-2">
            Date Range
            {isDateRangeMode && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </label>
          <RangePicker
            style={{ width: 280 }}
            format="YYYY-MM-DD"
            onChange={handleDateRangeChange}
            value={
              startDate && endDate
                ? [dayjs(startDate), dayjs(endDate)]
                : null
            }
            picker="date"
            allowClear
          />
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 -mt-2">
        {isSprintMode
          ? 'Showing report based on selected sprint'
          : isDateRangeMode
            ? `Showing report from ${startDate} to ${endDate}`
            : 'Select a sprint or date range to view the report'}
      </p>
    </div>
  );
}
