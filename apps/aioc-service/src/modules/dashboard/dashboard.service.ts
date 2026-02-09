import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getDashboardSummary(): Promise<DashboardSummaryResponseDto> {
    const CACHE_KEY = 'dashboard_summary';
    const cachedSummary = await this.cacheManager.get<DashboardSummaryResponseDto>(CACHE_KEY);

    if (cachedSummary) {
      this.logger.log('Using cached dashboard summary');
      return cachedSummary;
    }

    this.logger.log('Generating dashboard summary');

    // ... (rest of the method remains mostly same, just wrap return with set cache) ...
    // Fetch all data in parallel - using openSprints() for reports
    const [dsReport, slsReport, dsWorkItems, slsWorkItems] =
      await Promise.all([
        this.reportsService.generateOpenSprintReport('DS').catch((e) => {
          this.logger.error(`Failed to fetch DS report: ${e.message}`);
          return null;
        }),
        this.reportsService.generateOpenSprintReport('SLS').catch((e) => {
          this.logger.error(`Failed to fetch SLS report: ${e.message}`);
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

    const response = {
      ds: dsTeamSummary,
      sls: slsTeamSummary,
      generatedAt: new Date().toISOString(),
    };

    // Cache for 5 minutes (300 seconds)
    await this.cacheManager.set(CACHE_KEY, response, 300000); // 300000 ms = 5 mins

    return response;
  }
}
