'use client';
import { DashboardFilter } from '@src/features/dashboard/types/dashboard';
import { create } from 'zustand';

type FilterState = {
  selectedFilter: DashboardFilter;
  setSelectedFilter: (filter: DashboardFilter) => void;
};

export const useTeamReportFilterStore = create<FilterState>(set => ({
  selectedFilter: { sprint: '', project: '' },
  setSelectedFilter: (filter: DashboardFilter) =>
    set({ selectedFilter: { sprint: filter.sprint, project: filter.project } }),
}));
