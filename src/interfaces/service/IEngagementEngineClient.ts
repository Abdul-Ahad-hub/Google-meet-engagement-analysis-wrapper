import { FrameItemDto, WindowTimingDto } from '../../dtos/MeetFrameDto';

/**
 * Pure domain-agnostic frame payload sent to the Engagement-Analysis-System.
 * Contains zero Google Meet or user account fields.
 */
export interface EngineFramePayload {
  sessionId: string;
  windowIndex: number;
  startedAt: string;
  endedAt: string;
  partial: boolean;
  framesFilled: number;
  frameIntervalMs: number;
  faceDetected: boolean[];
  timing: WindowTimingDto;
  landmarks: number[][][];
  frames: FrameItemDto[];
  landmarkIndices: number[];
  landmarkCount: number;
}

export interface EngineSessionSummaryPayload {
  sessionId: string;
  savedAt: string;
  startedAt: string | null;
  endReason: string | null;
  framesCaptured: number;
  framesWithFace: number;
  framesCenterCrop: number;
  avgFrameMs: number;
  maxFrameMs: number;
  windowsSent: number;
  windowsUnsent: number;
  routing?: Record<string, unknown> | null;
  mode?: string | null;
}

export interface EngineOnlyResultPayload {
  resultId: string;
  sessionId: string;
  windowIndex: number;
  startedAt: string;
  at: string;
  source: string;
  cause: string | null;
  partial: boolean;
  faceFrames: number;
  framesInWindow: number;
  label: string;
  classIndex: number;
  confidence: number;
  probs: Record<string, number>;
  classNames: string[];
  timingMs: Record<string, number> | null;
}

export interface EngineOnlyLandmarksPayload {
  sessionId: string;
  windowIndex: number;
  startedAt: string;
  endedAt: string;
  partial: boolean;
  framesFilled: number;
  frameIntervalMs: number;
  faceDetected: boolean[];
  landmarks: number[][][];
  landmarkIndices: number[];
  landmarkCount: number;
  reason: string | null;
}

export interface EngineWindowResult {
  id: string;
  sessionId: string;
  windowIndex: number;
  engagementScore: number | null;
  engagementLabel: string;
  status: 'inferred' | 'skipped' | 'pending' | 'failed';
  skipReason: string | null;
  framesFilled: number;
  faceFrames: number;
  partial: boolean;
  startTime: string;
  endTime: string;
  createdAt?: string;
}

export interface EngineWindowAnalysisResponse {
  ok: true;
  duplicate: boolean;
  aiJobId?: string;
  result: EngineWindowResult;
}

export interface EngineSessionSummary {
  sessionId: string;
  endReason: string | null;
  startedAt: string | null;
  savedAt: string;
  framesCaptured: number;
  framesWithFace: number;
  framesCenterCrop: number;
  avgFrameMs: number;
  maxFrameMs: number;
  windowsSent: number;
  windowsUnsent: number;
  windowsStored: number;
  windowsInferred: number;
  avgEngagementScore: number | null;
  dominantLabel: string | null;
}

export interface EngineSessionReport {
  session: EngineSessionSummary | null;
  records: EngineWindowResult[];
}

export interface EngineUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export interface IEngagementEngineClient {
  analyzeFrame(payload: EngineFramePayload): Promise<EngineWindowAnalysisResponse>;
  saveSession(payload: EngineSessionSummaryPayload): Promise<{ ok: boolean; session: EngineSessionSummary }>;
  getSessionReport(sessionId: string): Promise<EngineSessionReport>;
  flushSession(sessionId: string): Promise<EngineWindowResult[]>;
  saveOnlyResult(payload: EngineOnlyResultPayload): Promise<unknown>;
  analyzeOnlyLandmarks(payload: EngineOnlyLandmarksPayload): Promise<unknown>;
  analyzeVideo(video: EngineUpload, meta: Record<string, unknown>): Promise<unknown>;
  analyzeVideoLandmarks(
    video: EngineUpload,
    landmarks: EngineUpload,
    meta: Record<string, unknown>,
  ): Promise<unknown>;
}
