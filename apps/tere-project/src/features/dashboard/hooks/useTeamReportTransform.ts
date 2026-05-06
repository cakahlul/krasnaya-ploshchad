import { useMemo } from 'react';
import { useTeamReportFetch } from './useTeamReportFetch';
import { useTeamReportFilterStore } from '@src/features/dashboard/store/teamReportFilterStore';
import { DashhboardEntity } from '../types/dashboard';

export const useTeamReportTransform = () => {
  const { data, isLoading, error } = useTeamReportFetch();

  // Subscribe to epicId from Zustand store for client-side filtering.
  // Changing epicId does NOT trigger a refetch — only a cheap useMemo recompute.
  const epicId = useTeamReportFilterStore(state => state.selectedFilter.epicId);

  const dashboardData: DashhboardEntity | null = useMemo(() => {
    if (!data) return null;

    let workItems = data.issues;

    // Apply client-side epic filter when an epic selection is active.
    // Uses the `epicKeys` field populated by the server on each WorkItem.
    // 'null' (string) in epicId means "issues with no parent epic".
    if (epicId && epicId.length > 0) {
      workItems = workItems.filter(item => {
        const memberEpicKeys = item.epicKeys ?? [];

        // If filtering for 'null', include members who have issues with no parent epic
        if (epicId.includes('null')) {
          if (memberEpicKeys.includes('null')) return true;
        }

        // Include member if any of their epic keys match the selected epics
        return epicId.some(selectedEpic => selectedEpic !== 'null' && memberEpicKeys.includes(selectedEpic));
      });
    }

    return {
      workItems,
      totalWeightPointsProduct: data.totalWeightPointsProduct,
      totalWeightPointsTechDebt: data.totalWeightPointsTechDebt,
      productPercentage: data.productPercentage,
      techDebtPercentage: data.techDebtPercentage,
      averageProductivity: data.averageProductivity,
      totalWorkingDays: data.totalWorkingDays,
      averageWorkingDays: data.averageWorkingDays,
      averageWpPerHour: data.averageWpPerHour,
      totalWeightPoints: data.totalWeightPoints,
      totalSP: data.totalSP,
      targetSP: data.targetSP,
      spProductPercentage: data.spProductPercentage,
      spTechDebtPercentage: data.spTechDebtPercentage,
      spMeetingPercentage: data.spMeetingPercentage,
      totalLeave: data.totalLeave,
      totalSick: data.totalSick,
      totalMemberWorkingDays: data.totalMemberWorkingDays,
      sprintStartDate: data.sprintStartDate,
      sprintEndDate: data.sprintEndDate,
    };
  }, [data, epicId]);

  return {
    data: dashboardData,
    isLoading,
    error,
  };
};
