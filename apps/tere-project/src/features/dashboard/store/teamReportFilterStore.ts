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

export const useTeamReportFilterStore = create<FilterState>((set, get) => ({
  selectedFilter: { sprint: '', project: '' },
  
  setSelectedFilter: (filter: DashboardFilter) =>
    set({ selectedFilter: filter }),
  
  setEpicFilter: (epicId: string) => {
    const currentEpics = get().selectedFilter.epicId;
    // Check if it's already an array, if not (legacy/init), treat as empty
    let newEpics: string[] = Array.isArray(currentEpics) ? [...currentEpics] : [];

    if (epicId === 'all') {
      newEpics = []; // Clear filter to show all
    } else {
      // If 'all' was previously selected (implicilty empty), we just add the new one
      // Toggle logic
      if (newEpics.includes(epicId)) {
        newEpics = newEpics.filter(id => id !== epicId);
      } else {
        newEpics.push(epicId);
      }
    }

    set(state => ({
      selectedFilter: { ...state.selectedFilter, epicId: newEpics.length > 0 ? newEpics : undefined },
    }));
  },

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
