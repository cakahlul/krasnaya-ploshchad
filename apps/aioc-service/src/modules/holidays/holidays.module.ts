import { Module } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [HolidaysService],
  exports: [HolidaysService],
})
export class HolidaysModule {}
