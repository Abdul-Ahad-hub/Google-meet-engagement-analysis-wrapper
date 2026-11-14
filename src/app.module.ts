import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/DatabaseModule';
import { MeetEngagementModule } from './modules/MeetEngagementModule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MeetEngagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
