# CrisisSync — Rapid Crisis Response Platform
### Google Solution Challenge 2026 | Theme: Rapid Crisis Response | Deadline: April 25, 2026

---

## PROBLEM STATEMENT

**The exact problem:**
India has a well-documented, recurring fatal pattern: hotel fires kill people not because fire breaks out, but because communication fails in the first 4 minutes. Staff don't know where guests are. Guests don't know what to do. Emergency services get called late or not at all.

Real evidence:
- 2019: Arpit Palace Hotel, Karol Bagh, Delhi — 17 dead. Fire services received the first call at 4:43 AM. The fire started between 3:00–3:30 AM. That's over 1 hour of silence. Staff were untrained to use fire-fighting equipment. Windows had automatic locks no one knew how to open.
- April 2025: Rituraj Hotel, Kolkata — 14 dead including 2 children. Fire broke out at night. No coordinated evacuation.

The pattern is always the same: detection delay + staff confusion + no guest-to-responder communication bridge = preventable deaths.

**Who faces this problem:**
- 47,000+ registered hotels in India (many budget/mid-range with zero crisis tech)
- ~1.5 billion nights of hotel stays happen in India yearly
- Staff turnover in Indian hospitality: ~50% per year. Retraining is inconsistent.
- Budget hotels (3-star and below) have zero digital crisis infrastructure

**Why it persists:**
Current "solutions" are physical: fire alarms, printed evacuation maps on doors, walkie-talkies. None of these coordinate in real-time. None use AI to classify severity, suggest response, or communicate multilingual instructions to guests from 40+ countries.

**The gap no one has filled:**
There is no lightweight, installable, real-time AI-powered crisis coordination layer for mid-tier Indian hospitality. The market is entirely untouched by software.

---

## THE SOLUTION: CrisisSync

A real-time, AI-powered crisis coordination system for hospitality venues. It bridges the gap between a guest sensing danger, staff responding, and emergency services being dispatched — in under 60 seconds.

**Core flow:**
1. Guest or staff reports a crisis (text, voice, or one-tap panic button) via web app
2. Gemini AI classifies the crisis type, severity level, and required response within 2 seconds
3. Firebase Realtime Database broadcasts the alert instantly to all staff dashboards
4. Staff receive role-specific instructions (front desk: call 112 + announce PA, security: go to floor X, housekeeping: assist guests in rooms 301–320)
5. Google Maps shows the incident location pinpointed inside the property
6. All communications are multilingual — Gemini handles Hindi, Tamil, Bengali, English, and 5 more Indian languages
7. Admin sees a live incident timeline, response log, and auto-generated incident report

**Why AI is not decoration here:**
Without Gemini, you'd need human judgment to classify "smoke on 3rd floor" vs "guest having heart attack" vs "bomb threat" vs "power failure". Gemini does this in 2 seconds across 10 languages. That's not a feature — that's the entire product value.

---

## TECH STACK

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Your stack. Fast, deployable. |
| Styling | Tailwind CSS | Rapid UI + responsive |
| Mobile/Guest | Progressive Web App (PWA) | Works on any phone without app install |
| Realtime DB | Firebase Realtime Database | Sub-100ms sync. Industry standard for alerts. |
| Auth | Firebase Auth | Zero-config. Guest QR login + staff email login |
| AI Brain | Gemini API (gemini-1.5-flash) | Crisis classification, multilingual NLP, instructions |
| Functions | Cloud Functions for Firebase | Escalation logic, auto-notification triggers |
| Storage | Firebase Storage | Evidence photos from incident reports |
| Maps | Google Maps JavaScript API | Indoor/outdoor incident location pinning |
| Backend API | FastAPI (Cloud Run) | For Gemini calls needing server-side handling |
| Hosting | Firebase Hosting + Cloud Run | Both layers deployed |
| Analytics | Firestore | Incident history, audit logs, reports |

---

## PROJECT STRUCTURE

```
crisisync/
├── app/                          # Next.js 15 App Router
│   ├── (guest)/
│   │   ├── report/               # Guest crisis reporting UI (PWA-accessible)
│   │   └── alert/[id]/           # Guest receives evacuation/safety instructions
│   ├── (staff)/
│   │   ├── dashboard/            # Staff real-time incident feed
│   │   ├── incident/[id]/        # Individual incident detail + response log
│   │   └── admin/                # Admin — full incident history, reports
│   ├── api/
│   │   └── classify/             # Next.js route that calls FastAPI backend
│   └── layout.tsx
│
├── backend/                      # FastAPI — Cloud Run container
│   ├── main.py                   # FastAPI app entry point
│   ├── routers/
│   │   ├── classify.py           # Gemini crisis classification endpoint
│   │   ├── notify.py             # Cloud Function trigger endpoint
│   │   └── report.py             # Incident report generation
│   ├── services/
│   │   ├── gemini_service.py     # Gemini API wrapper
│   │   └── firebase_service.py   # Firestore + Realtime DB writes
│   ├── Dockerfile
│   └── requirements.txt
│
├── firebase/
│   ├── firestore.rules
│   ├── firebase.json
│   └── functions/
│       ├── index.ts              # Cloud Functions — escalation + notification
│       └── package.json
│
├── public/
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker for offline fallback
│
├── lib/
│   ├── firebase.ts               # Firebase client init
│   ├── gemini.ts                 # Client-safe Gemini wrapper
│   └── types.ts                  # Incident, CrisisType, SeverityLevel types
│
├── components/
│   ├── AlertBanner.tsx           # Live crisis alert broadcast bar
│   ├── IncidentCard.tsx          # Staff feed incident card
│   ├── CrisisMap.tsx             # Google Maps incident pin component
│   ├── ReportForm.tsx            # Guest/staff crisis report form
│   └── RoleBadge.tsx             # Staff role indicator
│
├── .env.local                    # API keys (NEVER commit)
├── .env.example                  # Template for judges
└── README.md
```

---

## CLAUDE CODE SETUP

### Step 1: Install Claude Code
```bash
npm install -g @anthropic-ai/claude-code
claude
```

### Step 2: CLAUDE.md (place in project root)
```markdown
# CrisisSync — Claude Code Instructions

## Project
Real-time AI crisis response system for Indian hotels.
Stack: Next.js 15, Tailwind CSS, Firebase, FastAPI, Gemini API, Google Maps.

## Key Rules
- Use App Router (not Pages Router). All routes go in /app.
- Firebase Realtime Database for live alerts. Firestore for persistent records.
- All Gemini calls go through the FastAPI backend (/backend). Never call Gemini directly from client.
- Tailwind only. No CSS modules. No styled-components.
- TypeScript everywhere. No `any` types.
- Every component is a named export. No default exports except page.tsx files.

## Crisis Classification Schema
CrisisType: "fire" | "medical" | "security" | "structural" | "power" | "other"
SeverityLevel: "critical" | "high" | "medium" | "low"
ResponseStatus: "reported" | "acknowledged" | "responding" | "resolved"

## Firebase Collections
- /incidents/{id} — Firestore (persistent)
- /live_incidents/{id} — Realtime DB (active alerts only, deleted on resolve)
- /staff/{uid} — Staff profiles + role
- /hotels/{id} — Property config, floor map URL, contact list

## Environment Variables
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
BACKEND_URL (Cloud Run URL)
GEMINI_API_KEY (backend only — never expose to client)

## Gemini Prompt Pattern
Always use structured JSON output from Gemini.
System prompt: "You are a crisis response AI. Classify hotel emergencies and return ONLY valid JSON."
```

### Step 3: MCP Servers for Claude Code (`.vscode/mcp.json`)
```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"],
      "type": "stdio"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "type": "stdio"
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "type": "stdio"
    }
  }
}
```

**MCP usage in this project:**
- `context7` — Pull Next.js 15, Firebase SDK, and Gemini SDK latest docs into Claude's context during build
- `filesystem` — Claude Code reads/writes project files directly
- `browser` — Claude Code can test the live deployed URL for screenshot validation

---

## PHASE 1 BUILD PLAN (10 days to April 25)

### Days 1–2: Firebase + Auth Foundation
- Firebase project setup (Spark plan — free)
- Enable: Realtime DB, Firestore, Auth, Hosting, Storage
- Create Firestore collections: incidents, staff, hotels
- Firebase Auth: email/password for staff, anonymous for guests (via QR scan)
- Write firestore.rules: staff can read/write incidents, guests can only create

### Days 3–4: Gemini Classification Backend
- FastAPI app in `/backend`
- POST `/classify` endpoint:
  - Takes: raw crisis text, language, hotel_id
  - Calls Gemini 1.5 Flash with structured prompt
  - Returns: crisis_type, severity, response_instructions (per role), translated_guest_message
- Gemini prompt for classification:
```python
CLASSIFY_PROMPT = """
You are a hotel crisis response AI. Analyze the following incident report and return ONLY a valid JSON object.

Incident: {incident_text}
Language detected: {language}
Hotel: {hotel_name}

Return this exact JSON structure:
{{
  "crisis_type": "fire|medical|security|structural|power|other",
  "severity": "critical|high|medium|low",
  "confidence": 0.0-1.0,
  "summary_english": "one sentence summary",
  "guest_instruction": "what guests should do RIGHT NOW, in {language}",
  "staff_instructions": {{
    "front_desk": "specific action",
    "security": "specific action",
    "housekeeping": "specific action",
    "management": "specific action"
  }},
  "call_emergency_services": true|false,
  "emergency_number": "112"
}}
"""
```
- Containerize with Docker, deploy to Cloud Run

### Days 5–6: Realtime Alert Pipeline
- Cloud Function triggered on Firestore write to `/incidents`
- Function writes to Realtime DB `/live_incidents/{id}` for instant broadcast
- Staff dashboard subscribes to Realtime DB with `onValue` listener
- Alert banner auto-appears when new critical/high incident comes in

### Days 7–8: Frontend Build
- Guest PWA report page: text input OR voice (Web Speech API), one-tap panic buttons
- Staff dashboard: live feed from Realtime DB, incident cards, role-specific instruction panel
- Google Maps: embed with custom marker at reported floor/location
- Admin panel: Firestore query of all past incidents, filter by type/severity

### Days 9–10: Polish + Deploy
- Deploy Next.js to Firebase Hosting: `firebase deploy`
- Deploy FastAPI to Cloud Run: `gcloud run deploy`
- Test from incognito on mobile — simulate guest flow
- Record demo video
- Write README, prepare deck

---

## GEMINI INTEGRATION CODE

```python
# backend/services/gemini_service.py
import google.generativeai as genai
import json
import os

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-1.5-flash")

async def classify_crisis(incident_text: str, language: str, hotel_name: str) -> dict:
    prompt = CLASSIFY_PROMPT.format(
        incident_text=incident_text,
        language=language,
        hotel_name=hotel_name
    )
    response = model.generate_content(prompt)
    raw = response.text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
```

---

## FIRESTORE DATA MODEL

```typescript
// lib/types.ts
export interface Incident {
  id: string
  hotel_id: string
  reported_by: "guest" | "staff"
  reporter_uid: string
  raw_text: string
  language: string
  location_description: string      // "3rd floor, near elevator"
  floor_number?: number
  room_number?: string
  crisis_type: CrisisType
  severity: SeverityLevel
  status: ResponseStatus
  gemini_summary: string
  guest_instruction: string
  staff_instructions: StaffInstructions
  call_emergency_services: boolean
  photo_urls: string[]
  created_at: Timestamp
  updated_at: Timestamp
  resolved_at?: Timestamp
  response_log: ResponseLogEntry[]  // Array of {staff_uid, action, timestamp}
}
```

---

## DEPLOYMENT CHECKLIST

Before submitting Phase 1:

- [ ] Live URL works from incognito on mobile
- [ ] Guest can report a crisis in under 30 seconds
- [ ] Gemini responds with classification in under 3 seconds
- [ ] Staff dashboard shows alert in real-time (test with two browser tabs)
- [ ] Maps shows incident location pin
- [ ] GitHub repo is public with clean README
- [ ] `.env.example` file present (no real keys committed)
- [ ] Demo video is 2–3 minutes, shows full guest → Gemini → staff flow
- [ ] Deck has: Problem (with Arpit Palace / Rituraj Hotel data) → Solution → Architecture → Demo → Impact → Stack → Next Steps

---

## IMPACT METRICS (for pitch)

- 47,000+ registered hotels in India addressable
- Average hotel: 80 rooms, 4 staff on shift, ~120 guests
- Target: reduce crisis response initiation time from 60+ minutes (Arpit Palace case) to under 60 seconds
- Secondary impact: multilingual support means international guests (40+ nationalities in Indian hotels) can report and receive instructions in their language for the first time
- Phase 2 potential: stadium events, hospitals, shopping malls — same communication breakdown exists everywhere

---

## WHY THIS WINS TOP 100

1. **It is not theoretical.** Two major Indian hotel fires (2019, 2025) with documented death counts prove the exact problem this solves.
2. **AI is the product, not a feature.** Without Gemini, this is just a walkie-talkie app. Gemini's multilingual classification is what makes this actually work for Indian hospitality.
3. **Google stack is deep, not decorative.** Firebase Realtime DB + Cloud Functions + Gemini + Maps + Cloud Run — every Google product used because it's the right tool, not for show.
4. **It's buildable in 10 days.** Scope is tight and clear. No scope creep.
5. **Real user, real problem, real context.** Judges can Google "India hotel fire" and the first result validates your problem statement.
