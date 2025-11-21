import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { TalentLeaveController } from './talent-leave.controller';
import { TalentLeaveService } from './talent-leave.service';
import { TalentLeaveRepository } from './repositories/talent-leave.repository';
import { TalentLeaveExportService } from './talent-leave-export.service';
import { GoogleSheetsClient } from './clients/google-sheets.client';

@Module({
  imports: [
    HttpModule,
    ThrottlerModule.forRoot([
      {
        ttl: 3600000, // 1 hour in milliseconds
        limit: 10, // 10 requests per hour
      },
    ]),
  ],
  controllers: [TalentLeaveController],
  providers: [
    TalentLeaveService,
    TalentLeaveRepository,
    TalentLeaveExportService,
    GoogleSheetsClient,
  ],
  exports: [TalentLeaveService],
})
export class TalentLeaveModule {}
