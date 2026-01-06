import { Injectable } from '@nestjs/common';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectDto, SprintDto } from './interfaces/project.dto';
import { ProjectEntity, Sprint } from './interfaces/project.entity';

@Injectable()
export class ProjectService {
  constructor(private projectRepository: ProjectRepository) {}

  async fetchAllSprint(boardId: number): Promise<SprintDto[]> {
    const sprints = await this.projectRepository.fetchJiraSprint(boardId);

    return sprints.map((sprint: Sprint) => ({
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
