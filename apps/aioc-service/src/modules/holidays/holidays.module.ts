import { Module } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { HolidaysRepository } from './holidays.repository';

@Module({
  providers: [HolidaysRepository, HolidaysService],
  exports: [HolidaysService],
})
export class HolidaysModule {}
