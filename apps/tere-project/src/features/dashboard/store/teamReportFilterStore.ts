'use client';
import { DashboardFilter } from '@src/features/dashboard/types/dashboard';
import { create } from 'zustand';

type FilterState = {
  selectedFilter: DashboardFilter;
  setSelectedFilter: (filter: DashboardFilter) => void;
  setSprintFilter: (sprint: string, project: string) => void;
  setDateRangeFilter: (startDate: string, endDate: string, project: string) => void;
  clearFilter: () => void;
  setEpicFilter: (epicId: string) => void;
};

export const useTeamReportFilterStore = create<FilterState>(set => ({
  selectedFilter: { sprint: '', project: '' },
  
  setSelectedFilter: (filter: DashboardFilter) =>
    set({ selectedFilter: filter }),
  
  setEpicFilter: (epicId: string) =>
    set(state => ({
      selectedFilter: { ...state.selectedFilter, epicId },
    })),

  // Set sprint filter and clear date range
  setSprintFilter: (sprint: string, project: string) =>
    set({
      selectedFilter: {
        sprint,
        project,
        startDate: undefined,
        endDate: undefined,
        epicId: undefined,
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
        epicId: undefined,
      },
    }),
  
  clearFilter: () =>
    set({
      selectedFilter: { sprint: '', project: '' },
    }),
}));
