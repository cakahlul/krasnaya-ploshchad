import { Controller, Get, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectDto, SprintDto } from './interfaces/project.dto';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('')
  async getAll(): Promise<ProjectDto[]> {
    return await this.projectService.fetchAllProject();
  }

  @Get('sprint')
  async getAllSprint( @Query('boardId') boardId: number): Promise<SprintDto[]> {
    return await this.projectService.fetchAllSprint(boardId);
  }
}
