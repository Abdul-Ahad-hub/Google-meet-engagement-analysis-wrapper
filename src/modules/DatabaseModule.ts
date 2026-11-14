import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as pg from 'pg';
import { MeetSession } from '../entities/MeetSession';

/**
 * Owns the Neon (Postgres) connection for the Google Meet wrapper.
 * Persists `meet_sessions` (user ownership + meeting metadata).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL') ?? '';
        if (!url) {
          console.warn('DATABASE_URL is not configured; starting without a database connection.');
        }
        let servername: string | undefined;
        try {
          servername = new URL(url).hostname;
        } catch {
          servername = undefined;
        }
        return {
          type: 'postgres',
          driver: pg,
          url,
          manualInitialization: !url,
          ssl: { rejectUnauthorized: false, ...(servername ? { servername } : {}) },
          entities: [MeetSession],
          synchronize: true,
          extra: {
            max: 1,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
