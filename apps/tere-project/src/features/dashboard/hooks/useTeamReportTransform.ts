import { useMemo } from 'react';
import { useTeamReportFetch } from './useTeamReportFetch';
import { DashhboardEntity, WorkItem } from '../types/dashboard';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';

function recalculateSummary(issues: WorkItem[]): Omit<DashhboardEntity, 'workItems' | 'totalWorkingDays' | 'sprintStartDate' | 'sprintEndDate'> {
  const activeMembers = issues.filter(i => (i.spTotal ?? 0) > 0);

  const totalWeightPointsProduct = activeMembers.reduce((s, i) => s + i.weightPointsProduct, 0);
  const totalWeightPointsTechDebt = activeMembers.reduce((s, i) => s + i.weightPointsTechDebt, 0);
  const totalWP = totalWeightPointsProduct + totalWeightPointsTechDebt;
  const productPercentage = totalWP > 0 ? (totalWeightPointsProduct / totalWP) * 100 : 0;
  const techDebtPercentage = totalWP > 0 ? (totalWeightPointsTechDebt / totalWP) * 100 : 0;

  const sumSpTotal = activeMembers.reduce((s, i) => s + (i.spTotal ?? 0), 0);
  const sumAvailableHours = activeMembers.reduce((s, i) => s + (i.workingDays ?? 10) * 8, 0);
  const averageProductivity = sumAvailableHours > 0 ? (sumSpTotal / sumAvailableHours) * 100 : 0;

  const totalWeightPoints = activeMembers.reduce((s, i) => s + i.totalWeightPoints, 0);
  const teamTotalWD = activeMembers.reduce((s, i) => s + (i.workingDays ?? 0), 0);
  const averageWpPerHour = teamTotalWD > 0 ? totalWeightPoints / teamTotalWD / 8 : 0;

  const membersWithWD = activeMembers.filter(i => i.workingDays !== undefined);
  const averageWorkingDays = membersWithWD.length > 0
    ? membersWithWD.reduce((s, i) => s + (i.workingDays ?? 0), 0) / membersWithWD.length
    : undefined;

  const totalSP = sumSpTotal;
  const targetSP = sumAvailableHours;
  const sumSpProduct = activeMembers.reduce((s, i) => s + (i.spProduct ?? 0), 0);
  const sumSpTechDebt = activeMembers.reduce((s, i) => s + (i.spTechDebt ?? 0), 0);
  const sumSpMeeting = activeMembers.reduce((s, i) => s + (i.spMeeting ?? 0), 0);
  const spProductPercentage = totalSP > 0 ? (sumSpProduct / totalSP) * 100 : 0;
  const spTechDebtPercentage = totalSP > 0 ? (sumSpTechDebt / totalSP) * 100 : 0;
  const spMeetingPercentage = totalSP > 0 ? (sumSpMeeting / totalSP) * 100 : 0;

  // Leave/sick/working days across all filtered members (not just active)
  const totalLeave = issues.reduce((s, i) => s + (i.leaveDays ?? 0), 0);
  const totalSick = issues.reduce((s, i) => s + (i.sickDays ?? 0), 0);
  const totalMemberWorkingDays = issues.reduce((s, i) => s + (i.workingDays ?? 0), 0);

  return {
    totalWeightPointsProduct,
    totalWeightPointsTechDebt,
    productPercentage: `${productPercentage.toFixed(2)}%`,
    techDebtPercentage: `${techDebtPercentage.toFixed(2)}%`,
    averageProductivity: `${averageProductivity.toFixed(2)}%`,
    averageWorkingDays,
    averageWpPerHour,
    totalWeightPoints,
    totalSP: parseFloat(totalSP.toFixed(2)),
    targetSP: parseFloat(targetSP.toFixed(2)),
    spProductPercentage: `${spProductPercentage.toFixed(2)}%`,
    spTechDebtPercentage: `${spTechDebtPercentage.toFixed(2)}%`,
    spMeetingPercentage: `${spMeetingPercentage.toFixed(2)}%`,
    totalLeave,
    totalSick,
    totalMemberWorkingDays,
  };
}

export const useTeamReportTransform = () => {
  const { data, isLoading, error } = useTeamReportFetch();
  const selectedMemberKeys = useTeamReportFilterStore(state => state.selectedMemberKeys);

  // Epic filtering is now server-side — the API returns only issues matching the selected epic,
  // with all stats (WP, productivity, etc.) recalculated for the filtered subset.
  const dashboardData: DashhboardEntity | null = useMemo(() => {
    if (!data) return null;

    const isFiltered = selectedMemberKeys.length > 0;
    const workItems = isFiltered
      ? data.issues.filter(i => selectedMemberKeys.includes(`${i.member}::${i.team}`))
      : data.issues;

    const summary = isFiltered
      ? recalculateSummary(workItems)
      : {
          totalWeightPointsProduct: data.totalWeightPointsProduct,
          totalWeightPointsTechDebt: data.totalWeightPointsTechDebt,
          productPercentage: data.productPercentage,
          techDebtPercentage: data.techDebtPercentage,
          averageProductivity: data.averageProductivity,
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
        };

    return {
      workItems,
      ...summary,
      totalWorkingDays: data.totalWorkingDays,
      sprintStartDate: data.sprintStartDate,
      sprintEndDate: data.sprintEndDate,
    };
  }, [data, selectedMemberKeys]);

  return {
    data: dashboardData,
    isLoading,
    error,
  };
};
