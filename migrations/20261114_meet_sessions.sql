-- Creates the meet_sessions table for the Google Meet wrapper service.
-- Note: DatabaseModule sets synchronize: true for MeetSession, so this table
-- is created automatically on startup; this script is provided for manual/CI migrations.

CREATE TABLE IF NOT EXISTS meet_sessions (
  "sessionId" uuid PRIMARY KEY,
  "meetingId" varchar NULL,
  "userEmail" varchar NULL,
  "userName" varchar NULL,
  "userId" varchar NULL,
  "role" varchar NULL,
  "endReason" varchar NULL,
  "startedAt" timestamptz NULL,
  "savedAt" timestamptz NOT NULL,
  "framesCaptured" int NOT NULL DEFAULT 0,
  "framesWithFace" int NOT NULL DEFAULT 0,
  "framesCenterCrop" int NOT NULL DEFAULT 0,
  "avgFrameMs" double precision NOT NULL DEFAULT 0,
  "maxFrameMs" double precision NOT NULL DEFAULT 0,
  "windowsSent" int NOT NULL DEFAULT 0,
  "windowsUnsent" int NOT NULL DEFAULT 0,
  "mode" varchar NULL,
  "routing" jsonb NULL,
  "windowsStored" int NOT NULL DEFAULT 0,
  "windowsInferred" int NOT NULL DEFAULT 0,
  "avgEngagementScore" double precision NULL,
  "dominantLabel" varchar NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meet_sessions_user_email ON meet_sessions ("userEmail");
CREATE INDEX IF NOT EXISTS idx_meet_sessions_meeting_id ON meet_sessions ("meetingId");
