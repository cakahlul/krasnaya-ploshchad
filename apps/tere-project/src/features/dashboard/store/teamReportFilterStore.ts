'use client';
import { DashboardFilter } from '@src/features/dashboard/types/dashboard';
import { create } from 'zustand';

type FilterState = {
  selectedFilter: DashboardFilter;
  selectedTeams: number[];
  selectedSprints: string[];
  setSelectedFilter: (filter: DashboardFilter) => void;
  setTeams: (teams: number[]) => void;
  setSprints: (sprints: string[]) => void;
  setSprintFilter: (sprint: string, project: string) => void;
  setDateRangeFilter: (startDate: string, endDate: string, project: string) => void;
  clearFilter: () => void;
  setEpicFilter: (epicId: string) => void;
};

export const useTeamReportFilterStore = create<FilterState>((set, get) => ({
  selectedFilter: { sprint: '', project: '' },
  selectedTeams: [],
  selectedSprints: [],
  
  setSelectedFilter: (filter: DashboardFilter) =>
    set({ selectedFilter: filter }),
  
  setTeams: (teams: number[]) => {
    set({ selectedTeams: teams });
    // Clear sprints and filter when teams change
    if (teams.length === 0) {
      set({ 
        selectedSprints: [],
        selectedFilter: { sprint: '', project: '' },
      });
    }
  },

  setSprints: (sprints: string[]) => {
    set({ selectedSprints: sprints });
    // Update the filter with first sprint if available (or all as comma-separated)
    if (sprints.length > 0) {
      set(state => ({
        selectedFilter: {
          ...state.selectedFilter,
          sprint: sprints.join(','),
          startDate: undefined,
          endDate: undefined,
          epicId: undefined,
        },
      }));
    } else {
      set(state => ({
        selectedFilter: {
          ...state.selectedFilter,
          sprint: '',
          startDate: undefined,
          endDate: undefined,
        },
      }));
    }
  },
  
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
      selectedSprints: sprint ? [sprint] : [],
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
      selectedSprints: [],
    }),
  
  clearFilter: () =>
    set({
      selectedFilter: { sprint: '', project: '' },
      selectedTeams: [],
      selectedSprints: [],
    }),
}));
