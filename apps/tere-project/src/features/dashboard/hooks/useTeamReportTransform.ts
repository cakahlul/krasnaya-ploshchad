import { useMemo } from 'react';
import { useTeamReportFetch } from './useTeamReportFetch';
import { DashhboardEntity } from '../types/dashboard';

export const useTeamReportTransform = () => {
  const { data, isLoading, error } = useTeamReportFetch();

  const dashboardData: DashhboardEntity | null = useMemo(() => {
    if (!data) return null;

    return {
      workItems: data.issues,
      productTask: data.totalIssueProduct,
      techDebtTask: data.totalIssueTechDebt,
      productPercentage: data.productPercentage,
      techDebtPercentage: data.techDebtPercentage,
      averageProductivity: data.averageProductivity,
      totalWorkingDays: data.totalWorkingDays,
      averageWorkingDays: data.averageWorkingDays,
      averageWpPerHour: data.averageWpPerHour,
    };
  }, [data]);

  return {
    data: dashboardData,
    isLoading,
    error,
  };
};
