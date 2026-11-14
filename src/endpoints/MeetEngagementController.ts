import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { MEET_ENGAGEMENT_SERVICE } from '../common/constants/injection-tokens';
import { MeetFrameDto } from '../dtos/MeetFrameDto';
import { MeetSessionSummaryDto } from '../dtos/MeetSessionSummaryDto';
import { MeetEngagementResultDto } from '../dtos/MeetEngagementResultDto';
import { OnlyResultDto } from '../dtos/OnlyResultDto';
import { OnlyLandmarksDto } from '../dtos/OnlyLandmarksDto';
import type { IMeetEngagementService } from '../interfaces/service/IMeetEngagementService';
import type { EngineUpload } from '../interfaces/service/IEngagementEngineClient';
import { AuthenticatedUser, GoogleAuthGuard } from '../common/guards/GoogleAuthGuard';

/**
 * Google Meet ingestion controller.
 * Authenticates the Google bearer token (when supplied by the extension),
 * stamps verified user identity onto the request, and delegates to
 * MeetEngagementService (which strips Meet/user fields before calling the
 * domain-agnostic Engagement-Analysis-System).
 */
@Controller('engagement')
@UseGuards(GoogleAuthGuard)
export class MeetEngagementController {
  constructor(
    @Inject(MEET_ENGAGEMENT_SERVICE)
    private readonly meetEngagementService: IMeetEngagementService,
  ) {}

  @Post('frames')
  @HttpCode(HttpStatus.CREATED)
  async analyze(
    @Body() dto: MeetFrameDto,
    @Req() req: { user?: AuthenticatedUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    this.applyVerifiedUser(dto, req.user);
    const result = await this.meetEngagementService.analyzeFrame(dto);
    if (result.result.status === 'pending') response.status(HttpStatus.ACCEPTED);
    return result;
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async saveSession(
    @Body() dto: MeetSessionSummaryDto,
    @Req() req: { user?: AuthenticatedUser },
  ) {
    this.applyVerifiedUser(dto, req.user);
    const session = await this.meetEngagementService.saveSession(dto);
    return { ok: true, session };
  }

  @Post('onlyresult')
  @HttpCode(HttpStatus.OK)
  async saveOnlyResult(@Body() dto: OnlyResultDto, @Req() req: { user?: AuthenticatedUser }) {
    this.applyVerifiedUser(dto, req.user);
    return this.meetEngagementService.saveOnlyResult(dto);
  }

  @Post('onlylandmarks')
  @HttpCode(HttpStatus.OK)
  async analyzeOnlyLandmarks(
    @Body() dto: OnlyLandmarksDto,
    @Req() req: { user?: AuthenticatedUser },
  ) {
    this.applyVerifiedUser(dto, req.user);
    return this.meetEngagementService.analyzeOnlyLandmarks(dto);
  }

  @Post('video')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'video', maxCount: 1 }], {
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  async analyzeVideo(
    @UploadedFiles() files: { video?: EngineUpload[] } | undefined,
    @Body('meta') metaJson: string | undefined,
  ) {
    const video = files?.video?.[0];
    if (!video) throw new BadRequestException('A video file is required in the "video" field.');
    return this.meetEngagementService.analyzeVideo(video, this.parseMeta(metaJson));
  }

  @Post('video-landmarks')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'landmarks', maxCount: 1 },
      ],
      { limits: { fileSize: 200 * 1024 * 1024, files: 2 } },
    ),
  )
  async analyzeVideoLandmarks(
    @UploadedFiles() files: { video?: EngineUpload[]; landmarks?: EngineUpload[] } | undefined,
    @Body('meta') metaJson: string | undefined,
  ) {
    const video = files?.video?.[0];
    const landmarks = files?.landmarks?.[0];
    if (!video) throw new BadRequestException('A video file is required in the "video" field.');
    if (!landmarks || !Buffer.isBuffer(landmarks.buffer)) {
      throw new BadRequestException('A NumPy landmarks file is required in the "landmarks" field.');
    }
    return this.meetEngagementService.analyzeVideoLandmarks(
      video,
      landmarks,
      this.parseMeta(metaJson),
    );
  }

  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string) {
    return this.meetEngagementService.getSessionReport(sessionId);
  }

  @Post('sessions/:sessionId/flush')
  @HttpCode(HttpStatus.OK)
  async flushSession(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ): Promise<MeetEngagementResultDto[]> {
    return this.meetEngagementService.flushSession(sessionId);
  }

  private applyVerifiedUser(
    dto: { userEmail: string | null; userId: string | null },
    user?: AuthenticatedUser,
  ) {
    if (!user) return;
    if (user.email) dto.userEmail = user.email;
    if (user.sub) dto.userId = user.sub;
  }

  private parseMeta(raw?: string): Record<string, unknown> {
    if (!raw?.trim()) return {};
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException('meta must be a valid JSON object.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException('meta must be a valid JSON object.');
    }
    return parsed as Record<string, unknown>;
  }
}
