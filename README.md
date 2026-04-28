# CrisisSync

CrisisSync is a real-time, AI-powered crisis response platform for hotels. It helps guests report emergencies in seconds, automatically classifies incident severity using Gemini, broadcasts live alerts to operators, and tracks resolution through a command-style dashboard.

## What It Solves

Hotels often lose critical time during emergencies due to fragmented communication, delayed triage, and unclear role ownership.

CrisisSync provides:
- Rapid guest incident intake (panic buttons + text + voice context)
- AI-assisted crisis classification and actionable guidance
- Live operator visibility across incidents and statuses
- Structured response workflow from report to resolution
- Auditable incident records for post-incident review

## Core Capabilities

- Real-time Incident Reporting:
  Guests or staff can submit incidents with optional room/location and geo-coordinates.
- AI Crisis Classification:
  Incidents are classified into `fire | medical | security | structural | power | other` with severity scoring and role-specific instructions.
- Live Alerting Layer:
  Active incidents are pushed to Realtime Database for immediate dashboard visibility.
- Operator Response Workflow:
  Structured lifecycle: `reported -> acknowledged -> responding -> resolved`.
- Incident Command Tools:
  SITREP updates, guest broadcasts, tactical objective tracking, evidence upload hooks.
- Map-Based Operations:
  Active incidents display on live map using real coordinates (no synthetic/fake markers).

## Special Features

- Role-aware tactical instructions (`front_desk`, `security`, `housekeeping`, `management`)
- Guest safety instruction generation in structured AI output
- Fallback local classification when AI latency/failure occurs
- Live telemetry-style command dashboard
- Production-style separation of persistent and live incident channels

## Google Technologies Used

- Next.js App Router frontend (deployed on Cloud Run)
- FastAPI backend (Cloud Run)
- Gemini API / Vertex AI integration for incident intelligence
- Google Maps JavaScript API for tactical incident visualization
- Firebase platform services for auth/data/storage

## Google/Firebase Services Integrated

- Cloud Run:
  - `crisis-sync-web` (frontend)
  - `crisis-sync-backend` (backend)
- Firebase Authentication
- Firestore (persistent incident records)
- Firebase Realtime Database (live incident broadcast stream)
- Firebase Storage (incident media evidence)
- Gemini API / Vertex AI model serving path

## High-Level Architecture

1. User submits incident from web app.
2. Frontend calls `/api/classify`.
3. API route forwards to FastAPI `/classify` for AI classification.
4. Classification + normalized response are returned.
5. Incident is written to:
   - Firestore for persistence/history
   - Realtime DB for live operator feed
6. Operator dashboards update in near real-time.
7. Incident moves through status pipeline until resolved.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: FastAPI, Python, Gemini/Vertex integration
- Data: Firestore + Realtime Database + Storage
- Maps: Google Maps JS API

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.11+
- Firebase project configured
- Google Maps API key
- Gemini API key and/or Vertex AI project access

### Environment Variables

Create `.env.local` in repo root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

BACKEND_URL=http://localhost:8000
GEMINI_API_KEY=
GOOGLE_CLOUD_PROJECT=
GOOGLE_CLOUD_LOCATION=us-central1
USE_VERTEX_AI=false
```

### Run Backend

```bash
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Run Frontend

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Deployment (Cloud Run)

Frontend and backend are independently deployed to Cloud Run.

Current service names:
- `crisis-sync-web`
- `crisis-sync-backend`

Typical deploy flow:
1. Build and validate locally.
2. Commit and push to `main`.
3. Deploy service via `gcloud run deploy` with required env vars.
4. Verify health endpoints and primary user flows.

## Production-Grade Characteristics

- Strongly typed frontend/backend contracts
- Structured AI JSON output normalization
- Timeout and fallback classification path
- Explicit incident status lifecycle
- Separation of live stream and historical records
- Tactical audit/event logging hooks
- Command-center UX optimized for high-pressure response workflows

## Recommended Operational Checks

- Verify report -> classify -> dashboard visibility
- Verify map marker appears when coordinates are present
- Verify status transitions and SITREP logging
- Verify guest broadcast writes and operator telemetry updates
- Verify incident resolution removes live alert and keeps history

## Project Status

CrisisSync is an actively iterated crisis operations system designed for production-style workflows in hospitality emergency response.
