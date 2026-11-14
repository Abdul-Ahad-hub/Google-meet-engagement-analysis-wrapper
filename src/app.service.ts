import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getHello(): string {
    return 'Google Meet Engagement Analysis Wrapper Service';
  }

  getHealth() {
    return {
      ok: true,
      status: 'ok',
      service: 'google-meet-engagement-wrapper',
      databaseConfigured: Boolean(this.config.get<string>('DATABASE_URL')),
      engagementEngineUrl:
        this.config.get<string>('ENGAGEMENT_ENGINE_URL') ||
        'https://engagement-analysis-system.vercel.app',
    };
  }
}
