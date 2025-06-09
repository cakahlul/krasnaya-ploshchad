import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectDto, SprintDto } from './interfaces/project.dto';

@Controller('project')
export class ProjectController {
  private readonly logger = new Logger(ProjectController.name);

  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async getAll(): Promise<ProjectDto[]> {
    this.logger.log('Getting all projects');
    return await this.projectService.fetchAllProject();
  }

  @Get('sprint')
  async getAllSprint(@Query('boardId') boardId: number): Promise<SprintDto[]> {
    this.logger.log(`Getting sprints for boardId: ${boardId}`);
    return await this.projectService.fetchAllSprint(boardId);
  }
}
