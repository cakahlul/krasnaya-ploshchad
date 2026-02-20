import { Injectable } from '@nestjs/common';
import { ReportJiraRepository } from './repositories/report.jira.repository';
import {
  JiraIssueReportResponseDto,
  GetReportResponseDto,
  JiraSearchRequestDto,
} from './interfaces/report.dto';
import { JiraIssueEntity } from './interfaces/report.entity';
import { TeamMember } from 'src/shared/interfaces/team-member.interface';
import { teamMembers } from 'src/shared/constants/team-member.const';
import { IssueProcessingStrategyFactory } from './strategies/issue-processing-strategy.factory';
import { TalentLeaveService } from '../talent-leave/talent-leave.service';
import { ProjectService } from '../sprint/project.service';
import { HolidaysService } from '../holidays/holidays.service';
import {
  calculateWorkingDays,
  getLeaveDataForMember,
} from './utils/working-days.util';

@Injectable()
export class ReportsService {
  private readonly dailyTargetWPByLevel: { [key: string]: number } = {
    junior: 5.6,
    medior: 6.8,
    senior: 8,
    'individual contributor': 8,
  };

  constructor(
    private readonly jiraReportRepository: ReportJiraRepository,
    private readonly strategyFactory: IssueProcessingStrategyFactory,
    private readonly talentLeaveService: TalentLeaveService,
    private readonly projectService: ProjectService,
    private readonly holidaysService: HolidaysService,
  ) {}

  /**
   * Parse a date string as a local date (without timezone conversion)
   * Handles both YYYY-MM-DD and ISO 8601 formats
   * For ISO 8601 dates from Jira (e.g., '2026-01-19T05:01:28.046Z'), we want to use
   * the date as-is but normalize to start of day in local timezone
   */
  private parseLocalDate(dateStr: string): Date {
    // If it's an ISO 8601 string with timezone (from Jira), parse it normally
    // and then normalize to start of day in local timezone
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      // Get the local date components
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      // Create new date at midnight in local timezone
      const localDate = new Date(year, month, day);
      localDate.setHours(0, 0, 0, 0);
      return localDate;
    }
    
    // For plain YYYY-MM-DD strings, parse directly as local date
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Format a Date object to YYYY-MM-DD string
   */
  private formatToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async generateReport(
    sprint: string,
    project: string,
    epicId?: string,
  ): Promise<GetReportResponseDto> {
    const rawData = await this.fetchRawData(sprint, project, epicId);
    
    // Fetch sprint details to get start and end dates
    const sprintDetails = await this.getSprintDetails(sprint);
    
    // Fetch leave data if sprint details are available
    let leaveData: Array<{ name: string; leaveDate: Array<{ dateFrom: string; dateTo: string; status: string }> }> = [];
    if (sprintDetails) {
      // Convert Jira ISO dates to local dates in GMT+7, then format as YYYY-MM-DD for Firestore query
      const sprintStartDate = this.parseLocalDate(sprintDetails.startDate);
      const sprintEndDate = this.parseLocalDate(sprintDetails.endDate);
      const startDateStr = this.formatToYYYYMMDD(sprintStartDate);
      const endDateStr = this.formatToYYYYMMDD(sprintEndDate);
      

      
      leaveData = await this.fetchLeaveData(
        startDateStr,
        endDateStr,
        project,
      );
    }
    
    // Fetch national holidays if sprint details are available
    let nationalHolidays: string[] = [];
    if (sprintDetails) {
      const startDate = this.parseLocalDate(sprintDetails.startDate);
      const endDate = this.parseLocalDate(sprintDetails.endDate);
      nationalHolidays = await this.holidaysService.getNationalHolidays(startDate, endDate);
    }
    
    const teamReport = this.processRawData(rawData, project, sprintDetails, leaveData, nationalHolidays);
    return this.summarizeTeamReport(teamReport, sprintDetails, nationalHolidays);
  }

  /**
   * Generate report based on date range instead of sprint
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @param project Project code (SLS or DS)
   */
  async generateReportByDateRange(
    startDate: string,
    endDate: string,
    project: string,
    epicId?: string,
  ): Promise<GetReportResponseDto> {
    // Get assignees for this project
    const assignees: string[] = teamMembers
      .filter((member: TeamMember) => member.team.includes(project))
      .map((member: TeamMember) => member.id);

    // Fetch raw data using date range
    let rawData = await this.jiraReportRepository.fetchRawDataByDateRange(
      project,
      assignees,
      startDate,
      endDate,
    );

    // Filter by Epic if provided
    if (epicId) {
      const epicIds = epicId.split(',');
      rawData = rawData.filter(issue => {
        // If 'null' is one of the selected IDs, include issues without parent
        if (epicIds.includes('null') && !issue.fields.parent) {
          return true;
        }
        // Check if issue's parent key matches any of the selected epic IDs
        return issue.fields.parent?.key && epicIds.includes(issue.fields.parent.key);
      });
    }

    // Create pseudo sprint details from date range for working days calculation
    const dateRangeDetails = {
      startDate,
      endDate,
    };

    // Parse dates for leave and holiday calculations
    const rangeStartDate = this.parseLocalDate(startDate);
    const rangeEndDate = this.parseLocalDate(endDate);

    // Fetch leave data for the date range
    const leaveData = await this.fetchLeaveData(startDate, endDate, project);

    // Fetch national holidays for the date range
    const nationalHolidays = await this.holidaysService.getNationalHolidays(
      rangeStartDate,
      rangeEndDate,
    );

    const teamReport = this.processRawData(
      rawData,
      project,
      dateRangeDetails,
      leaveData,
      nationalHolidays,
    );
        
    // Apply Epic filter if provided (for date range report)
    // Note: generateReportByDateRange doesn't have epicId param yet, need to add it to interface/controller first?
    // User requested "selected sprint or selected date". So date range also needs epic filter.
    
    return this.summarizeTeamReport(teamReport, dateRangeDetails, nationalHolidays);
  }

  async getEpics(
    sprint: string,
    project: string,
    startDate?: string,
    endDate?: string,
  ): Promise<import('./interfaces/report.dto').EpicDto[]> {
    let rawData: JiraIssueEntity[] = [];
    
    if (startDate && endDate) {
        // reuse existing date range fetch logic
        const assignees: string[] = teamMembers
          .filter((member: TeamMember) => member.team.includes(project))
          .map((member: TeamMember) => member.id);
          
        rawData = await this.jiraReportRepository.fetchRawDataByDateRange(
          project,
          assignees,
          startDate,
          endDate,
        );
    } else {
        // reuse existing sprint fetch logic
        rawData = await this.fetchRawData(sprint, project);
    }

    const epicsMap = new Map<string, import('./interfaces/report.dto').EpicDto>();
    
    rawData.forEach(issue => {
        if (issue.fields.parent) {
            const epic = issue.fields.parent;
            if (!epicsMap.has(epic.key)) {
                epicsMap.set(epic.key, {
                    id: epic.key,
                    key: epic.key,
                    name: epic.fields.summary,
                    summary: epic.fields.summary
                });
            }
        }
    });
    
    return Array.from(epicsMap.values());
  }

  /**
   * Generate report for the currently active/open sprint
   * Uses openSprints() JQL function to avoid sprint name quoting issues
   */
  async generateOpenSprintReport(project: string): Promise<GetReportResponseDto | null> {
    // Get the active sprint for this project's board
    const boardId = project === 'DS' ? 143 : 142;
    const sprints = await this.projectService.fetchAllSprint(boardId);
    const activeSprint = sprints.find((s) => s.state === 'active');
    
    if (!activeSprint) {
      return null;
    }

    // Get assignees for this project
    const assignees: string[] = teamMembers
      .filter((member: TeamMember) => member.team.includes(project))
      .map((member: TeamMember) => member.id);

    // Fetch raw data using openSprints() JQL
    const rawData = await this.jiraReportRepository.fetchOpenSprintData(project, assignees);
    
    // Get sprint details for working days calculation
    const sprintDetails = {
      startDate: activeSprint.startDate,
      endDate: activeSprint.endDate,
    };
    
    // Fetch leave data
    const sprintStartDate = this.parseLocalDate(sprintDetails.startDate);
    const sprintEndDate = this.parseLocalDate(sprintDetails.endDate);
    const startDateStr = this.formatToYYYYMMDD(sprintStartDate);
    const endDateStr = this.formatToYYYYMMDD(sprintEndDate);
    
    const leaveData = await this.fetchLeaveData(startDateStr, endDateStr, project);
    
    // Fetch national holidays
    const nationalHolidays = await this.holidaysService.getNationalHolidays(
      sprintStartDate,
      sprintEndDate,
    );
    // const nationalHolidays: string[] = []; // Disabled for performance
    
    const teamReport = this.processRawData(rawData, project, sprintDetails, leaveData, nationalHolidays);
    const report = this.summarizeTeamReport(teamReport, sprintDetails, nationalHolidays);
    
    return {
      ...report,
      sprintName: activeSprint.name,
    };
  }

  async getSprintWorkItemStats(project: string): Promise<{
    totalWorkItems: number;
    closedWorkItems: number;
    averageHoursOpen: number | null;
  }> {
    // Fetch all issues for the active sprint (both open and closed)
    const allIssues = await this.jiraReportRepository.fetchAllSprintIssues(project);

    const totalWorkItems = allIssues.length;
    
    // Filter closed items (resolution = Done or has resolution date)
    const closedIssues = allIssues.filter(
      (issue) => 
        issue.fields.resolutiondate || 
        issue.fields.resolution?.name?.toLowerCase() === 'done'
    );
    const closedWorkItems = closedIssues.length;

    // Calculate average hours open for closed items
    let totalHours = 0;
    let countWithDates = 0;

    for (const issue of closedIssues) {
      if (issue.fields.created && issue.fields.resolutiondate) {
        const created = new Date(issue.fields.created);
        const resolved = new Date(issue.fields.resolutiondate);
        
        // Calculate difference in hours
        const diffMs = resolved.getTime() - created.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours >= 0) {
          totalHours += diffHours;
          countWithDates++;
        }
      }
    }

    const averageHoursOpen = countWithDates > 0 ? totalHours / countWithDates : null;

    return {
      totalWorkItems,
      closedWorkItems,
      averageHoursOpen,
    };
  }

  private async fetchRawData(
    sprint: string,
    project: string,
    epicId?: string,
  ): Promise<JiraIssueEntity[]> {
    const assignees: string[] = teamMembers
      .filter((member: TeamMember) => member.team.includes(project))
      .map((member: TeamMember) => member.id);

    // If epicId is provided, we can filter here or pass to repository
    // For now, let's fetch all and filter in memory to avoid changing repository signature too much if not needed,
    // OR update request DTO. Updating request DTO is cleaner.
    // However, existing repository `fetchRawData` takes `JiraSearchRequestDto` which doesn't have `epicId`.
    // Let's filter in memory here for simplicity unless performance is an issue.
    // Actually, `fetchRawData` (service) calls `jiraReportRepository.fetchRawData` (repo).
    
    const request: JiraSearchRequestDto = {
      sprint,
      assignees,
      project,
    };
    const issues = await this.jiraReportRepository.fetchRawData(request);
    
    if (epicId) {
      const epicIds = epicId.split(',');
      return issues.filter(issue => {
        // If 'null' is one of the selected IDs, include issues without parent
        if (epicIds.includes('null') && !issue.fields.parent) {
          return true;
        }
        // Check if issue's parent key matches any of the selected epic IDs
        return issue.fields.parent?.key && epicIds.includes(issue.fields.parent.key);
      });
    }
    
    return issues;
  }

  private async getSprintDetails(
    sprintId: string,
  ): Promise<{ startDate: string; endDate: string } | null> {
    try {
      // Try to extract boardId from common patterns (e.g., sprint ID might be numeric)
      // Since we don't have direct access to boardId, we'll try common board IDs
      const boardIds = [142, 143]; // SLS and DS boards
      
      for (const boardId of boardIds) {
        const sprints = await this.projectService.fetchAllSprint(boardId);
        const sprint = sprints.find((s) => String(s.id) === sprintId);
        if (sprint && sprint.startDate && sprint.endDate) {

          return {
            startDate: sprint.startDate,
            endDate: sprint.endDate,
          };
        }
      }
      
      console.warn(`Sprint ${sprintId} not found, working days will not be calculated`);
      return null;
    } catch (error) {
      console.error('Error fetching sprint details:', error);
      return null;
    }
  }

  private async fetchLeaveData(
    startDate: string,
    endDate: string,
    project: string,
  ): Promise<Array<{ name: string; leaveDate: Array<{ dateFrom: string; dateTo: string; status: string }> }>> {
    try {
      // Get team member names for this project
      const projectMemberNames = teamMembers
        .filter((member: TeamMember) => member.team.includes(project))
        .map((member: TeamMember) => member.name.toLowerCase());

      // Fetch all leave records filtered by date range only (no team filter)
      // The team field in Firebase may not match exactly with project code
      const leaveRecords = await this.talentLeaveService.findAll({
        startDate,
        endDate,
        // Don't filter by team here - we'll filter by member names instead
      });

      // Filter to only include team members for this project
      const filteredRecords = leaveRecords.filter((record) =>
        projectMemberNames.includes(record.name.toLowerCase()),
      );

      return filteredRecords.map((record) => ({
        name: record.name,
        leaveDate: record.leaveDate,
      }));
    } catch (error) {
      console.error('Error fetching leave data:', error);
      return [];
    }
  }

  private processRawData(
    rawData: JiraIssueEntity[],
    project: string,
    sprintDetails?: { startDate: string; endDate: string } | null,
    leaveData?: Array<{ name: string; leaveDate: Array<{ dateFrom: string; dateTo: string; status: string }> }>,
    nationalHolidays: string[] = [],
  ): JiraIssueReportResponseDto[] {
    const accountIdMap = new Map<string, string>(
      teamMembers
        .filter((member: TeamMember) => member.team.includes(project))
        .map((member: TeamMember) => [member.id.toLowerCase(), member.name]),
    );

    const reports = new Map<string, JiraIssueReportResponseDto>(
      teamMembers
        .filter((member: TeamMember) => member.team.includes(project))
        .map((member: TeamMember) => [
          member.name,
          {
            member: member.name,
            productivityRate: '',
            totalWeightPoints: 0,
            devDefect: 0,
            devDefectRate: '',
            level: member.level,
            weightPointsProduct: 0,
            weightPointsTechDebt: 0,
            targetWeightPoints: (this.dailyTargetWPByLevel[member.level] ?? 8) * 10, // default 10 days, recalculated later
            issueKeys: [],
          },
        ]),
    );

    const complexityMap = new Map<
      string,
      {
        totalComplexity: number;
        count: number;
      }
    >(
      teamMembers.map((member: TeamMember) => [
        member.name,
        { totalComplexity: 0, count: 0 },
      ]),
    );

    rawData.forEach((issue: JiraIssueEntity) => {
      try {
        this.processIndividualIssue(
          issue,
          accountIdMap,
          reports,
          complexityMap,
        );
      } catch (error) {
        console.error('Error processing issue:', error);
      }
    });

    Array.from(reports.values()).forEach(
      (report: JiraIssueReportResponseDto) => {
        // Calculate working days if sprint details and leave data are available
        if (sprintDetails && leaveData) {
          const memberLeaveDates = getLeaveDataForMember(leaveData, report.member);

          report.workingDays = calculateWorkingDays(
            this.parseLocalDate(sprintDetails.startDate),
            this.parseLocalDate(sprintDetails.endDate),
            memberLeaveDates,
            nationalHolidays,
          );
        }

        // Recalculate targetWeightPoints based on actual working days
        const dailyRate = this.dailyTargetWPByLevel[report.level] ?? 8;
        const effectiveWorkingDays = report.workingDays ?? 10;
        report.targetWeightPoints = dailyRate * effectiveWorkingDays;

        // Accumulate totalWeightPoints from complexityMap
        const complexityData = complexityMap.get(report.member);
        report.totalWeightPoints = complexityData?.totalComplexity ?? 0;

        // Productivity Rate: totalWeightPoints / targetWeightPoints * 100%
        const targetWP = report.targetWeightPoints;
        report.productivityRate = targetWP > 0
          ? `${((report.totalWeightPoints / targetWP) * 100).toFixed(2)}%`
          : '0.00%';

        // Defect rate calculation
        report.devDefectRate = this.calculateDefectRate(report.devDefect);

        // Calculate wpToHours: totalWeightPoints / (workingDays * 8)
        // If workingDays is not available, defaults to 80 (10 days * 8 points)
        const targetStoryPoints = report.workingDays ? report.workingDays * 8 : 80;
        report.wpToHours = report.totalWeightPoints / targetStoryPoints;

        // Reset metrics for members with no weight points (not working on any tasks)
        if (report.totalWeightPoints === 0) {
          this.resetMemberMetrics(report);
        }
      },
    );

    return Array.from(reports.values()).filter(
      (report) => report.totalWeightPoints > 0,
    );
  }

  private calculateDefectRate(defectCount: number): string {
    if (defectCount <= 2) return '100%';
    if (defectCount <= 5) return '80%';
    if (defectCount <= 7) return '50%';
    return '0%';
  }

  private summarizeTeamReport(
    issues: JiraIssueReportResponseDto[],
    sprintDetails?: { startDate: string; endDate: string } | null,
    nationalHolidays: string[] = [],
  ): GetReportResponseDto {
    // Filter out members with no weight points (not working on any tasks)
    const activeMembers = issues.filter(
      (issue: JiraIssueReportResponseDto) => issue.totalWeightPoints > 0,
    );

    // Product % / Tech Debt % based on weight points
    const totalWeightPointsProduct = activeMembers.reduce(
      (sum, issue) => sum + issue.weightPointsProduct,
      0,
    );
    const totalWeightPointsTechDebt = activeMembers.reduce(
      (sum, issue) => sum + issue.weightPointsTechDebt,
      0,
    );
    const totalWP = totalWeightPointsProduct + totalWeightPointsTechDebt;

    const productPercentage = totalWP > 0 ? (totalWeightPointsProduct / totalWP) * 100 : 0;
    const techDebtPercentage = totalWP > 0 ? (totalWeightPointsTechDebt / totalWP) * 100 : 0;

    // Avg Productivity: sum(totalWeightPoints) / sum(targetWeightPoints) * 100%
    const sumTotalWP = activeMembers.reduce(
      (sum, issue) => sum + issue.totalWeightPoints,
      0,
    );
    const sumTargetWP = activeMembers.reduce(
      (sum, issue) => sum + issue.targetWeightPoints,
      0,
    );
    const averageProductivity = sumTargetWP > 0
      ? (sumTotalWP / sumTargetWP) * 100
      : 0;

    // Calculate total working days for the sprint (excluding weekends and holidays only)
    let totalWorkingDays: number | undefined;
    if (sprintDetails) {
      totalWorkingDays = calculateWorkingDays(
        this.parseLocalDate(sprintDetails.startDate),
        this.parseLocalDate(sprintDetails.endDate),
        [], // No leave dates - we only exclude weekends and holidays for sprint total
        nationalHolidays,
      );
    }

    // Calculate average working days per team member (accounts for leaves)
    const membersWithWorkingDays = activeMembers.filter(
      (issue) => issue.workingDays !== undefined,
    );
    const averageWorkingDays =
      membersWithWorkingDays.length > 0
        ? membersWithWorkingDays.reduce((sum, issue) => sum + (issue.workingDays || 0), 0) / membersWithWorkingDays.length
        : undefined;

    // Calculate total weight points for all team members
    const totalWeightPoints = activeMembers.reduce(
      (sum, issue) => sum + issue.totalWeightPoints,
      0,
    );

    // Calculate total working days for all active members (sum of man-days)
    const teamTotalWorkingDays = activeMembers.reduce(
      (sum, issue) => sum + (issue.workingDays || 0),
      0,
    );

    // Calculate average WP per hour: (Total Team WP / Total Team Working Days) / 8
    const averageWpPerHour =
      teamTotalWorkingDays > 0
        ? (totalWeightPoints / teamTotalWorkingDays) / 8
        : 0;

    return {
      issues,
      totalWeightPointsProduct,
      totalWeightPointsTechDebt,
      productPercentage: `${productPercentage.toFixed(2)}%`,
      techDebtPercentage: `${techDebtPercentage.toFixed(2)}%`,
      averageProductivity: `${averageProductivity.toFixed(2)}%`,
      totalWorkingDays,
      averageWorkingDays,
      averageWpPerHour,
      totalWeightPoints,
      sprintStartDate: sprintDetails?.startDate,
      sprintEndDate: sprintDetails?.endDate,
    };
  }

  private resetMemberMetrics(report: JiraIssueReportResponseDto) {
    report.totalWeightPoints = 0;
    report.weightPointsProduct = 0;
    report.weightPointsTechDebt = 0;
    report.devDefect = 0;
    report.devDefectRate = '0%';
    report.productivityRate = '0%';
    report.wpToHours = 0;
  }

  private processIndividualIssue(
    issue: JiraIssueEntity,
    accountIdMap: Map<string, string>,
    reports: Map<string, JiraIssueReportResponseDto>,
    complexityMap: Map<string, { totalComplexity: number; count: number }>,
  ): void {
    const accountId = issue.fields.assignee?.accountId?.toLowerCase();
    if (!accountId) return;

    const memberName = accountIdMap.get(accountId);
    if (!memberName) return;

    const strategies = this.strategyFactory.createStrategies(issue);
    const weightPoints =
      strategies.issueCategorizer.getWeightPointsCategory(issue);
    const complexityWeight =
      strategies.complexityWeightStrategy.calculateWeight(issue);

    const report = reports.get(memberName);
    if (!report) return;

    this.updateReportMetrics(
      report,
      weightPoints,
      complexityWeight,
      issue,
    );
    this.updateComplexityMetrics(complexityMap, memberName, complexityWeight);
  }

  private updateReportMetrics(
    report: JiraIssueReportResponseDto,
    weightPoints: 'weightPointsProduct' | 'weightPointsTechDebt',
    complexityWeight: number,
    issue: JiraIssueEntity,
  ): void {
    // Populate weight points based on task type (product or tech debt)
    report[weightPoints] += complexityWeight;

    // Track issue key for lazy-loading details
    report.issueKeys.push(issue.key);

    // Count bugs
    if (issue.fields.issuetype?.name === 'Bug') {
      report.devDefect++;
    }
  }

  private updateComplexityMetrics(
    complexityMap: Map<string, { totalComplexity: number; count: number }>,
    memberName: string,
    complexityWeight: number,
  ): void {
    const complexityData = complexityMap.get(memberName);
    if (complexityData) {
      complexityData.totalComplexity += complexityWeight;
      complexityData.count++;
    }
  }
}
