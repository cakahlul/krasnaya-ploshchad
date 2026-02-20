import { useMemo } from 'react';
import { useTeamReportFetch } from './useTeamReportFetch';
import { DashhboardEntity } from '../types/dashboard';

export const useTeamReportTransform = () => {
  const { data, isLoading, error } = useTeamReportFetch();

  const dashboardData: DashhboardEntity | null = useMemo(() => {
    if (!data) return null;

    return {
      workItems: data.issues,
      totalWeightPointsProduct: data.totalWeightPointsProduct,
      totalWeightPointsTechDebt: data.totalWeightPointsTechDebt,
      productPercentage: data.productPercentage,
      techDebtPercentage: data.techDebtPercentage,
      averageProductivity: data.averageProductivity,
      totalWorkingDays: data.totalWorkingDays,
      averageWorkingDays: data.averageWorkingDays,
      averageWpPerHour: data.averageWpPerHour,
      totalWeightPoints: data.totalWeightPoints,
      sprintStartDate: data.sprintStartDate,
      sprintEndDate: data.sprintEndDate,
    };
  }, [data]);

  return {
    data: dashboardData,
    isLoading,
    error,
  };
};
