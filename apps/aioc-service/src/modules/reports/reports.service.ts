import { Injectable } from '@nestjs/common';
import { ReportJiraRepository } from './repositories/report.jira.repository';
import {
  JiraIssueReportResponseDto,
  GetReportResponseDto,
  JiraSearchRequestDto,
  GetAllProjectResponseDto,
} from './interfaces/report.dto';
import { JiraIssueEntity, JiraProjectEntity } from './interfaces/report.entity';
import { TeamMember } from 'src/shared/interfaces/team-member.interface';
import { teamMembers } from 'src/shared/constants/team-member.const';

@Injectable()
export class ReportsService {
  constructor(private jiraReportRepository: ReportJiraRepository) {}

  async generateReport(
    sprint: string,
    project: string,
  ): Promise<GetReportResponseDto> {
    const rawData = await this.fetchRawData(sprint, project);
    const teamReport = this.processRawData(rawData, project);
    return this.summarizeTeamReport(teamReport);
  }

  async fetchAllProject(): Promise<GetAllProjectResponseDto[]> {
    const response = await this.jiraReportRepository.fetchJiraProject();
    return response.map((project: JiraProjectEntity) => ({
      id: project.id,
      key: project.key,
      name: project.name,
    }));
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
          },
        ]),
    );

    // Complexity weighting configuration
    const complexityWeights: { [key: string]: number } = {
      /**
       * Value per category
       * Very Low: 1.5
       * Low: 2
       * Medium: 4
       * High: 8
       */
      '10650': 1.5, // Very Low complexity
      '10651': 2, // Low Complexity
      '10652': 4, // Medium complexity
      '10653': 8, // High complexity
    };

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
        const accountId = issue.fields.assignee?.accountId?.toLowerCase();
        if (!accountId) return;

        const memberName = accountIdMap.get(accountId);
        if (!memberName) return;

        const points = issue.fields.customfield_10005 ?? 0;
        const category =
          issue.fields.customfield_10796?.value === 'SP Product'
            ? 'productPoint'
            : 'techDebtPoint';

        const report = reports.get(memberName);
        // Weight of Complexity calculation
        const complexityId =
          issue.fields.customfield_11015?.id?.toString() ?? '10650';
        const complexityWeight = complexityWeights[complexityId] ?? 1;
        if (report) {
          // Update points
          report[category] += points;
          report.totalPoint += points;

          // Count bugs
          if (issue.fields.issuetype?.name === 'Bug') {
            report.devDefect++;
          }

          // Update complexity metrics
          const complexityData = complexityMap.get(memberName);
          if (complexityData) {
            complexityData.totalComplexity += complexityWeight;
            complexityData.count++;
          }
        }
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
          ? complexityData.totalComplexity / complexityData.count
          : 0;
        report.averageComplexity = average.toFixed(2);
        report.totalWeightPoints = complexityData?.totalComplexity ?? 0;
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
    const totalIssueProduct = issues.reduce(
      (sum, issue) => sum + issue.productPoint,
      0,
    );
    const totalIssueTechDebt = issues.reduce(
      (sum, issue) => sum + issue.techDebtPoint,
      0,
    );
    const totalIssues = totalIssueProduct + totalIssueTechDebt;

    const productPercentage = (totalIssueProduct / totalIssues) * 100 || 0;
    const techDebtPercentage = (totalIssueTechDebt / totalIssues) * 100 || 0;

    const productivityRates = issues.map((issue: JiraIssueReportResponseDto) =>
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
}
