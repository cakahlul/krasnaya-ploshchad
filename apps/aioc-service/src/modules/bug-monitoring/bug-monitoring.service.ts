import { Injectable, Logger } from '@nestjs/common';
import { BugMonitoringRepository } from './repositories/bug-monitoring.repository';
import {
  BugDto,
  BugStatusGroupDto,
  GetBugsResponseDto,
  BugStatisticsDto,
  PriorityDistributionDto,
} from './interfaces/bug-monitoring.dto';
import { JiraBugEntity } from './interfaces/bug-monitoring.entity';

@Injectable()
export class BugMonitoringService {
  private readonly logger = new Logger(BugMonitoringService.name);

  constructor(
    private readonly bugMonitoringRepository: BugMonitoringRepository,
  ) {}

  async getBugsForBoard(boardId: number): Promise<GetBugsResponseDto> {
    this.logger.log(`Fetching bugs for board ${boardId}`);

    const allBugs = await this.bugMonitoringRepository.fetchBugsByBoard(boardId);
    const transformedBugs = this.transformBugs(allBugs);
    
    // Filter bugs for Active Bug List table ONLY
    const activeStatusesForTable = ['To Do', 'In Progress', 'Ready to Test'];
    const activeBugsForTable = transformedBugs.filter(bug => 
      activeStatusesForTable.includes(bug.status)
    );
    
    // Group ONLY active bugs for the table
    const bugsByStatus = this.groupBugsByStatus(activeBugsForTable);
    
    // Calculate statistics from ALL bugs
    const statistics = this.calculateStatistics(transformedBugs);

    return {
      bugsByStatus, // Filtered bugs for Active Bug List table
      statistics,   // Statistics from ALL bugs
      allBugs: transformedBugs, // All bugs for time series charts
    };
  }

  private transformBugs(jiraBugs: JiraBugEntity[]): BugDto[] {
    return jiraBugs.map((bug) => {
      const createdDate = new Date(bug.fields.created);
      const now = new Date();
      const daysOpen = Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        key: bug.key,
        summary: bug.fields.summary,
        status: bug.fields.status.name,
        priority: bug.fields.priority?.name || 'None',
        assignee: bug.fields.assignee?.displayName || null,
        created: bug.fields.created,
        updated: bug.fields.updated,
        daysOpen,
      };
    });
  }

  private groupBugsByStatus(bugs: BugDto[]): BugStatusGroupDto[] {
    const statusMap = new Map<string, BugDto[]>();

    // Define order of statuses (matching JQL filter)
    const activeStatuses = ['To Do', 'In Progress', 'Ready to Test'];

    bugs.forEach((bug) => {
      if (!statusMap.has(bug.status)) {
        statusMap.set(bug.status, []);
      }
      statusMap.get(bug.status)!.push(bug);
    });

    // Create groups in specific order
    const groups: BugStatusGroupDto[] = [];

    // Add known statuses in order
    activeStatuses.forEach((status) => {
      if (statusMap.has(status)) {
        const statusBugs = statusMap.get(status)!;
        groups.push({
          status,
          bugs: statusBugs,
          count: statusBugs.length,
        });
        statusMap.delete(status);
      }
    });

    // Add any remaining statuses not in the predefined order
    statusMap.forEach((statusBugs, status) => {
      groups.push({
        status,
        bugs: statusBugs,
        count: statusBugs.length,
      });
    });

    return groups;
  }

  private calculateStatistics(bugs: BugDto[]): BugStatisticsDto {
    const countByStatus: Record<string, number> = {};
    const priorityCount: Record<string, number> = {};
    const assigneeCount: Record<string, number> = {};
    let totalDaysOpen = 0;

    bugs.forEach((bug) => {
      // Count by status
      countByStatus[bug.status] = (countByStatus[bug.status] || 0) + 1;

      // Count by priority
      priorityCount[bug.priority] = (priorityCount[bug.priority] || 0) + 1;

      // Count by assignee
      const assignee = bug.assignee || 'Unassigned';
      assigneeCount[assignee] = (assigneeCount[assignee] || 0) + 1;

      // Sum days open
      totalDaysOpen += bug.daysOpen;
    });

    const priorityDistribution: PriorityDistributionDto[] = Object.entries(
      priorityCount,
    ).map(([priority, count]) => ({
      priority,
      count,
    }));

    // Sort priority distribution by priority level
    const priorityOrder = ['Highest', 'High', 'Medium', 'Low', 'Lowest', 'None'];
    priorityDistribution.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.priority);
      const bIndex = priorityOrder.indexOf(b.priority);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return {
      totalCount: bugs.length,
      countByStatus,
      priorityDistribution,
      averageDaysOpen: bugs.length > 0 ? totalDaysOpen / bugs.length : 0,
      assigneeDistribution: assigneeCount,
    };
  }
}
