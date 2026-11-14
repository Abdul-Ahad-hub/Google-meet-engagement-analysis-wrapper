import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EngineFramePayload,
  EngineOnlyLandmarksPayload,
  EngineOnlyResultPayload,
  EngineSessionReport,
  EngineSessionSummary,
  EngineSessionSummaryPayload,
  EngineUpload,
  EngineWindowAnalysisResponse,
  EngineWindowResult,
  IEngagementEngineClient,
} from '../interfaces/service/IEngagementEngineClient';
import { EngineCommunicationException } from '../common/exceptions/Exceptions';

/**
 * Concrete HTTP adapter for communicating with the domain-agnostic
 * Engagement-Analysis-System microservice.
 */
@Injectable()
export class HttpEngagementEngineClient implements IEngagementEngineClient {
  private readonly logger = new Logger(HttpEngagementEngineClient.name);
  private readonly engineBaseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.engineBaseUrl = (
      this.configService.get<string>('ENGAGEMENT_ENGINE_URL') ||
      'https://engagement-analysis-system.vercel.app'
    )
      .trim()
      .replace(/\/+$/, '');
    this.timeoutMs = Number(
      this.configService.get<string>('ENGAGEMENT_ENGINE_TIMEOUT_MS') ?? 35000,
    );
    this.logger.log(
      `Engagement Engine configured: ${this.engineBaseUrl} (timeout ${this.timeoutMs}ms)`,
    );
  }

  async analyzeFrame(payload: EngineFramePayload): Promise<EngineWindowAnalysisResponse> {
    return this.requestJson<EngineWindowAnalysisResponse>('/engagement/frames', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async saveSession(
    payload: EngineSessionSummaryPayload,
  ): Promise<{ ok: boolean; session: EngineSessionSummary }> {
    return this.requestJson<{ ok: boolean; session: EngineSessionSummary }>(
      '/engagement/sessions',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  }

  async getSessionReport(sessionId: string): Promise<EngineSessionReport> {
    return this.requestJson<EngineSessionReport>(`/engagement/sessions/${sessionId}`, {
      method: 'GET',
    });
  }

  async flushSession(sessionId: string): Promise<EngineWindowResult[]> {
    return this.requestJson<EngineWindowResult[]>(`/engagement/sessions/${sessionId}/flush`, {
      method: 'POST',
    });
  }

  async saveOnlyResult(payload: EngineOnlyResultPayload): Promise<unknown> {
    return this.requestJson<unknown>('/engagement/onlyresult', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async analyzeOnlyLandmarks(payload: EngineOnlyLandmarksPayload): Promise<unknown> {
    return this.requestJson<unknown>('/engagement/onlylandmarks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async analyzeVideo(video: EngineUpload, meta: Record<string, unknown>): Promise<unknown> {
    const formData = new FormData();
    formData.append(
      'video',
      new Blob([new Uint8Array(video.buffer)], { type: video.mimetype || 'video/mp4' }),
      video.originalname || 'video.mp4',
    );
    formData.append('meta', JSON.stringify(meta));
    return this.requestMultipart<unknown>('/engagement/video', formData);
  }

  async analyzeVideoLandmarks(
    video: EngineUpload,
    landmarks: EngineUpload,
    meta: Record<string, unknown>,
  ): Promise<unknown> {
    const formData = new FormData();
    formData.append(
      'video',
      new Blob([new Uint8Array(video.buffer)], { type: video.mimetype || 'video/mp4' }),
      video.originalname || 'video.mp4',
    );
    formData.append(
      'landmarks',
      new Blob([new Uint8Array(landmarks.buffer)], {
        type: landmarks.mimetype || 'application/octet-stream',
      }),
      landmarks.originalname || 'landmarks.npy',
    );
    formData.append('meta', JSON.stringify(meta));
    return this.requestMultipart<unknown>('/engagement/video-landmarks', formData);
  }

  private async requestJson<T>(
    path: string,
    init: { method: 'GET' | 'POST'; body?: string },
  ): Promise<T> {
    const url = `${this.engineBaseUrl}${path}`;
    try {
      const res = await fetch(url, {
        method: init.method,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: init.body,
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      const rawText = await res.text();
      if (!res.ok) {
        let parsedError: Record<string, unknown> = { raw: rawText.slice(0, 300) };
        try {
          parsedError = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          /* non-JSON body */
        }
        throw new EngineCommunicationException(
          { path, status: res.status, upstream: parsedError },
          res.status as HttpStatus,
        );
      }

      return JSON.parse(rawText) as T;
    } catch (err) {
      if (err instanceof EngineCommunicationException) throw err;
      const msg = (err as Error).message;
      this.logger.error(`Engine call ${init.method} ${path} failed: ${msg}`);
      throw new EngineCommunicationException({ path, cause: msg });
    }
  }

  private async requestMultipart<T>(path: string, formData: FormData): Promise<T> {
    const url = `${this.engineBaseUrl}${path}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      const rawText = await res.text();
      if (!res.ok) {
        throw new EngineCommunicationException(
          { path, status: res.status, cause: rawText.slice(0, 300) },
          res.status as HttpStatus,
        );
      }
      return JSON.parse(rawText) as T;
    } catch (err) {
      if (err instanceof EngineCommunicationException) throw err;
      const msg = (err as Error).message;
      this.logger.error(`Engine multipart call POST ${path} failed: ${msg}`);
      throw new EngineCommunicationException({ path, cause: msg });
    }
  }
}
