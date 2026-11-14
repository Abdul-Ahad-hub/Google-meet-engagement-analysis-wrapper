/**
 * Enriched window result returned to the Google Meet extension and
 * Analytics Dashboard, combining the core engine's engagement result
 * with the Google Meet session context (meetingId, userEmail, userName).
 */
export class MeetEngagementResultDto {
  id!: string;
  sessionId!: string;
  meetingId!: string | null;
  userEmail!: string | null;
  userName!: string | null;
  windowIndex!: number;
  engagementScore!: number | null;
  engagementLabel!: string;
  status!: 'inferred' | 'skipped' | 'pending' | 'failed';
  skipReason!: string | null;
  framesFilled!: number;
  faceFrames!: number;
  partial!: boolean;
  startTime!: string;
  endTime!: string;
  createdAt?: string;
}
