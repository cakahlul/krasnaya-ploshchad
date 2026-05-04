import type { CallerIdentity } from '@server/auth/with-auth-or-api-key';
import type { GetReportResponseDto, JiraIssueReportResponseDto } from '@shared/types/report.types';

function recalculateSummary(
  issues: JiraIssueReportResponseDto[],
  original: GetReportResponseDto,
): GetReportResponseDto {
  const activeMembers = issues.filter(i => (i.spTotal ?? 0) > 0);

  const totalWeightPointsProduct = activeMembers.reduce((s, i) => s + i.weightPointsProduct, 0);
  const totalWeightPointsTechDebt = activeMembers.reduce((s, i) => s + i.weightPointsTechDebt, 0);
  const totalWP = totalWeightPointsProduct + totalWeightPointsTechDebt;
  const productPercentage = totalWP > 0 ? (totalWeightPointsProduct / totalWP) * 100 : 0;
  const techDebtPercentage = totalWP > 0 ? (totalWeightPointsTechDebt / totalWP) * 100 : 0;

  const sumSpTotal = activeMembers.reduce((s, i) => s + (i.spTotal ?? 0), 0);
  const sumAvailableHours = activeMembers.reduce((s, i) => s + (i.workingDays ?? 10) * 8, 0);
  const averageProductivity = sumAvailableHours > 0 ? (sumSpTotal / sumAvailableHours) * 100 : 0;

  const membersWithWD = activeMembers.filter(i => i.workingDays !== undefined);
  const averageWorkingDays =
    membersWithWD.length > 0
      ? membersWithWD.reduce((s, i) => s + (i.workingDays || 0), 0) / membersWithWD.length
      : undefined;

  const totalWeightPoints = activeMembers.reduce((s, i) => s + i.totalWeightPoints, 0);
  const teamTotalWD = activeMembers.reduce((s, i) => s + (i.workingDays || 0), 0);
  const averageWpPerHour = teamTotalWD > 0 ? totalWeightPoints / teamTotalWD / 8 : 0;

  const totalSP = parseFloat(sumSpTotal.toFixed(2));
  const targetSP = parseFloat(sumAvailableHours.toFixed(2));
  const sumSpProduct = activeMembers.reduce((s, i) => s + (i.spProduct ?? 0), 0);
  const sumSpTechDebt = activeMembers.reduce((s, i) => s + (i.spTechDebt ?? 0), 0);
  const sumSpMeeting = activeMembers.reduce((s, i) => s + (i.spMeeting ?? 0), 0);

  const totalLeave = issues.reduce((s, i) => s + (i.leaveDays ?? 0), 0);
  const totalSick = issues.reduce((s, i) => s + (i.sickDays ?? 0), 0);
  const totalMemberWorkingDays = issues.reduce((s, i) => s + (i.workingDays ?? 0), 0);

  return {
    issues,
    totalWeightPointsProduct,
    totalWeightPointsTechDebt,
    productPercentage: `${productPercentage.toFixed(2)}%`,
    techDebtPercentage: `${techDebtPercentage.toFixed(2)}%`,
    averageProductivity: `${averageProductivity.toFixed(2)}%`,
    // totalWorkingDays reflects the sprint duration (not per-member), keep from original
    totalWorkingDays: original.totalWorkingDays,
    averageWorkingDays,
    averageWpPerHour,
    totalWeightPoints,
    totalSP,
    targetSP,
    spProductPercentage: totalSP > 0 ? `${((sumSpProduct / sumSpTotal) * 100).toFixed(2)}%` : '0.00%',
    spTechDebtPercentage: totalSP > 0 ? `${((sumSpTechDebt / sumSpTotal) * 100).toFixed(2)}%` : '0.00%',
    spMeetingPercentage: totalSP > 0 ? `${((sumSpMeeting / sumSpTotal) * 100).toFixed(2)}%` : '0.00%',
    totalLeave,
    totalSick,
    totalMemberWorkingDays,
    sprintStartDate: original.sprintStartDate,
    sprintEndDate: original.sprintEndDate,
    sprintName: original.sprintName,
    sprintId: original.sprintId,
  };
}

export function filterReportForMember(
  report: GetReportResponseDto,
  caller: CallerIdentity,
): GetReportResponseDto {
  if (caller.isLead || !caller.fullName) return report;
  const myIssues = report.issues.filter(i => i.member === caller.fullName);
  return recalculateSummary(myIssues, report);
}
