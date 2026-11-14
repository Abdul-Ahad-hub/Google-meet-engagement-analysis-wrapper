import { MeetFrameDto } from '../../dtos/MeetFrameDto';
import { MeetSessionSummaryDto } from '../../dtos/MeetSessionSummaryDto';
import { MeetEngagementResultDto } from '../../dtos/MeetEngagementResultDto';
import { OnlyResultDto } from '../../dtos/OnlyResultDto';
import { OnlyLandmarksDto } from '../../dtos/OnlyLandmarksDto';
import { MeetSession } from '../../entities/MeetSession';
import { EngineUpload } from './IEngagementEngineClient';

export interface MeetWindowAnalysisResponse {
  ok: true;
  duplicate: boolean;
  aiJobId?: string;
  result: MeetEngagementResultDto;
}

export interface MeetSessionReport {
  session: MeetSession | null;
  records: MeetEngagementResultDto[];
}

export interface IMeetEngagementService {
  analyzeFrame(dto: MeetFrameDto): Promise<MeetWindowAnalysisResponse>;
  saveSession(dto: MeetSessionSummaryDto): Promise<MeetSession>;
  saveOnlyResult(dto: OnlyResultDto): Promise<unknown>;
  analyzeOnlyLandmarks(dto: OnlyLandmarksDto): Promise<unknown>;
  analyzeVideo(video: EngineUpload, meta: Record<string, unknown>): Promise<unknown>;
  analyzeVideoLandmarks(
    video: EngineUpload,
    landmarks: EngineUpload,
    meta: Record<string, unknown>,
  ): Promise<unknown>;
  flushSession(sessionId: string): Promise<MeetEngagementResultDto[]>;
  getSessionReport(sessionId: string): Promise<MeetSessionReport>;
  /** Sessions owned by the given (verified) e-mail, newest first. */
  listUserSessions(userEmail: string): Promise<MeetSession[]>;
  /** Full report of a session, only if it belongs to the given e-mail; otherwise null. */
  getUserSessionReport(sessionId: string, userEmail: string): Promise<MeetSessionReport | null>;
}
