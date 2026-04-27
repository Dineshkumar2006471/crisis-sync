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
