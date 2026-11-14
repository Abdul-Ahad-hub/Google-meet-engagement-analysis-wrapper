import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetEngagementController } from '../endpoints/MeetEngagementController';
import { DashboardController } from '../endpoints/DashboardController';
import { MeetEngagementService } from '../services/MeetEngagementService';
import { MeetSessionRepository } from '../repositories/MeetSessionRepository';
import { HttpEngagementEngineClient } from '../services/HttpEngagementEngineClient';
import { MeetSession } from '../entities/MeetSession';
import { GoogleAuthGuard } from '../common/guards/GoogleAuthGuard';
import {
  ENGAGEMENT_ENGINE_CLIENT,
  MEET_ENGAGEMENT_SERVICE,
  MEET_SESSION_REPOSITORY,
} from '../common/constants/injection-tokens';

@Module({
  imports: [TypeOrmModule.forFeature([MeetSession])],
  controllers: [MeetEngagementController, DashboardController],
  providers: [
    GoogleAuthGuard,
    { provide: MEET_ENGAGEMENT_SERVICE, useClass: MeetEngagementService },
    { provide: MEET_SESSION_REPOSITORY, useClass: MeetSessionRepository },
    { provide: ENGAGEMENT_ENGINE_CLIENT, useClass: HttpEngagementEngineClient },
  ],
  exports: [MEET_ENGAGEMENT_SERVICE],
})
export class MeetEngagementModule {}
