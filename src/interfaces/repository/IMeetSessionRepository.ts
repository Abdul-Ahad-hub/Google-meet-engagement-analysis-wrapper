import { MeetSession } from '../../entities/MeetSession';

export interface IMeetSessionRepository {
  upsertSession(session: Partial<MeetSession>): Promise<MeetSession>;
  findSession(sessionId: string): Promise<MeetSession | null>;
  /** Newest-first sessions saved by one user (matched on verified e-mail). */
  findSessionsByUserEmail(userEmail: string, limit: number): Promise<MeetSession[]>;
}
