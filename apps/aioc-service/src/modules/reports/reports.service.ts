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
  private readonly minimumComplexityByLevels: { [key: string]: number } = {
    junior: 56,
    medior: 68,
    senior: 80,
    'individual contributor': 80,
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
  ): Promise<GetReportResponseDto> {
    const rawData = await this.fetchRawData(sprint, project);
    
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
    return this.summarizeTeamReport(teamReport);
  }

  private async fetchRawData(
    sprint: string,
    project: string,
  ): Promise<JiraIssueEntity[]> {
    const assignees: string[] = teamMembers
      .filter((member: TeamMember) => member.team.includes(project))
      .map((member: TeamMember) => member.id);

    const request: JiraSearchRequestDto = {
      sprint,
      assignees,
      project,
    };
    return this.jiraReportRepository.fetchRawData(request);
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
            productPoint: 0,
            techDebtPoint: 0,
            totalPoint: 0,
            productivityRate: '',
            averageComplexity: '',
            totalWeightPoints: 0,
            devDefect: 0,
            devDefectRate: '',
            level: member.level,
            weightPointsProduct: 0,
            weightPointsTechDebt: 0,
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

        // Productivity calculation (total points / (working days * 8 points per day) * 100%)
        // Each team member is expected to have 8 points per working day
        const maximumPoints = report.workingDays ? report.workingDays * 8 : 80;
        report.productivityRate = `${((report.totalPoint / maximumPoints) * 100).toFixed(2)}%`;

        // Defect rate calculation
        report.devDefectRate = this.calculateDefectRate(report.devDefect);
        // Calculate average complexity
        const complexityData = complexityMap.get(report.member);
        const average = complexityData?.count
          ? complexityData.totalComplexity /
            this.minimumComplexityByLevels[report.level]
          : 0;
        report.averageComplexity = average.toFixed(2);
        report.totalWeightPoints = complexityData?.totalComplexity ?? 0;

        // Reset metrics for members with no points (not working on any tasks)
        if (report.totalPoint === 0) {
          this.resetMemberMetrics(report);
        }
      },
    );

    return Array.from(reports.values()).filter(
      (report) => report.totalPoint > 0,
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
  ): GetReportResponseDto {
    // Filter out members with no points (not working on any tasks)
    const activeMembers = issues.filter(
      (issue: JiraIssueReportResponseDto) => issue.totalPoint > 0,
    );

    const totalIssueProduct = activeMembers.reduce(
      (sum, issue) => sum + issue.productPoint,
      0,
    );
    const totalIssueTechDebt = activeMembers.reduce(
      (sum, issue) => sum + issue.techDebtPoint,
      0,
    );
    const totalIssues = totalIssueProduct + totalIssueTechDebt;

    const productPercentage = (totalIssueProduct / totalIssues) * 100 || 0;
    const techDebtPercentage = (totalIssueTechDebt / totalIssues) * 100 || 0;

    const productivityRates = activeMembers.map(
      (issue: JiraIssueReportResponseDto) =>
        parseFloat(issue.productivityRate.replace('%', '')),
    );
    const averageProductivity =
      productivityRates.reduce((sum, rate) => sum + rate, 0) /
        productivityRates.length || 0;

    // Calculate working days metrics
    const membersWithWorkingDays = activeMembers.filter(
      (issue) => issue.workingDays !== undefined,
    );
    const totalWorkingDays = membersWithWorkingDays.reduce(
      (sum, issue) => sum + (issue.workingDays || 0),
      0,
    );
    const averageWorkingDays =
      membersWithWorkingDays.length > 0
        ? totalWorkingDays / membersWithWorkingDays.length
        : undefined;

    return {
      issues,
      totalIssueProduct,
      totalIssueTechDebt,
      productPercentage: `${productPercentage.toFixed(2)}%`,
      techDebtPercentage: `${techDebtPercentage.toFixed(2)}%`,
      averageProductivity: `${averageProductivity.toFixed(2)}%`,
      totalWorkingDays: totalWorkingDays > 0 ? totalWorkingDays : undefined,
      averageWorkingDays,
    };
  }

  private resetMemberMetrics(report: JiraIssueReportResponseDto) {
    report.totalWeightPoints = 0;
    report.weightPointsProduct = 0;
    report.weightPointsTechDebt = 0;
    report.devDefect = 0;
    report.devDefectRate = '0%';
    report.averageComplexity = '0';
    report.productivityRate = '0%';
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
    const points = issue.fields.customfield_10005 ?? 0;
    const category = strategies.issueCategorizer.categorize(issue);
    const weightPoints =
      strategies.issueCategorizer.getWeightPointsCategory(issue);
    const complexityWeight =
      strategies.complexityWeightStrategy.calculateWeight(issue);

    const report = reports.get(memberName);
    if (!report) return;

    this.updateReportMetrics(
      report,
      points,
      category,
      weightPoints,
      complexityWeight,
      issue,
    );
    this.updateComplexityMetrics(complexityMap, memberName, complexityWeight);
  }

  private updateReportMetrics(
    report: JiraIssueReportResponseDto,
    points: number,
    category: 'productPoint' | 'techDebtPoint',
    weightPoints: 'weightPointsProduct' | 'weightPointsTechDebt',
    complexityWeight: number,
    issue: JiraIssueEntity,
  ): void {
    // Update points
    report[category] += points;
    report.totalPoint += points;

    // Populate weight points based on task type (product or tech debt)
    report[weightPoints] += complexityWeight;

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
