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

@Injectable()
export class ReportsService {
  private readonly minimumComplexityByLevels: { [key: string]: number } = {
    junior: 32,
    medior: 48,
    senior: 80,
    'individual contributor': 80,
  };

  constructor(
    private readonly jiraReportRepository: ReportJiraRepository,
    private readonly strategyFactory: IssueProcessingStrategyFactory,
  ) {}

  async generateReport(
    sprint: string,
    project: string,
  ): Promise<GetReportResponseDto> {
    const rawData = await this.fetchRawData(sprint, project);
    const teamReport = this.processRawData(rawData, project);
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

  private processRawData(
    rawData: JiraIssueEntity[],
    project: string,
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
        // Productivity calculation (total points / 80 * 100%)
        const maximumPoints = report.member === 'Rahmad' ? 40 : 80;
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

    return Array.from(reports.values());
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

    return {
      issues,
      totalIssueProduct,
      totalIssueTechDebt,
      productPercentage: `${productPercentage.toFixed(2)}%`,
      techDebtPercentage: `${techDebtPercentage.toFixed(2)}%`,
      averageProductivity: `${averageProductivity.toFixed(2)}%`,
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
