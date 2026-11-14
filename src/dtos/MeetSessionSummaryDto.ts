import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * Sent once by the Meet extension when the user clicks Save (or the call ends):
 * POST /engagement/sessions. Flushes buffered window results in the core engine
 * and stores the Google Meet session ownership and summary in the wrapper DB.
 */
export class MeetSessionSummaryDto {
  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @IsString()
  userName!: string | null;

  @IsOptional()
  @IsEmail()
  userEmail!: string | null;

  @IsOptional()
  @IsString()
  userId!: string | null;

  @IsOptional()
  @IsString()
  meetingId!: string | null;

  @IsOptional()
  @IsString()
  role!: string | null;

  @IsDateString()
  savedAt!: string;

  @IsOptional()
  @IsDateString()
  startedAt!: string | null;

  /** "user" (Save clicked) | "call-ended" | "tab-closed". */
  @IsOptional()
  @IsString()
  endReason!: string | null;

  @IsInt()
  @Min(0)
  framesCaptured!: number;

  @IsInt()
  @Min(0)
  framesWithFace!: number;

  @IsInt()
  @Min(0)
  framesCenterCrop!: number;

  @IsNumber()
  avgFrameMs!: number;

  @IsNumber()
  maxFrameMs!: number;

  @IsInt()
  @Min(0)
  windowsSent!: number;

  @IsInt()
  @Min(0)
  windowsUnsent!: number;

  @IsOptional()
  routing?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  mode?: string | null;
}
