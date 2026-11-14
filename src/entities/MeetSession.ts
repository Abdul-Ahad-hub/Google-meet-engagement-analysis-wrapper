import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Google Meet session record owned by a signed-in Google user.
 * Links the capture `sessionId` (analyzed by Engagement-Analysis-System)
 * to Google Meet metadata (`meetingId`, `role`) and Google user identity
 * (`userEmail`, `userName`, `userId`).
 */
@Entity('meet_sessions')
export class MeetSession {
  /** Same UUID stamped on every window of the recording. */
  @PrimaryColumn('uuid')
  sessionId!: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  meetingId!: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  userEmail!: string | null;

  @Column({ type: 'varchar', nullable: true })
  userName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  role!: string | null;

  @Column({ type: 'varchar', nullable: true })
  endReason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamptz' })
  savedAt!: Date;

  @Column({ type: 'int', default: 0 })
  framesCaptured!: number;

  @Column({ type: 'int', default: 0 })
  framesWithFace!: number;

  @Column({ type: 'int', default: 0 })
  framesCenterCrop!: number;

  @Column({ type: 'float', default: 0 })
  avgFrameMs!: number;

  @Column({ type: 'float', default: 0 })
  maxFrameMs!: number;

  @Column({ type: 'int', default: 0 })
  windowsSent!: number;

  @Column({ type: 'int', default: 0 })
  windowsUnsent!: number;

  @Column({ type: 'varchar', nullable: true })
  mode!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  routing!: Record<string, unknown> | null;

  /** Windows stored in the core engine for this session. */
  @Column({ type: 'int', default: 0 })
  windowsStored!: number;

  /** Windows where the model actually ran (status = inferred). */
  @Column({ type: 'int', default: 0 })
  windowsInferred!: number;

  /** Mean engagementScore over inferred windows; null if none. */
  @Column({ type: 'float', nullable: true })
  avgEngagementScore!: number | null;

  /** Most frequent label over inferred windows; null if none. */
  @Column({ type: 'varchar', nullable: true })
  dominantLabel!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
