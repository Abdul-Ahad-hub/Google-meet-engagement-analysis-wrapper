import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetSession } from '../entities/MeetSession';
import { IMeetSessionRepository } from '../interfaces/repository/IMeetSessionRepository';
import { PersistenceException } from '../common/exceptions/Exceptions';

@Injectable()
export class MeetSessionRepository implements IMeetSessionRepository {
  constructor(
    @InjectRepository(MeetSession)
    private readonly sessionRepository: Repository<MeetSession>,
  ) {}

  async upsertSession(session: Partial<MeetSession>): Promise<MeetSession> {
    try {
      return await this.sessionRepository.save(this.sessionRepository.create(session));
    } catch (err) {
      throw new PersistenceException({ operation: 'upsertSession', cause: (err as Error).message });
    }
  }

  async findSession(sessionId: string): Promise<MeetSession | null> {
    try {
      return await this.sessionRepository.findOne({ where: { sessionId } });
    } catch (err) {
      throw new PersistenceException({ operation: 'findSession', cause: (err as Error).message });
    }
  }

  async findSessionsByUserEmail(userEmail: string, limit: number): Promise<MeetSession[]> {
    try {
      return await this.sessionRepository.find({
        where: { userEmail },
        order: { savedAt: 'DESC' },
        take: limit,
      });
    } catch (err) {
      throw new PersistenceException({
        operation: 'findSessionsByUserEmail',
        cause: (err as Error).message,
      });
    }
  }
}
