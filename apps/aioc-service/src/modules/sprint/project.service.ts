import { Injectable, Logger } from '@nestjs/common';
import { ProjectEntity, SprintEntity } from './interfaces/project.entity';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectDto, SprintDto } from './interfaces/project.dto';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  private sprintCache: Map<number, { data: SprintEntity; timestamp: number }> =
    new Map();
  private projectCache: { data: ProjectEntity[]; timestamp: number } | null =
    null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly projectRepository: ProjectRepository) {}

  async getAllSprint(boardId: number): Promise<SprintEntity> {
    try {
      // Check cache first
      const cached = this.sprintCache.get(boardId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger.log(`Returning cached sprint data for board ${boardId}`);
        return cached.data;
      }

      this.logger.log(`Fetching fresh sprint data for board ${boardId}`);
      const sprints = await this.projectRepository.fetchJiraSprint(boardId);

      // Update cache
      this.sprintCache.set(boardId, {
        data: sprints,
        timestamp: Date.now(),
      });

      return sprints;
    } catch (error) {
      this.logger.error(`Error fetching sprints for board ${boardId}:`, error);
      throw error;
    }
  }

  async getAllProject(): Promise<ProjectEntity[]> {
    try {
      // Check cache first
      if (
        this.projectCache &&
        Date.now() - this.projectCache.timestamp < this.CACHE_TTL
      ) {
        this.logger.log('Returning cached project data');
        return this.projectCache.data;
      }

      this.logger.log('Fetching fresh project data');
      const projects = await this.projectRepository.fetchJiraProject();

      // Update cache
      this.projectCache = {
        data: projects,
        timestamp: Date.now(),
      };

      return projects;
    } catch (error) {
      this.logger.error('Error fetching projects:', error);
      throw error;
    }
  }

  async fetchAllSprint(boardId: number): Promise<SprintDto[]> {
    const response = await this.projectRepository.fetchJiraSprint(boardId);
    return response.values.map((sprint: SprintEntity) => ({
      id: sprint.id,
      state: sprint.state,
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    }));
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
