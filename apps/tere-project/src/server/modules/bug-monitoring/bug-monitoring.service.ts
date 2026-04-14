import { BugMonitoringRepository } from './bug-monitoring.repository';
import {
  Bug,
  BugsByStatus,
  BugMonitoringData,
  BugStatistics,
  PriorityDistribution,
  JiraBugEntity,
} from '@shared/types/bug-monitoring.types';
import { BugSummaryDto } from '@shared/types/dashboard.types';

const ACTIVE_STATUSES = ['To Do', 'In Progress', 'Ready to Test', 'Detected', 'In Review'];
const PRIORITY_ORDER = ['Highest', 'High', 'Medium', 'Low', 'Lowest', 'None'];

class BugMonitoringService {
  constructor(private readonly repo: BugMonitoringRepository) {}

  async getBugsForBoard(boardId: number): Promise<BugMonitoringData> {
    const allJira = await this.repo.fetchBugsByBoard(boardId);
    const allBugs = this.transformBugs(allJira);
    const activeBugs = allBugs.filter((b) => ACTIVE_STATUSES.includes(b.status));

    return {
      bugsByStatus: this.groupBugsByStatus(activeBugs),
      statistics: this.calculateStatistics(allBugs),
      allBugs,
    };
  }

  async getBugSummary(boardId: number): Promise<BugSummaryDto> {
    const allJira = await this.repo.fetchBugsByBoard(boardId);
    const allBugs = this.transformBugs(allJira);
    const active = allBugs.filter((b) => ACTIVE_STATUSES.includes(b.status));

    const byPriority = (p: string) => active.filter((b) => b.priority === p).length;
    const totalDays = active.reduce((s, b) => s + b.daysOpen, 0);

    return {
      totalBugs: active.length,
      criticalCount: byPriority('Highest'),
      highCount: byPriority('High'),
      mediumCount: byPriority('Medium'),
      lowCount: byPriority('Low'),
      averageDaysOpen: active.length > 0 ? totalDays / active.length : 0,
    };
  }

  private transformBugs(jiraBugs: JiraBugEntity[]): Bug[] {
    return jiraBugs.map((bug) => ({
      key: bug.key,
      summary: bug.fields.summary,
      status: bug.fields.status.name,
      priority: bug.fields.priority?.name ?? 'None',
      assignee: bug.fields.assignee?.displayName ?? null,
      created: bug.fields.created,
      updated: bug.fields.updated,
      daysOpen: Math.floor((Date.now() - new Date(bug.fields.created).getTime()) / 86_400_000),
    }));
  }

  private groupBugsByStatus(bugs: Bug[]): BugsByStatus[] {
    const map = new Map<string, Bug[]>();
    bugs.forEach((b) => {
      if (!map.has(b.status)) map.set(b.status, []);
      map.get(b.status)!.push(b);
    });

    const groups: BugsByStatus[] = [];
    ACTIVE_STATUSES.forEach((status) => {
      const statusBugs = map.get(status);
      if (statusBugs) {
        groups.push({ status, bugs: statusBugs, count: statusBugs.length });
        map.delete(status);
      }
    });
    map.forEach((statusBugs, status) =>
      groups.push({ status, bugs: statusBugs, count: statusBugs.length }),
    );
    return groups;
  }

  private calculateStatistics(bugs: Bug[]): BugStatistics {
    const countByStatus: Record<string, number> = {};
    const priorityCount: Record<string, number> = {};
    const assigneeCount: Record<string, number> = {};
    let totalDays = 0;

    bugs.forEach((b) => {
      countByStatus[b.status] = (countByStatus[b.status] ?? 0) + 1;
      priorityCount[b.priority] = (priorityCount[b.priority] ?? 0) + 1;
      const a = b.assignee ?? 'Unassigned';
      assigneeCount[a] = (assigneeCount[a] ?? 0) + 1;
      totalDays += b.daysOpen;
    });

    const priorityDistribution: PriorityDistribution[] = Object.entries(priorityCount)
      .map(([priority, count]) => ({ priority, count }))
      .sort((a, b) => {
        const ai = PRIORITY_ORDER.indexOf(a.priority);
        const bi = PRIORITY_ORDER.indexOf(b.priority);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

    return {
      totalCount: bugs.length,
      countByStatus,
      priorityDistribution,
      averageDaysOpen: bugs.length > 0 ? totalDays / bugs.length : 0,
      assigneeDistribution: assigneeCount,
    };
  }
}

export const bugMonitoringService = new BugMonitoringService(new BugMonitoringRepository());
