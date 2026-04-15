'use client';
import { useQuery } from '@tanstack/react-query';
import { jiraRepository } from '../repositories/jiraRepository';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';
import { EpicDto } from '../types/dashboard';
import { TagOutlined, CheckCircleFilled, SyncOutlined, ClockCircleFilled } from '@ant-design/icons';

function getEpicStatusConfig(status?: string): { color: string; bgColor: string; borderColor: string; icon: React.ReactNode; label: string } {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'done' || normalized === 'closed' || normalized === 'resolved') {
    return {
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      icon: <CheckCircleFilled className="text-emerald-500 text-[10px]" />,
      label: status ?? 'Done',
    };
  }
  if (normalized === 'in progress' || normalized === 'in review' || normalized === 'in development') {
    return {
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      icon: <SyncOutlined spin className="text-blue-500 text-[10px]" />,
      label: status ?? 'In Progress',
    };
  }
  // To Do / Open / Backlog / other
  return {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    icon: <ClockCircleFilled className="text-gray-400 text-[10px]" />,
    label: status ?? 'To Do',
  };
}

export function EpicSelect({ isStoryGrouping = false }: { isStoryGrouping?: boolean }) {
  const { sprint, project, startDate, endDate, epicId } = useTeamReportFilterStore(
    state => state.selectedFilter
  );
  const setEpicFilter = useTeamReportFilterStore(state => state.setEpicFilter);
  const label = isStoryGrouping ? 'Story' : 'Epic';

  // Fetch epics or stories based on board grouping type
  const { data: epics, isLoading } = useQuery({
    queryKey: [isStoryGrouping ? 'stories' : 'epics', sprint, startDate, endDate, project],
    queryFn: () => isStoryGrouping
      ? jiraRepository.fetchStories(sprint, project, startDate, endDate)
      : jiraRepository.fetchEpics(sprint, project, startDate, endDate),
    enabled: !!project && (!!sprint || (!!startDate && !!endDate)),
  });

  const handleChange = (value: string) => {
    setEpicFilter(value);
  };

  if (!project || (!sprint && (!startDate || !endDate))) {
    return null;
  }

  const epicItems = (epics || []) as EpicDto[];

  // Count epics by status
  const statusCounts = epicItems.reduce<Record<string, number>>((acc, epic) => {
    const normalized = (epic.status ?? 'Unknown').toLowerCase();
    let group: string;
    if (normalized === 'done' || normalized === 'closed' || normalized === 'resolved') group = 'Done';
    else if (normalized === 'in progress' || normalized === 'in review' || normalized === 'in development') group = 'In Progress';
    else group = 'To Do';
    acc[group] = (acc[group] ?? 0) + 1;
    return acc;
  }, {});

  const options = [
    { value: 'all', label: `All ${label}s`, title: `Show all ${label.toLowerCase()}s`, status: undefined as string | undefined },
    { value: 'null', label: `No ${label}`, title: `Show issues with no ${label.toLowerCase()}`, status: undefined as string | undefined },
    ...epicItems.map((epic) => ({
      value: epic.key,
      label: epic.summary,
      title: `${epic.summary} — ${epic.status ?? 'Unknown'}`,
      status: epic.status,
    })),
  ];

  const currentEpics = epicId || [];
  const isAnyActive = currentEpics.length > 0;

  return (
    <div className="flex flex-col gap-3 w-full animate-fade-in-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <TagOutlined />
          Filter by {label}
          {isAnyActive && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
              Filtered ({currentEpics.length})
            </span>
          )}
        </label>

        {/* Epic Status Summary Badges */}
        {epicItems.length > 0 && (
          <div className="flex items-center gap-2">
            {statusCounts['Done'] && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircleFilled className="text-emerald-500 text-[10px]" />
                {statusCounts['Done']} Done
              </span>
            )}
            {statusCounts['In Progress'] && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                <SyncOutlined spin className="text-blue-500 text-[10px]" />
                {statusCounts['In Progress']} In Progress
              </span>
            )}
            {statusCounts['To Do'] && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
                <ClockCircleFilled className="text-gray-400 text-[10px]" />
                {statusCounts['To Do']} To Do
              </span>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-2 overflow-hidden py-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide mask-fade-sides select-none">
          {options.map((option) => {
            const isActive = option.value === 'all'
              ? currentEpics.length === 0
              : currentEpics.includes(option.value);

            const isItem = option.value !== 'all' && option.value !== 'null';
            const statusConfig = isItem ? getEpicStatusConfig(option.status) : null;

            return (
              <button
                key={option.value}
                onClick={() => handleChange(option.value)}
                title={option.title || option.label}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300
                  border select-none whitespace-nowrap flex items-center gap-2
                  ${isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 transform scale-105'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                  }
                `}
              >
                <span className="truncate max-w-[180px]">{option.label}</span>
                {isItem && statusConfig && !isActive && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                )}
                {isItem && statusConfig && isActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500 text-blue-100 border border-blue-400">
                    {statusConfig.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
