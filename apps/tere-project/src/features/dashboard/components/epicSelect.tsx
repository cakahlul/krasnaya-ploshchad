'use client';
import { useQuery } from '@tanstack/react-query';
import { jiraRepository } from '../repositories/jiraRepository';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';
import { EpicDto } from '../types/dashboard';
import { TagOutlined } from '@ant-design/icons';

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
    { value: 'all', label: 'All Epics', title: 'Show all epics' },
    { value: 'null', label: 'No Epic', title: 'Show issues with no epic' },
    ...(epics || []).map((epic: EpicDto) => ({
      value: epic.key,
      label: epic.summary,
      title: epic.summary
    })),
  ];

  const currentEpics = epicId || [];
  const isAnyActive = currentEpics.length > 0;

  return (
    <div className="flex flex-col gap-2 w-full animate-fade-in-up" style={{ animationDelay: '100ms' }}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
        <TagOutlined />
        Filter by Epic
        {isAnyActive && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
            Filtered ({currentEpics.length})
          </span>
        )}
      </label>
      
      {isLoading ? (
        <div className="flex gap-2 overflow-hidden py-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide mask-fade-sides select-none">
          {options.map((option) => {
            const isActive = option.value === 'all' 
              ? currentEpics.length === 0
              : currentEpics.includes(option.value);

            return (
              <button
                key={option.value}
                onClick={() => handleChange(option.value)}
                title={option.title || option.label}
                className={`
                  flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300
                  border select-none whitespace-nowrap
                  ${isActive 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 transform scale-105' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                  }
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
