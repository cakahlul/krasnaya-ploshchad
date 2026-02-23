import { Module } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { HolidaysRepository } from './holidays.repository';
import { HolidaysController } from './holidays.controller';

@Module({
  controllers: [HolidaysController],
  providers: [HolidaysRepository, HolidaysService],
  exports: [HolidaysService],
})
export class HolidaysModule {}
