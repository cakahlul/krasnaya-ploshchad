import { Injectable, Logger } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';
import { ProjectService } from '../sprint/project.service';
import { BugMonitoringService } from '../bug-monitoring/bug-monitoring.service';
import {
  DashboardSummaryResponseDto,
  TeamSummaryDto,
  BugSummaryDto,
} from './interfaces/dashboard.dto';

// Board IDs
const BOARD_DS = 143;
const BOARD_SLS = 142;
const BOARD_BUZZ = 177;

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly projectService: ProjectService,
    private readonly bugMonitoringService: BugMonitoringService,
  ) {}

  async getDashboardSummary(): Promise<DashboardSummaryResponseDto> {
    this.logger.log('Generating dashboard summary');

    // Fetch all data in parallel - using openSprints() for reports
    const [dsReport, slsReport, bugs, dsWorkItems, slsWorkItems] =
      await Promise.all([
        this.reportsService.generateOpenSprintReport('DS').catch((e) => {
          this.logger.error(`Failed to fetch DS report: ${e.message}`);
          return null;
        }),
        this.reportsService.generateOpenSprintReport('SLS').catch((e) => {
          this.logger.error(`Failed to fetch SLS report: ${e.message}`);
          return null;
        }),
        this.bugMonitoringService.getBugsForBoard(BOARD_BUZZ).catch((e) => {
          this.logger.error(`Failed to fetch BUZZ bugs: ${e.message}`);
          return null;
        }),
        this.reportsService.getSprintWorkItemStats('DS').catch((e) => {
          this.logger.error(`Failed to fetch DS work items: ${e.message}`);
          return { totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null };
        }),
        this.reportsService.getSprintWorkItemStats('SLS').catch((e) => {
          this.logger.error(`Failed to fetch SLS work items: ${e.message}`);
          return { totalWorkItems: 0, closedWorkItems: 0, averageHoursOpen: null };
        }),
      ]);

    // Build DS team summary
    const dsTeamSummary: TeamSummaryDto = {
      teamName: 'Funding/User (DS)',
      boardId: BOARD_DS,
      sprintName: dsReport?.sprintName || null,
      sprintState: dsReport ? 'active' : null,
      averageProductivity: dsReport?.averageProductivity || null,
      averageWpPerHour: dsReport?.averageWpPerHour || null,
      teamMembers: dsReport?.issues?.length || 0,
      productPercentage: dsReport?.productPercentage || null,
      techDebtPercentage: dsReport?.techDebtPercentage || null,
      totalWorkingDays: dsReport?.totalWorkingDays || null,
      totalWorkItems: dsWorkItems?.totalWorkItems || 0,
      closedWorkItems: dsWorkItems?.closedWorkItems || 0,
      averageHoursOpen: dsWorkItems?.averageHoursOpen || null,
    };

    // Build SLS team summary
    const slsTeamSummary: TeamSummaryDto = {
      teamName: 'Lending/Transaction (SLS)',
      boardId: BOARD_SLS,
      sprintName: slsReport?.sprintName || null,
      sprintState: slsReport ? 'active' : null,
      averageProductivity: slsReport?.averageProductivity || null,
      averageWpPerHour: slsReport?.averageWpPerHour || null,
      teamMembers: slsReport?.issues?.length || 0,
      productPercentage: slsReport?.productPercentage || null,
      techDebtPercentage: slsReport?.techDebtPercentage || null,
      totalWorkingDays: slsReport?.totalWorkingDays || null,
      totalWorkItems: slsWorkItems?.totalWorkItems || 0,
      closedWorkItems: slsWorkItems?.closedWorkItems || 0,
      averageHoursOpen: slsWorkItems?.averageHoursOpen || null,
    };

    // Log bug stats for debugging
    const stats = bugs?.statistics;
    this.logger.log(`Bug Stats Debug: Total=${stats?.totalCount}`);
    if (stats?.priorityDistribution) {
       this.logger.log(`Priorities: ${JSON.stringify(stats.priorityDistribution)}`);
    }

    // Build bug summary from BUZZ board data - using ONLY active/open bugs (not Done)
    const activeStatuses = ['To Do', 'In Progress', 'Ready to Test'];
    const activeBugsOnly = bugs?.allBugs?.filter(bug => activeStatuses.includes(bug.status)) || [];
    
    // Calculate statistics from active bugs only
    const activePriorityCount: Record<string, number> = {};
    let totalDaysOpen = 0;
    
    activeBugsOnly.forEach(bug => {
      activePriorityCount[bug.priority] = (activePriorityCount[bug.priority] || 0) + 1;
      totalDaysOpen += bug.daysOpen;
    });

    const getActivePriorityCount = (priority: string): number => {
      return activePriorityCount[priority] || 0;
    };

    const bugSummary: BugSummaryDto = {
      totalBugs: activeBugsOnly.length,
      criticalCount: getActivePriorityCount('Highest'),
      highCount: getActivePriorityCount('High'),
      mediumCount: getActivePriorityCount('Medium'),
      lowCount: getActivePriorityCount('Low'),
      averageDaysOpen: activeBugsOnly.length > 0 ? totalDaysOpen / activeBugsOnly.length : 0,
    };

    return {
      ds: dsTeamSummary,
      sls: slsTeamSummary,
      bugs: bugSummary,
      generatedAt: new Date().toISOString(),
    };
  }
}
