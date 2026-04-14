import type {
  JiraIssueEntity, JiraIssueReportResponseDto, GetReportResponseDto,
  EpicDto,
} from '@shared/types/report.types';
import type { MemberResponse } from '@shared/types/member.types';
import type { LeaveDateRange } from '@shared/types/talent-leave.types';
import { membersService } from '@server/modules/members/members.service';
import { issueProcessingStrategyFactory } from './strategies/issue-processing-strategy.factory';
import { talentLeaveService } from '@server/modules/talent-leave/talent-leave.service';
import { sprintService } from '@server/modules/sprint/sprint.service';
import { boardsService } from '@server/modules/boards/boards.service';
import { holidaysService } from '@server/modules/holidays/holidays.service';
import { wpWeightConfigService } from '@server/modules/wp-weight-config/wp-weight-config.service';
import { calculateWorkingDays } from '@shared/utils/working-days.util';
import * as repo from './reports.repository';

const dailyTargetWPByLevel: Record<string, number> = {
  junior: 4.5, medior: 6, senior: 8, 'individual contributor': 8,
};

function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T')) {
    const date = new Date(dateStr);
    // Sprint dates from Jira are in UTC but represent WIB (UTC+7) time.
    // Use UTC+7 offset to extract the correct local date regardless of server timezone.
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
    const wibDate = new Date(date.getTime() + WIB_OFFSET_MS);
    const localDate = new Date(wibDate.getUTCFullYear(), wibDate.getUTCMonth(), wibDate.getUTCDate());
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

async function getSprintDetails(sprintParam: string): Promise<{ startDate: string; endDate: string } | null> {
  try {
    const sprintIds = sprintParam.split(',').map(s => s.trim()).filter(Boolean);
    const boardIds = await boardsService.getBoardIds();
    const results = await Promise.allSettled(boardIds.map(boardId => sprintService.fetchAllSprint(boardId)));
    const allSprints = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const matched = sprintIds
      .map(id => allSprints.find(s => String(s.id) === id))
      .filter((s): s is NonNullable<typeof s> => !!s?.startDate && !!s?.endDate);
    if (matched.length === 0) return null;
    const startDate = matched.reduce((min, s) => s.startDate < min ? s.startDate : min, matched[0].startDate);
    const endDate = matched.reduce((max, s) => s.endDate > max ? s.endDate : max, matched[0].endDate);
    return { startDate, endDate };
  } catch { return null; }
}

async function fetchLeaveData(startDate: string, endDate: string, members: MemberResponse[]): Promise<Map<string, LeaveDateRange[]>> {
  try {
    const memberIds = new Set(members.map((m) => m.id));
    const leaveRecords = await talentLeaveService.findAll({ startDate, endDate });
    const leaveMap = new Map<string, LeaveDateRange[]>();
    for (const r of leaveRecords) {
      if (memberIds.has(r.memberId)) leaveMap.set(r.memberId, r.leaveDate);
    }
    return leaveMap;
  } catch { return new Map(); }
}

function calculateDefectRate(defectCount: number): string {
  if (defectCount <= 2) return '100%';
  if (defectCount <= 5) return '80%';
  if (defectCount <= 7) return '50%';
  return '0%';
}

function processRawData(
  rawData: JiraIssueEntity[],
  members: MemberResponse[],
  sprintDetails?: { startDate: string; endDate: string } | null,
  leaveData?: Map<string, LeaveDateRange[]>,
  nationalHolidays: string[] = [],
  isShowPlannedWP = false,
  wpWeights?: Parameters<typeof issueProcessingStrategyFactory.createStrategies>[1],
): JiraIssueReportResponseDto[] {
  // accountId (Jira) === memberId (Firestore doc ID)
  const accountIdMap = new Map<string, string>(
    members.map((m) => [m.id.toLowerCase(), m.fullName]),
  );
  const nameToId = new Map<string, string>(members.map((m) => [m.fullName, m.id]));

  const reports = new Map<string, JiraIssueReportResponseDto>(
    members.map((m) => [
      m.fullName,
      { member: m.fullName, team: m.teams[0] ?? '', productivityRate: '', totalWeightPoints: 0, devDefect: 0, devDefectRate: '', level: m.level, weightPointsProduct: 0, weightPointsTechDebt: 0, targetWeightPoints: (dailyTargetWPByLevel[m.level] ?? 8) * 10, issueKeys: [] },
    ]),
  );

  const complexityMap = new Map<string, { totalComplexity: number; count: number }>(
    members.map((m) => [m.fullName, { totalComplexity: 0, count: 0 }]),
  );

  rawData.forEach((issue) => {
    try {
      const accountId = issue.fields.assignee?.accountId?.toLowerCase();
      if (!accountId) return;
      const memberName = accountIdMap.get(accountId);
      if (!memberName) return;
      const strategies = issueProcessingStrategyFactory.createStrategies(issue, wpWeights);
      const weightPoints = strategies.issueCategorizer.getWeightPointsCategory(issue);
      const complexityWeight = strategies.complexityWeightStrategy.calculateWeight(issue);
      const report = reports.get(memberName);
      if (!report) return;
      report.issueKeys.push(issue.key);
      const isDone = issue.fields.resolution?.name === 'Done';
      if (!isShowPlannedWP || isDone) {
        report[weightPoints] += complexityWeight;
        if (issue.fields.issuetype?.name === 'Bug') report.devDefect++;
        const cData = complexityMap.get(memberName);
        if (cData) { cData.totalComplexity += complexityWeight; cData.count++; }
      }
    } catch (error) { console.error('Error processing issue:', error); }
  });

  Array.from(reports.values()).forEach((report) => {
    if (sprintDetails && leaveData) {
      const memberId = nameToId.get(report.member) ?? '';
      const memberLeaveDates = leaveData.get(memberId) ?? [];
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
    const spBase = report.targetWeightPoints > 0 ? (8 * effectiveWorkingDays) / report.targetWeightPoints : 0;
    report.spProduct = report.weightPointsProduct * spBase;
    report.spTechDebt = report.weightPointsTechDebt * spBase;
    report.spTotal = report.spProduct + report.spTechDebt;
    if (report.totalWeightPoints === 0) {
      report.weightPointsProduct = 0; report.weightPointsTechDebt = 0; report.devDefect = 0;
      report.devDefectRate = '0%'; report.productivityRate = '0%'; report.wpToHours = 0;
      report.spProduct = 0; report.spTechDebt = 0; report.spTotal = 0;
    }
  });

  return Array.from(reports.values()).filter((r) => r.issueKeys.length > 0);
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

function filterMembersByProject(members: MemberResponse[], project: string): MemberResponse[] {
  const projectList = project.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
  return members.filter((m) => m.teams.some(t => projectList.includes(t.toLowerCase())));
}

function isBadRequestError(error: unknown): boolean {
  return !!(error && typeof error === 'object' && 'response' in error && (error as { response?: { status?: number } }).response?.status === 400);
}

async function buildPlannedWPMap(
  sprint: string,
  members: MemberResponse[],
  plannedWPProjects: string[],
  isSubtaskType: boolean,
  wpWeights?: Parameters<typeof issueProcessingStrategyFactory.createStrategies>[1],
): Promise<Map<string, number>> {
  const accountIdToName = new Map<string, string>(members.map(m => [m.id.toLowerCase(), m.fullName]));
  const plannedWPMap = new Map<string, number>();

  for (const plannedWPProject of plannedWPProjects) {
    const projectMembers = members.filter(m =>
      m.teams.some(t => t.toLowerCase() === plannedWPProject.toLowerCase()),
    );
    const assignees = projectMembers.map(m => m.id);
    try {
      const plannedData = await repo.fetchPlannedWPData(plannedWPProject, assignees, sprint, isSubtaskType);
      for (const issue of plannedData) {
        const accountId = issue.fields.assignee?.accountId?.toLowerCase();
        if (!accountId) continue;
        const memberName = accountIdToName.get(accountId);
        if (!memberName) continue;
        const strategies = issueProcessingStrategyFactory.createStrategies(issue, wpWeights);
        const weight = strategies.complexityWeightStrategy.calculateWeight(issue);
        plannedWPMap.set(memberName, (plannedWPMap.get(memberName) ?? 0) + weight);
      }
    } catch (error) {
      if (isBadRequestError(error)) {
        console.warn(`[buildPlannedWPMap] Jira returned 400 for project=${plannedWPProject}, skipping planned WP`);
      } else {
        throw error;
      }
    }
  }

  return plannedWPMap;
}

export async function generateReport(sprint: string, project: string, epicId?: string): Promise<GetReportResponseDto> {
  const allMembers = await membersService.findAll();
  const members = filterMembersByProject(allMembers, project);
  const assignees = members.map((m) => m.id);
  const isSubtaskType = await boardsService.hasSubtaskType(project);
  const allBoards = await boardsService.findAll();
  const projectList = project.split(',').map(p => p.trim()).filter(Boolean);
  const isShowPlannedWP = allBoards.some(b => b.isShowPlannedWP && projectList.some(p => p.toLowerCase() === b.shortName.toLowerCase()));
  let rawData: Awaited<ReturnType<typeof repo.fetchRawData>>;
  try {
    rawData = await repo.fetchRawData({ sprint, assignees, project, isSubtaskType, isShowPlannedWP });
  } catch (error) {
    if (isBadRequestError(error)) {
      console.warn(`[generateReport] Jira returned 400 for project=${project} sprint=${sprint}, returning empty data`);
      rawData = [];
    } else {
      throw error;
    }
  }
  if (epicId) {
    const epicIds = epicId.split(',');
    rawData = rawData.filter((issue) => {
      if (epicIds.includes('null') && !issue.fields.parent) return true;
      return issue.fields.parent?.key && epicIds.includes(issue.fields.parent.key);
    });
  }
  const sprintDetails = await getSprintDetails(sprint);
  let leaveData: Map<string, LeaveDateRange[]> = new Map();
  let nationalHolidays: string[] = [];
  let sprintStartDateStr: string | undefined;
  if (sprintDetails) {
    sprintStartDateStr = formatToYYYYMMDD(parseLocalDate(sprintDetails.startDate));
    const end = formatToYYYYMMDD(parseLocalDate(sprintDetails.endDate));
    leaveData = await fetchLeaveData(sprintStartDateStr, end, members);
    nationalHolidays = await holidaysService.getNationalHolidays(parseLocalDate(sprintDetails.startDate), parseLocalDate(sprintDetails.endDate));
  }
  const wpWeights = await wpWeightConfigService.getEffectiveWeights(sprintStartDateStr ?? formatToYYYYMMDD(new Date()));
  const teamReport = processRawData(rawData, members, sprintDetails, leaveData, nationalHolidays, isShowPlannedWP, wpWeights);

  const plannedWPShortNames = allBoards.filter(b => b.isShowPlannedWP).map(b => b.shortName);
  const plannedWPProjects = projectList.filter(p =>
    plannedWPShortNames.map(n => n.toLowerCase()).includes(p.toLowerCase()),
  );
  if (plannedWPProjects.length > 0) {
    const plannedWPMap = await buildPlannedWPMap(sprint, members, plannedWPProjects, isSubtaskType, wpWeights);
    teamReport.forEach(report => {
      if (plannedWPMap.has(report.member)) {
        report.plannedWP = plannedWPMap.get(report.member);
      }
    });
  }

  return summarizeTeamReport(teamReport, sprintDetails, nationalHolidays);
}

export async function generateReportByDateRange(startDate: string, endDate: string, project: string, epicId?: string): Promise<GetReportResponseDto> {
  const allMembers = await membersService.findAll();
  const members = filterMembersByProject(allMembers, project);
  const assignees = members.map((m) => m.id);
  const isSubtaskType = await boardsService.hasSubtaskType(project);
  let rawData = await repo.fetchRawDataByDateRange(project, assignees, startDate, endDate, isSubtaskType);
  if (epicId) {
    const epicIds = epicId.split(',');
    rawData = rawData.filter((issue) => {
      if (epicIds.includes('null') && !issue.fields.parent) return true;
      return issue.fields.parent?.key && epicIds.includes(issue.fields.parent.key);
    });
  }
  const leaveData = await fetchLeaveData(startDate, endDate, members);
  const nationalHolidays = await holidaysService.getNationalHolidays(parseLocalDate(startDate), parseLocalDate(endDate));
  const wpWeights = await wpWeightConfigService.getEffectiveWeights(startDate);
  const teamReport = processRawData(rawData, members, { startDate, endDate }, leaveData, nationalHolidays, false, wpWeights);
  return summarizeTeamReport(teamReport, { startDate, endDate }, nationalHolidays);
}

export async function getEpics(sprint: string, project: string, startDate?: string, endDate?: string): Promise<EpicDto[]> {
  const allMembers = await membersService.findAll();
  const assignees = filterMembersByProject(allMembers, project).map((m) => m.id);
  const isSubtaskType = await boardsService.hasSubtaskType(project);
  let rawData: Awaited<ReturnType<typeof repo.fetchRawData>>;
  try {
    rawData = startDate && endDate
      ? await repo.fetchRawDataByDateRange(project, assignees, startDate, endDate, isSubtaskType)
      : await repo.fetchRawData({ sprint, assignees, project, isSubtaskType });
  } catch (error) {
    if (isBadRequestError(error)) {
      console.warn(`[getEpics] Jira returned 400 for project=${project} sprint=${sprint}, returning empty epics`);
      return [];
    }
    throw error;
  }
  const epicsMap = new Map<string, EpicDto>();
  rawData.forEach((issue) => {
    if (issue.fields.parent && !epicsMap.has(issue.fields.parent.key)) {
      epicsMap.set(issue.fields.parent.key, { id: issue.fields.parent.key, key: issue.fields.parent.key, name: issue.fields.parent.fields.summary, summary: issue.fields.parent.fields.summary });
    }
  });
  return Array.from(epicsMap.values());
}

export async function generateOpenSprintReport(project: string): Promise<GetReportResponseDto | null> {
  const boardId = await boardsService.getBoardIdByShortName(project);
  if (!boardId) return null;
  const sprints = await sprintService.fetchAllSprint(boardId);
  const activeSprint = sprints.find((s) => s.state === 'active');
  if (!activeSprint) return null;
  const allMembers = await membersService.findAll();
  const members = allMembers.filter((m) => m.teams.some(t => t.toLowerCase() === project.toLowerCase()));
  const assignees = members.map((m) => m.id);
  const isSubtaskType = await boardsService.hasSubtaskType(project);
  const rawData = await repo.fetchOpenSprintData(project, assignees, activeSprint.id, isSubtaskType);
  const sprintDetails = { startDate: activeSprint.startDate, endDate: activeSprint.endDate };
  const start = formatToYYYYMMDD(parseLocalDate(sprintDetails.startDate));
  const end = formatToYYYYMMDD(parseLocalDate(sprintDetails.endDate));
  const leaveData = await fetchLeaveData(start, end, members);
  const nationalHolidays = await holidaysService.getNationalHolidays(parseLocalDate(sprintDetails.startDate), parseLocalDate(sprintDetails.endDate));
  const teamReport = processRawData(rawData, members, sprintDetails, leaveData, nationalHolidays);
  const report = summarizeTeamReport(teamReport, sprintDetails, nationalHolidays);
  return { ...report, sprintName: activeSprint.name };
}

export async function getSprintWorkItemStats(project: string): Promise<{ totalWorkItems: number; closedWorkItems: number; averageHoursOpen: number | null }> {
  const boardId = await boardsService.getBoardIdByShortName(project);
  if (!boardId) return { totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null };
  const sprints = await sprintService.fetchAllSprint(boardId);
  const activeSprint = sprints.find((s) => s.state === 'active');
  if (!activeSprint) return { totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null };

  const allIssues = await sprintService.fetchIssuesBySprintId(activeSprint.id);

  const closedIssues = allIssues.filter((i: { fields: { resolutiondate?: string; resolution?: { name?: string } } }) => i.fields.resolutiondate || i.fields.resolution?.name?.toLowerCase() === 'done');
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
