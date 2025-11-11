import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsModule } from './modules/reports/reports.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectModule } from './modules/sprint/project.module';
import { TalentLeaveModule } from './modules/talent-leave/talent-leave.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ReportsModule,
    ProjectModule,
    TalentLeaveModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
