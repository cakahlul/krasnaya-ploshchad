import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsModule } from './modules/reports/reports.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectModule } from './modules/sprint/project.module';
import { TalentLeaveModule } from './modules/talent-leave/talent-leave.module';
import { UserAccessModule } from './modules/user-access/user-access.module';
import { BugMonitoringModule } from './modules/bug-monitoring/bug-monitoring.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SearchModule } from './modules/search/search.module';
import { APP_GUARD } from '@nestjs/core';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ReportsModule,
    ProjectModule,
    TalentLeaveModule,
    UserAccessModule,
    BugMonitoringModule,
    DashboardModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
})
export class AppModule {}

