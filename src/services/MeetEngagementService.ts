import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  IMeetEngagementService,
  MeetSessionReport,
  MeetWindowAnalysisResponse,
} from '../interfaces/service/IMeetEngagementService';
import type { IMeetSessionRepository } from '../interfaces/repository/IMeetSessionRepository';
import type {
  EngineFramePayload,
  EngineSessionSummaryPayload,
  EngineUpload,
  EngineWindowResult,
  IEngagementEngineClient,
} from '../interfaces/service/IEngagementEngineClient';
import { MeetFrameDto } from '../dtos/MeetFrameDto';
import { MeetSessionSummaryDto } from '../dtos/MeetSessionSummaryDto';
import { MeetEngagementResultDto } from '../dtos/MeetEngagementResultDto';
import { OnlyResultDto } from '../dtos/OnlyResultDto';
import { OnlyLandmarksDto } from '../dtos/OnlyLandmarksDto';
import { MeetSession } from '../entities/MeetSession';
import {
  ENGAGEMENT_ENGINE_CLIENT,
  MEET_SESSION_REPOSITORY,
} from '../common/constants/injection-tokens';

interface SessionContext {
  meetingId: string | null;
  userEmail: string | null;
  userName: string | null;
  userId: string | null;
}

/**
 * Application orchestration layer for Google Meet & Dashboard.
 *
 * Responsibilities:
 *   1. Strip Google Meet / user fields before forwarding capture payloads
 *      to the domain-agnostic Engagement-Analysis-System engine.
 *   2. Persist Google Meet session metadata and user ownership in `meet_sessions`.
 *   3. Enrich engine window results with Meet/user context for the extension
 *      and the owner-scoped Analytics Dashboard.
 */
@Injectable()
export class MeetEngagementService implements IMeetEngagementService {
  private static readonly MAX_LISTED_SESSIONS = 200;
  private readonly logger = new Logger(MeetEngagementService.name);
  private readonly sessionContextCache = new Map<string, SessionContext>();

  constructor(
    @Inject(MEET_SESSION_REPOSITORY)
    private readonly meetSessionRepository: IMeetSessionRepository,
    @Inject(ENGAGEMENT_ENGINE_CLIENT)
    private readonly engineClient: IEngagementEngineClient,
  ) {}

  async analyzeFrame(dto: MeetFrameDto): Promise<MeetWindowAnalysisResponse> {
    const context: SessionContext = {
      meetingId: dto.meetingId ?? null,
      userEmail: dto.userEmail ?? null,
      userName: dto.userName ?? null,
      userId: dto.userId ?? null,
    };
    this.sessionContextCache.set(dto.sessionId, context);

    const enginePayload: EngineFramePayload = {
      sessionId: dto.sessionId,
      windowIndex: dto.windowIndex,
      startedAt: dto.startedAt,
      endedAt: dto.endedAt,
      partial: dto.partial,
      framesFilled: dto.framesFilled,
      frameIntervalMs: dto.frameIntervalMs,
      faceDetected: dto.faceDetected,
      timing: dto.timing,
      landmarks: dto.landmarks,
      frames: dto.frames,
      landmarkIndices: dto.landmarkIndices,
      landmarkCount: dto.landmarkCount,
    };

    const engineResponse = await this.engineClient.analyzeFrame(enginePayload);

    return {
      ok: true,
      duplicate: engineResponse.duplicate,
      ...(engineResponse.aiJobId ? { aiJobId: engineResponse.aiJobId } : {}),
      result: this.enrichWindowResult(engineResponse.result, context),
    };
  }

  async saveSession(dto: MeetSessionSummaryDto): Promise<MeetSession> {
    const engineSummaryPayload: EngineSessionSummaryPayload = {
      sessionId: dto.sessionId,
      savedAt: dto.savedAt,
      startedAt: dto.startedAt ?? null,
      endReason: dto.endReason ?? null,
      framesCaptured: dto.framesCaptured,
      framesWithFace: dto.framesWithFace,
      framesCenterCrop: dto.framesCenterCrop,
      avgFrameMs: dto.avgFrameMs,
      maxFrameMs: dto.maxFrameMs,
      windowsSent: dto.windowsSent,
      windowsUnsent: dto.windowsUnsent,
      ...(dto.routing !== undefined ? { routing: dto.routing } : {}),
      ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
    };

    const { session: engineSession } = await this.engineClient.saveSession(engineSummaryPayload);

    const cached = this.sessionContextCache.get(dto.sessionId);
    const saved = await this.meetSessionRepository.upsertSession({
      sessionId: dto.sessionId,
      meetingId: dto.meetingId ?? cached?.meetingId ?? null,
      userEmail: dto.userEmail ?? cached?.userEmail ?? null,
      userName: dto.userName ?? cached?.userName ?? null,
      userId: dto.userId ?? cached?.userId ?? null,
      role: dto.role ?? null,
      endReason: dto.endReason ?? engineSession.endReason ?? null,
      startedAt: dto.startedAt
        ? new Date(dto.startedAt)
        : engineSession.startedAt
          ? new Date(engineSession.startedAt)
          : null,
      savedAt: new Date(dto.savedAt),
      framesCaptured: dto.framesCaptured,
      framesWithFace: dto.framesWithFace,
      framesCenterCrop: dto.framesCenterCrop,
      avgFrameMs: dto.avgFrameMs,
      maxFrameMs: dto.maxFrameMs,
      windowsSent: dto.windowsSent,
      windowsUnsent: dto.windowsUnsent,
      mode: dto.mode ?? null,
      routing: dto.routing ?? null,
      windowsStored: engineSession.windowsStored,
      windowsInferred: engineSession.windowsInferred,
      avgEngagementScore: engineSession.avgEngagementScore,
      dominantLabel: engineSession.dominantLabel,
    });

    this.sessionContextCache.delete(dto.sessionId);
    this.logger.log(
      `Meet session ${dto.sessionId} saved for user=${saved.userEmail ?? 'anonymous'} meeting=${saved.meetingId ?? 'none'}`,
    );
    return saved;
  }

  async saveOnlyResult(dto: OnlyResultDto): Promise<unknown> {
    this.sessionContextCache.set(dto.sessionId, {
      meetingId: dto.meetingId ?? null,
      userEmail: dto.userEmail ?? null,
      userName: dto.userName ?? null,
      userId: dto.userId ?? null,
    });

    return this.engineClient.saveOnlyResult({
      resultId: dto.resultId,
      sessionId: dto.sessionId,
      windowIndex: dto.windowIndex,
      startedAt: dto.startedAt,
      at: dto.at,
      source: dto.source,
      cause: dto.cause ?? null,
      partial: dto.partial,
      faceFrames: dto.faceFrames,
      framesInWindow: dto.framesInWindow,
      label: dto.label,
      classIndex: dto.classIndex,
      confidence: dto.confidence,
      probs: dto.probs,
      classNames: dto.classNames,
      timingMs: dto.timingMs ?? null,
    });
  }

  async analyzeOnlyLandmarks(dto: OnlyLandmarksDto): Promise<unknown> {
    this.sessionContextCache.set(dto.sessionId, {
      meetingId: dto.meetingId ?? null,
      userEmail: dto.userEmail ?? null,
      userName: dto.userName ?? null,
      userId: dto.userId ?? null,
    });

    return this.engineClient.analyzeOnlyLandmarks({
      sessionId: dto.sessionId,
      windowIndex: dto.windowIndex,
      startedAt: dto.startedAt,
      endedAt: dto.endedAt,
      partial: dto.partial,
      framesFilled: dto.framesFilled,
      frameIntervalMs: dto.frameIntervalMs,
      faceDetected: dto.faceDetected,
      landmarks: dto.landmarks,
      landmarkIndices: dto.landmarkIndices,
      landmarkCount: dto.landmarkCount,
      reason: dto.reason ?? null,
    });
  }

  async analyzeVideo(video: EngineUpload, meta: Record<string, unknown>): Promise<unknown> {
    const cleanMeta = { ...meta };
    delete cleanMeta.meetingId;
    delete cleanMeta.userEmail;
    delete cleanMeta.userName;
    delete cleanMeta.userId;
    return this.engineClient.analyzeVideo(video, cleanMeta);
  }

  async analyzeVideoLandmarks(
    video: EngineUpload,
    landmarks: EngineUpload,
    meta: Record<string, unknown>,
  ): Promise<unknown> {
    const cleanMeta = { ...meta };
    delete cleanMeta.meetingId;
    delete cleanMeta.userEmail;
    delete cleanMeta.userName;
    delete cleanMeta.userId;
    return this.engineClient.analyzeVideoLandmarks(video, landmarks, cleanMeta);
  }

  async flushSession(sessionId: string): Promise<MeetEngagementResultDto[]> {
    const [meetSession, flushed] = await Promise.all([
      this.meetSessionRepository.findSession(sessionId),
      this.engineClient.flushSession(sessionId),
    ]);
    const context: SessionContext = meetSession ??
      this.sessionContextCache.get(sessionId) ?? {
        meetingId: null,
        userEmail: null,
        userName: null,
        userId: null,
      };
    return flushed.map((r) => this.enrichWindowResult(r, context));
  }

  async getSessionReport(sessionId: string): Promise<MeetSessionReport> {
    const [meetSession, engineReport] = await Promise.all([
      this.meetSessionRepository.findSession(sessionId),
      this.engineClient.getSessionReport(sessionId),
    ]);

    const context: SessionContext = meetSession ??
      this.sessionContextCache.get(sessionId) ?? {
        meetingId: null,
        userEmail: null,
        userName: null,
        userId: null,
      };

    const mergedSession: MeetSession | null = meetSession
      ? {
          ...meetSession,
          ...(engineReport.session
            ? {
                windowsStored: engineReport.session.windowsStored,
                windowsInferred: engineReport.session.windowsInferred,
                avgEngagementScore: engineReport.session.avgEngagementScore,
                dominantLabel: engineReport.session.dominantLabel,
              }
            : {}),
        }
      : null;

    return {
      session: mergedSession,
      records: engineReport.records.map((r) => this.enrichWindowResult(r, context)),
    };
  }

  async listUserSessions(userEmail: string): Promise<MeetSession[]> {
    return this.meetSessionRepository.findSessionsByUserEmail(
      userEmail,
      MeetEngagementService.MAX_LISTED_SESSIONS,
    );
  }

  async getUserSessionReport(
    sessionId: string,
    userEmail: string,
  ): Promise<MeetSessionReport | null> {
    const report = await this.getSessionReport(sessionId);
    const owner = report.session?.userEmail?.toLowerCase();
    return owner && owner === userEmail.toLowerCase() ? report : null;
  }

  private enrichWindowResult(
    record: EngineWindowResult,
    context: SessionContext,
  ): MeetEngagementResultDto {
    return {
      id: record.id,
      sessionId: record.sessionId,
      meetingId: context.meetingId,
      userEmail: context.userEmail,
      userName: context.userName,
      windowIndex: record.windowIndex,
      engagementScore: record.engagementScore,
      engagementLabel: record.engagementLabel,
      status: record.status,
      skipReason: record.skipReason,
      framesFilled: record.framesFilled,
      faceFrames: record.faceFrames,
      partial: record.partial,
      startTime: record.startTime,
      endTime: record.endTime,
      ...(record.createdAt ? { createdAt: record.createdAt } : {}),
    };
  }
}
