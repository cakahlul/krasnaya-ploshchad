import type {
  JiraIssueEntity, JiraIssueReportResponseDto, GetReportResponseDto,
  JiraSearchRequestDto, EpicDto,
} from '@shared/types/report.types';
import type { TeamMember } from '@shared/types/common.types';
import { teamMembers } from '@shared/constants/team-members';
import { issueProcessingStrategyFactory } from './strategies/issue-processing-strategy.factory';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';
import { sprintService } from '@server/modules/sprint/sprint.service';
import { holidaysService } from '@server/modules/holidays/holidays.service';
import { calculateWorkingDays, getLeaveDataForMember } from '@shared/utils/working-days.util';
import * as repo from './reports.repository';

const dailyTargetWPByLevel: Record<string, number> = {
  junior: 5.6, medior: 6.8, senior: 8, 'individual contributor': 8,
};

function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T')) {
    const date = new Date(dateStr);
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatToYYYYMMDD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function getSprintDetails(sprintId: string): Promise<{ startDate: string; endDate: string } | null> {
  try {
    for (const boardId of [142, 143]) {
      const sprints = await sprintService.fetchAllSprint(boardId);
      const sprint = sprints.find((s) => String(s.id) === sprintId);
      if (sprint && sprint.startDate && sprint.endDate) return { startDate: sprint.startDate, endDate: sprint.endDate };
    }
    return null;
  } catch { return null; }
}

async function fetchLeaveData(startDate: string, endDate: string, project: string) {
  try {
    const projectMemberNames = teamMembers.filter((m: TeamMember) => m.team.includes(project)).map((m: TeamMember) => m.name.toLowerCase());
    const leaveRecords = await talentLeaveService.findAll({ startDate, endDate });
    return leaveRecords
      .filter((r) => projectMemberNames.includes(r.name.toLowerCase()))
      .map((r) => ({ name: r.name, leaveDate: r.leaveDate }));
  } catch { return []; }
}

function calculateDefectRate(defectCount: number): string {
  if (defectCount <= 2) return '100%';
  if (defectCount <= 5) return '80%';
  if (defectCount <= 7) return '50%';
  return '0%';
}

function processRawData(
  rawData: JiraIssueEntity[],
  project: string,
  sprintDetails?: { startDate: string; endDate: string } | null,
  leaveData?: Array<{ name: string; leaveDate: Array<{ dateFrom: string; dateTo: string; status: string }> }>,
  nationalHolidays: string[] = [],
): JiraIssueReportResponseDto[] {
  const accountIdMap = new Map<string, string>(
    teamMembers.filter((m: TeamMember) => m.team.includes(project)).map((m: TeamMember) => [m.id.toLowerCase(), m.name]),
  );

  const reports = new Map<string, JiraIssueReportResponseDto>(
    teamMembers.filter((m: TeamMember) => m.team.includes(project)).map((m: TeamMember) => [
      m.name,
      { member: m.name, productivityRate: '', totalWeightPoints: 0, devDefect: 0, devDefectRate: '', level: m.level, weightPointsProduct: 0, weightPointsTechDebt: 0, targetWeightPoints: (dailyTargetWPByLevel[m.level] ?? 8) * 10, issueKeys: [] },
    ]),
  );

  const complexityMap = new Map<string, { totalComplexity: number; count: number }>(
    teamMembers.map((m: TeamMember) => [m.name, { totalComplexity: 0, count: 0 }]),
  );

  rawData.forEach((issue) => {
    try {
      const accountId = issue.fields.assignee?.accountId?.toLowerCase();
      if (!accountId) return;
      const memberName = accountIdMap.get(accountId);
      if (!memberName) return;
      const strategies = issueProcessingStrategyFactory.createStrategies(issue);
      const weightPoints = strategies.issueCategorizer.getWeightPointsCategory(issue);
      const complexityWeight = strategies.complexityWeightStrategy.calculateWeight(issue);
      const report = reports.get(memberName);
      if (!report) return;
      report[weightPoints] += complexityWeight;
      report.issueKeys.push(issue.key);
      if (issue.fields.issuetype?.name === 'Bug') report.devDefect++;
      const cData = complexityMap.get(memberName);
      if (cData) { cData.totalComplexity += complexityWeight; cData.count++; }
    } catch (error) { console.error('Error processing issue:', error); }
  });

  Array.from(reports.values()).forEach((report) => {
    if (sprintDetails && leaveData) {
      const memberLeaveDates = getLeaveDataForMember(leaveData, report.member);
      report.workingDays = calculateWorkingDays(parseLocalDate(sprintDetails.startDate), parseLocalDate(sprintDetails.endDate), memberLeaveDates, nationalHolidays);
    }
    const dailyRate = dailyTargetWPByLevel[report.level] ?? 8;
    const effectiveWorkingDays = report.workingDays ?? 10;
    report.targetWeightPoints = dailyRate * effectiveWorkingDays;
    const cData = complexityMap.get(report.member);
    report.totalWeightPoints = cData?.totalComplexity ?? 0;
    const targetWP = report.targetWeightPoints;
    report.productivityRate = targetWP > 0 ? `${((report.totalWeightPoints / targetWP) * 100).toFixed(2)}%` : '0.00%';
    report.devDefectRate = calculateDefectRate(report.devDefect);
    const targetSP = report.workingDays ? report.workingDays * 8 : 80;
    report.wpToHours = report.totalWeightPoints / targetSP;
    if (report.totalWeightPoints === 0) {
      report.weightPointsProduct = 0; report.weightPointsTechDebt = 0; report.devDefect = 0;
      report.devDefectRate = '0%'; report.productivityRate = '0%'; report.wpToHours = 0;
    }
  });

  return Array.from(reports.values()).filter((r) => r.totalWeightPoints > 0);
}

function summarizeTeamReport(issues: JiraIssueReportResponseDto[], sprintDetails?: { startDate: string; endDate: string } | null, nationalHolidays: string[] = []): GetReportResponseDto {
  const activeMembers = issues.filter((i) => i.totalWeightPoints > 0);
  const totalWeightPointsProduct = activeMembers.reduce((s, i) => s + i.weightPointsProduct, 0);
  const totalWeightPointsTechDebt = activeMembers.reduce((s, i) => s + i.weightPointsTechDebt, 0);
  const totalWP = totalWeightPointsProduct + totalWeightPointsTechDebt;
  const productPercentage = totalWP > 0 ? (totalWeightPointsProduct / totalWP) * 100 : 0;
  const techDebtPercentage = totalWP > 0 ? (totalWeightPointsTechDebt / totalWP) * 100 : 0;
  const sumTotalWP = activeMembers.reduce((s, i) => s + i.totalWeightPoints, 0);
  const sumTargetWP = activeMembers.reduce((s, i) => s + i.targetWeightPoints, 0);
  const averageProductivity = sumTargetWP > 0 ? (sumTotalWP / sumTargetWP) * 100 : 0;
  let totalWorkingDays: number | undefined;
  if (sprintDetails) totalWorkingDays = calculateWorkingDays(parseLocalDate(sprintDetails.startDate), parseLocalDate(sprintDetails.endDate), [], nationalHolidays);
  const membersWithWD = activeMembers.filter((i) => i.workingDays !== undefined);
  const averageWorkingDays = membersWithWD.length > 0 ? membersWithWD.reduce((s, i) => s + (i.workingDays || 0), 0) / membersWithWD.length : undefined;
  const totalWeightPoints = activeMembers.reduce((s, i) => s + i.totalWeightPoints, 0);
  const teamTotalWD = activeMembers.reduce((s, i) => s + (i.workingDays || 0), 0);
  const averageWpPerHour = teamTotalWD > 0 ? (totalWeightPoints / teamTotalWD) / 8 : 0;
  return {
    issues, totalWeightPointsProduct, totalWeightPointsTechDebt,
    productPercentage: `${productPercentage.toFixed(2)}%`, techDebtPercentage: `${techDebtPercentage.toFixed(2)}%`,
    averageProductivity: `${averageProductivity.toFixed(2)}%`, totalWorkingDays, averageWorkingDays,
    averageWpPerHour, totalWeightPoints, sprintStartDate: sprintDetails?.startDate, sprintEndDate: sprintDetails?.endDate,
  };
}

export async function generateReport(sprint: string, project: string, epicId?: string): Promise<GetReportResponseDto> {
  let rawData = await repo.fetchRawData({ sprint, assignees: teamMembers.filter((m: TeamMember) => m.team.includes(project)).map((m: TeamMember) => m.id), project });
  if (epicId) {
    const epicIds = epicId.split(',');
    rawData = rawData.filter((issue) => {
      if (epicIds.includes('null') && !issue.fields.parent) return true;
      return issue.fields.parent?.key && epicIds.includes(issue.fields.parent.key);
    });
  }
  const sprintDetails = await getSprintDetails(sprint);
  let leaveData: any[] = [];
  let nationalHolidays: string[] = [];
  if (sprintDetails) {
    const start = formatToYYYYMMDD(parseLocalDate(sprintDetails.startDate));
    const end = formatToYYYYMMDD(parseLocalDate(sprintDetails.endDate));
    leaveData = await fetchLeaveData(start, end, project);
    nationalHolidays = await holidaysService.getNationalHolidays(parseLocalDate(sprintDetails.startDate), parseLocalDate(sprintDetails.endDate));
  }
  const teamReport = processRawData(rawData, project, sprintDetails, leaveData, nationalHolidays);
  return summarizeTeamReport(teamReport, sprintDetails, nationalHolidays);
}

export async function generateReportByDateRange(startDate: string, endDate: string, project: string, epicId?: string): Promise<GetReportResponseDto> {
  const assignees = teamMembers.filter((m: TeamMember) => m.team.includes(project)).map((m: TeamMember) => m.id);
  let rawData = await repo.fetchRawDataByDateRange(project, assignees, startDate, endDate);
  if (epicId) {
    const epicIds = epicId.split(',');
    rawData = rawData.filter((issue) => {
      if (epicIds.includes('null') && !issue.fields.parent) return true;
      return issue.fields.parent?.key && epicIds.includes(issue.fields.parent.key);
    });
  }
  const leaveData = await fetchLeaveData(startDate, endDate, project);
  const nationalHolidays = await holidaysService.getNationalHolidays(parseLocalDate(startDate), parseLocalDate(endDate));
  const teamReport = processRawData(rawData, project, { startDate, endDate }, leaveData, nationalHolidays);
  return summarizeTeamReport(teamReport, { startDate, endDate }, nationalHolidays);
}

export async function getEpics(sprint: string, project: string, startDate?: string, endDate?: string): Promise<EpicDto[]> {
  const assignees = teamMembers.filter((m: TeamMember) => m.team.includes(project)).map((m: TeamMember) => m.id);
  const rawData = startDate && endDate
    ? await repo.fetchRawDataByDateRange(project, assignees, startDate, endDate)
    : await repo.fetchRawData({ sprint, assignees, project });
  const epicsMap = new Map<string, EpicDto>();
  rawData.forEach((issue) => {
    if (issue.fields.parent && !epicsMap.has(issue.fields.parent.key)) {
      epicsMap.set(issue.fields.parent.key, { id: issue.fields.parent.key, key: issue.fields.parent.key, name: issue.fields.parent.fields.summary, summary: issue.fields.parent.fields.summary });
    }
  });
  return Array.from(epicsMap.values());
}

export async function generateOpenSprintReport(project: string): Promise<GetReportResponseDto | null> {
  const boardId = project === 'DS' ? 143 : 142;
  const sprints = await sprintService.fetchAllSprint(boardId);
  const activeSprint = sprints.find((s) => s.state === 'active');
  if (!activeSprint) return null;
  const assignees = teamMembers.filter((m: TeamMember) => m.team.includes(project)).map((m: TeamMember) => m.id);
  const rawData = await repo.fetchOpenSprintData(project, assignees, activeSprint.id);
  const sprintDetails = { startDate: activeSprint.startDate, endDate: activeSprint.endDate };
  const start = formatToYYYYMMDD(parseLocalDate(sprintDetails.startDate));
  const end = formatToYYYYMMDD(parseLocalDate(sprintDetails.endDate));
  const leaveData = await fetchLeaveData(start, end, project);
  const nationalHolidays = await holidaysService.getNationalHolidays(parseLocalDate(sprintDetails.startDate), parseLocalDate(sprintDetails.endDate));
  const teamReport = processRawData(rawData, project, sprintDetails, leaveData, nationalHolidays);
  const report = summarizeTeamReport(teamReport, sprintDetails, nationalHolidays);
  return { ...report, sprintName: activeSprint.name };
}

export async function getSprintWorkItemStats(project: string): Promise<{ totalWorkItems: number; closedWorkItems: number; averageHoursOpen: number | null }> {
  const boardId = project === 'DS' ? 143 : 142;
  const sprints = await sprintService.fetchAllSprint(boardId);
  const activeSprint = sprints.find((s) => s.state === 'active');
  if (!activeSprint) return { totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null };

  // Use agile sprint issue API — no JQL search needed
  const allIssues = await sprintService.fetchIssuesBySprintId(activeSprint.id);

  const closedIssues = allIssues.filter((i: any) => i.fields.resolutiondate || i.fields.resolution?.name?.toLowerCase() === 'done');
  let totalHours = 0; let countWithDates = 0;
  for (const issue of closedIssues) {
    if (issue.fields.created && issue.fields.resolutiondate) {
      const diffMs = new Date(issue.fields.resolutiondate).getTime() - new Date(issue.fields.created).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours >= 0) { totalHours += diffHours; countWithDates++; }
    }
  }
  return { totalWorkItems: allIssues.length, closedWorkItems: closedIssues.length, averageHoursOpen: countWithDates > 0 ? totalHours / countWithDates : null };
}
