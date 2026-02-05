'use client';
import { DashboardFilter } from '@src/features/dashboard/types/dashboard';
import { create } from 'zustand';

type FilterState = {
  selectedFilter: DashboardFilter;
  setSelectedFilter: (filter: DashboardFilter) => void;
  setSprintFilter: (sprint: string, project: string) => void;
  setDateRangeFilter: (startDate: string, endDate: string, project: string) => void;
  clearFilter: () => void;
};

export const useTeamReportFilterStore = create<FilterState>(set => ({
  selectedFilter: { sprint: '', project: '' },
  
  setSelectedFilter: (filter: DashboardFilter) =>
    set({ selectedFilter: filter }),
  
  // Set sprint filter and clear date range
  setSprintFilter: (sprint: string, project: string) =>
    set({
      selectedFilter: {
        sprint,
        project,
        startDate: undefined,
        endDate: undefined,
      },
    }),
  
  // Set date range filter and clear sprint
  setDateRangeFilter: (startDate: string, endDate: string, project: string) =>
    set({
      selectedFilter: {
        sprint: '',
        project,
        startDate,
        endDate,
      },
    }),
  
  clearFilter: () =>
    set({
      selectedFilter: { sprint: '', project: '' },
    }),
}));
