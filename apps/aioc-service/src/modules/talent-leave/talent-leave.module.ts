import { Module } from '@nestjs/common';
import { TalentLeaveController } from './talent-leave.controller';
import { TalentLeaveService } from './talent-leave.service';
import { TalentLeaveRepository } from './repositories/talent-leave.repository';

@Module({
  controllers: [TalentLeaveController],
  providers: [TalentLeaveService, TalentLeaveRepository],
  exports: [TalentLeaveService],
})
export class TalentLeaveModule {}
