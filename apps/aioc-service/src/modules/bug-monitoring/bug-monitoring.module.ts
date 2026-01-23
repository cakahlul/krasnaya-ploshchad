import { Module } from '@nestjs/common';
import { BugMonitoringController } from './bug-monitoring.controller';
import { BugMonitoringService } from './bug-monitoring.service';
import { BugMonitoringRepository } from './repositories/bug-monitoring.repository';
import { UserAccessModule } from '../user-access/user-access.module';

@Module({
  imports: [UserAccessModule],
  controllers: [BugMonitoringController],
  providers: [BugMonitoringService, BugMonitoringRepository],
  exports: [BugMonitoringService],
})
export class BugMonitoringModule {}
