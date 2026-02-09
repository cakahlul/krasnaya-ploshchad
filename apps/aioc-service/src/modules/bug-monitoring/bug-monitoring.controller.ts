import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BugMonitoringService } from './bug-monitoring.service';
import { GetBugsResponseDto } from './interfaces/bug-monitoring.dto';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('bug-monitoring')
@UseGuards(RolesGuard)
export class BugMonitoringController {
  constructor(private readonly bugMonitoringService: BugMonitoringService) {}

  @Get('bugs')
  @Roles('Lead')
  async getBugs(
    @Query('boardId', ParseIntPipe) boardId: number,
  ): Promise<GetBugsResponseDto> {
    return this.bugMonitoringService.getBugsForBoard(boardId);
  }

  @Get('summary')
  @Roles('Lead')
  async getBugSummary(
    @Query('boardId', ParseIntPipe) boardId: number,
  ) {
    return this.bugMonitoringService.getBugSummary(boardId);
  }
}
