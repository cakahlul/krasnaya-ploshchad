'use client';
import { Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { jiraRepository } from '../repositories/jiraRepository';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';
import { EpicDto } from '../types/dashboard';

export function EpicSelect() {
  const { sprint, project, startDate, endDate, epicId } = useTeamReportFilterStore(
    state => state.selectedFilter
  );
  const setEpicFilter = useTeamReportFilterStore(state => state.setEpicFilter);

  // Fetch epics based on current filter context (sprint or date range)
  const { data: epics, isLoading } = useQuery({
    queryKey: ['epics', sprint, startDate, endDate, project],
    queryFn: () => jiraRepository.fetchEpics(sprint, project, startDate, endDate),
    enabled: !!project && (!!sprint || (!!startDate && !!endDate)),
  });

  const handleChange = (value: string) => {
    setEpicFilter(value);
  };

  if (!project || (!sprint && (!startDate || !endDate))) {
    return null;
  }

  const options = [
    { value: 'all', label: 'All Epics' },
    { value: 'null', label: 'No Epic' },
    ...(epics || []).map((epic: EpicDto) => ({
      value: epic.key,
      label: epic.summary, // Or use generic name format like [KEY] Summary
      title: epic.summary // Tooltip
    })),
  ];

  return (
    <div className="flex flex-col gap-2 min-w-[200px] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
      <label htmlFor="epic" className="flex items-center gap-2 text-sm font-medium text-gray-600">
        Filter by Epic
        {epicId && epicId !== 'all' && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
            Active
          </span>
        )}
      </label>
      <Select
        id="epic"
        showSearch
        style={{ width: '100%' }}
        placeholder="Select Epic"
        optionFilterProp="label"
        options={options}
        onChange={handleChange}
        loading={isLoading}
        value={epicId || 'all'}
        className="w-full shadow-sm hover:shadow transition-shadow duration-300 rounded-md"
        popupClassName="animate-airdrop"
        listHeight={300}
      />
    </div>
  );
}
