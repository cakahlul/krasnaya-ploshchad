import { SprintRepository } from './sprint.repository';
import { serverCache } from '@server/cache/server-cache';
import { SprintDto, ProjectDto, Sprint, ProjectEntity } from '@shared/types/sprint.types';

const SPRINT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

class SprintService {
  constructor(private readonly repo: SprintRepository) {}

  async fetchAllSprint(boardId: number): Promise<SprintDto[]> {
    const key = `sprints_${boardId}`;
    const cached = serverCache.get<SprintDto[]>(key);
    if (cached) return cached;

    const sprints = await this.repo.fetchJiraSprint(boardId);
    const result = sprints.map((s: Sprint) => ({
      id: s.id,
      state: s.state,
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
    }));

    serverCache.set(key, result, SPRINT_CACHE_TTL_MS);
    return result;
  }

  async fetchIssuesBySprintId(sprintId: number): Promise<any[]> {
    return this.repo.fetchIssuesBySprintId(sprintId);
  }

  async fetchAllProject(): Promise<ProjectDto[]> {
    const projects = await this.repo.fetchJiraProject();
    return projects.map((p: ProjectEntity) => ({
      id: p.id,
      key: p.key,
      name: p.name,
    }));
  }
}

export const sprintService = new SprintService(new SprintRepository());
