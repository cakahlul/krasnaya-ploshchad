import { Controller, Get, Logger } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryResponseDto } from './interfaces/dashboard.dto';
import { Public } from 'src/auth/public.decorator';

@Public()
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(): Promise<DashboardSummaryResponseDto> {
    this.logger.log('Dashboard summary requested');
    return this.dashboardService.getDashboardSummary();
  }
}
