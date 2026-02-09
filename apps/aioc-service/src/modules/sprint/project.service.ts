import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectDto, SprintDto } from './interfaces/project.dto';
import { ProjectEntity, Sprint } from './interfaces/project.entity';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private projectRepository: ProjectRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async fetchAllSprint(boardId: number): Promise<SprintDto[]> {
    const CACHE_KEY = `sprints_${boardId}`;
    const cachedSprints = await this.cacheManager.get<SprintDto[]>(CACHE_KEY);

    if (cachedSprints) {
      this.logger.debug(`Using cached sprints for board ${boardId}`);
      return cachedSprints;
    }

    const sprints = await this.projectRepository.fetchJiraSprint(boardId);

    const result = sprints.map((sprint: Sprint) => ({
      id: sprint.id,
      state: sprint.state,
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    }));

    // Cache for 1 hour
    await this.cacheManager.set(CACHE_KEY, result, 3600000);

    return result;
  }

  async fetchAllProject(): Promise<ProjectDto[]> {
    const response = await this.projectRepository.fetchJiraProject();
    return response.map((project: ProjectEntity) => ({
      id: project.id,
      key: project.key,
      name: project.name,
    }));
  }
}
