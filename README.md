# Google Meet Engagement Analysis Wrapper

Application-layer backend (BFF) for the **Google Meet Recorder Chrome Extension** and the **Google Meet Engagement Dashboard**.

## Architectural Role

```text
Meet Extension ──┐
                 ├──► Google-meet-engagement-analysis-wrapper (Google Auth, Users, Meetings, Dashboard API)
Meet Dashboard ──┘             │
                               ▼ (Pure sessionId + frames + landmarks)
                      Engagement-Analysis-System (Domain-agnostic Core Engine)
                               │
                               ▼
                      AI Model Server
```

This service owns all Google Meet and user-specific concerns:
- **Google OAuth 2.0 Verification** (`GoogleAuthGuard`)
- **Meeting & User Context** (`meetingId`, `userEmail`, `userName`, `userId`, `role`)
- **Owner-Scoped Dashboard Endpoints** (`GET /engagement/me/sessions`, `GET /engagement/me/sessions/:sessionId`)

All domain-level frame validation, Redis buffering, and AI model inference are delegated over HTTP to the domain-agnostic **Engagement-Analysis-System** (`ENGAGEMENT_ENGINE_URL`).
