# WORKFLOW.md — CrisisSync Mobile App
## Complete Screen-by-Screen Workflow | Every Button | Every Real-Time Behavior

---

## HOW TO READ THIS FILE

Every screen is documented in this format:
- What the screen IS and who sees it
- Every button, input, and element on screen
- What happens when each is tapped (exact behavior)
- What data fires in the background (Firebase / Gemini)
- Edge cases and error states

Three user types use this app:
| Role | Who | Access |
|---|---|---|
| **Guest** | Hotel guest, no account needed | Reports only, receives instructions |
| **Staff** | Front desk / Security / Housekeeping | Reports + responds to incidents |
| **Admin** | Hotel manager | Full access — all incidents, analytics, settings |

---

## SYSTEM ARCHITECTURE (Plain Language)

```
GUEST PHONE
    │
    │ taps panic button or types report
    ▼
NEXT.JS PWA (Firebase Hosting)
    │
    │ POST /api/classify
    ▼
FASTAPI BACKEND (Cloud Run)
    │
    │ sends text to Gemini 1.5 Flash
    ▼
GEMINI AI
    │
    │ returns: crisis_type, severity, staff_instructions, guest_message
    ▼
FASTAPI writes to FIRESTORE (permanent record)
    │
    ▼
CLOUD FUNCTION triggers automatically
    │
    │ writes to FIREBASE REALTIME DB (live broadcast)
    ▼
ALL STAFF PHONES (subscribed to Realtime DB)
    │
    │ onValue() listener fires — alert appears on every staff screen instantly
    ▼
STAFF ACKNOWLEDGES → updates Firestore status
    │
    ▼
ADMIN sees full timeline in analytics
```

**Key rule:** Firestore = permanent storage for all history. Realtime DB = live broadcast layer only. When an incident is resolved, it stays in Firestore but is removed from Realtime DB.

---

# PART 1 — ONBOARDING + LOGIN

---

## SCREEN 1A: SPLASH SCREEN
**Who sees it:** Everyone, first time the app opens
**Duration:** 1.8 seconds, then auto-navigates

```
┌─────────────────────┐
│                     │
│                     │
│    [Logo Mark]      │  ← CrisisSync icon (concentric circles)
│   CrisisSync        │  ← Syne 700, white
│                     │
│  ●●●  (loader)      │  ← 3 dots pulsing
│                     │
└─────────────────────┘
```

**What happens:**
- App checks `localStorage` for existing auth token
- If token exists AND is valid → navigate directly to the correct home screen (Guest Home / Staff Dashboard / Admin Dashboard)
- If no token → navigate to Screen 1B (Role Select)
- If token expired → navigate to Screen 1C (Login)

**No buttons on this screen. It's automatic.**

---

## SCREEN 1B: ROLE SELECT
**Who sees it:** First-time users only
**Purpose:** Determines which login flow to show

```
┌─────────────────────┐
│  ← (no back button) │
│                     │
│  Who are you?       │  ← Syne 600, 26px
│  Select to continue │  ← DM Sans, muted
│                     │
│ ┌─────────────────┐ │
│ │  🏨  Hotel Guest │ │  ← Card button, full width, 72px height
│ │  No login needed │ │  ← sub-label, muted
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │  👤  Hotel Staff │ │  ← Card button
│ │  Login required  │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │  🔑  Admin       │ │  ← Card button
│ │  Manager access  │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

**Button behaviors:**

**"Hotel Guest" tapped:**
- Navigates to Screen 2A (Guest Home)
- No account created. Firebase Auth: anonymous sign-in happens silently in background
- Stores anonymous uid in localStorage so the same guest's reports are linkable
- Guest never sees this happening

**"Hotel Staff" tapped:**
- Navigates to Screen 1C (Staff Login)

**"Admin" tapped:**
- Navigates to Screen 1D (Admin Login — same as staff but different Firebase role)

---

## SCREEN 1C: STAFF LOGIN
**Who sees it:** Staff and Admin selecting their role

```
┌─────────────────────┐
│ ←                   │  ← back to role select
│                     │
│  Staff Login        │  ← Syne 600, 26px
│                     │
│  [Email input]      │  ← placeholder: "your@hotel.com"
│                     │
│  [Password input]   │  ← placeholder: "Password", eye icon to toggle
│                     │
│  [Sign In]          │  ← primary button, full width, #3B82F6
│                     │
│  Forgot password?   │  ← text link, center
│                     │
│ ─────── OR ─────── │
│                     │
│  [Scan QR Badge]    │  ← ghost button — opens camera for QR staff badge
│                     │
└─────────────────────┘
```

**"Sign In" button behavior:**
1. Validates email format + password not empty. If invalid → inline error under field, red border, shake animation
2. If valid → shows loading spinner inside button, button disabled
3. Calls Firebase Auth `signInWithEmailAndPassword`
4. On success → fetch staff profile from Firestore `/staff/{uid}` to get `role` and `hotel_id`
5. Store role in app state (React Context / Zustand)
6. Navigate to Staff Dashboard (Screen 3A)
7. On failure → button resets, error message below: "Invalid email or password"

**"Scan QR Badge" behavior:**
- Opens device camera
- Staff scans their physical hotel QR badge (pre-printed at hotel setup)
- QR contains encoded staff token
- App decodes → auto-fills credentials → auto-signs in
- Useful for night shift staff who forget passwords

**"Forgot password?" behavior:**
- Inline email input appears below with "Send Reset Link" button
- Calls Firebase `sendPasswordResetEmail`
- Shows: "Reset link sent to your email"

---

# PART 2 — GUEST FLOW

---

## SCREEN 2A: GUEST HOME
**Who sees it:** Guests after selecting "Hotel Guest"
**This is the most important screen in the app — a guest will use this under stress**

```
┌─────────────────────┐
│  The Grand Meridian │  ← hotel name, DM Sans 14px, muted, center
│  Mumbai, Room 412   │  ← room auto-filled from QR scan at check-in OR manually entered
│                     │
│  Report Emergency   │  ← Syne 700, 24px, white, center
│  Tap what you see   │  ← DM Sans, muted
│                     │
│  ┌────────┬───────┐ │
│  │  🔥    │  🚨   │ │
│  │ FIRE   │SECURITY│ │  ← 2x2 grid of panic buttons
│  └────────┴───────┘ │
│  ┌────────┬───────┐ │
│  │  🩺    │  ⚡   │ │
│  │MEDICAL │ OTHER │ │
│  └────────┴───────┘ │
│                     │
│  ─── or describe ── │
│                     │
│  [Describe the      │
│   emergency...  ]   │  ← textarea, 80px height
│                     │
│  [🎤 Hold to speak] │  ← voice button, full width
│                     │
│  [Send Report  →]   │  ← primary red button, full width, 56px
│                     │
│  Language: English ▾│  ← small language selector, bottom
└─────────────────────┘
```

**Panic button (FIRE / SECURITY / MEDICAL / OTHER) tapped:**
- Button scales down (press feedback), background brightens
- Pre-fills the report type — user doesn't need to type anything
- "Send Report" button activates immediately (turns red, no longer grayed)
- If user ONLY taps a panic button and hits Send → that's enough. Gemini uses the type + hotel context to generate full instructions.
- If user taps a panic button AND types text → both are sent, Gemini uses both

**Textarea behavior:**
- Tap to focus → keyboard opens, textarea grows to 120px
- Accepts any language — Gemini will detect and process it
- Character counter appears at 200+ chars: "243 chars"
- No min character requirement — even "help" is valid

**"Hold to speak" button behavior:**
- Tap and hold → recording starts → red animated ring, "Recording... release to send"
- Release → Web Speech API transcribes in real-time
- Transcription appears in textarea automatically
- User can edit before sending
- If device doesn't support Web Speech API → button shows "Voice not supported" and hides itself

**Language selector behavior:**
- Bottom of screen, small
- Options: English, Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati
- Selecting a language tells Gemini which language to respond in for the guest instruction
- Does NOT prevent Gemini from understanding the input language

**"Send Report" button behavior:**
1. Validate: at least one panic type selected OR textarea has text
2. If empty → button shakes, brief error: "Please describe or tap what you see"
3. On valid submit → button shows spinner, disabled
4. POST to `/api/classify` with: `{raw_text, crisis_type, language, hotel_id, room_number, reporter_uid}`
5. Gemini processes (1–3 seconds)
6. Firestore incident written
7. Realtime DB live alert written → all staff notified
8. Navigate to Screen 2B (Report Sent)

**What if internet is slow/offline:**
- Show: "Sending... (this may take a moment)"
- If fails after 10s → "Report failed to send. Try again or call the front desk: 022-XXXX-XXXX"
- Emergency fallback phone number shown — always visible

**Room number setup:**
- At hotel check-in, staff shows guest a QR code that encodes their room number
- Guest scans it → room pre-fills
- If not scanned → a small "Enter your room number" field appears at top of Screen 2A
- Room number is optional but dramatically improves staff response routing

---

## SCREEN 2B: REPORT SENT — GUEST CONFIRMATION
**Who sees it:** Guest immediately after submitting a report
**This screen must feel like help is already coming**

```
┌─────────────────────┐
│                     │
│                     │
│     ✓               │  ← animated green checkmark, 64px, draws itself in 400ms
│                     │
│  Report Sent        │  ← Syne 700, 28px, white
│                     │
│  Staff have been    │
│  notified.          │  ← DM Sans 16px, muted
│                     │
│  ┌─────────────────┐│
│  │ What to do now  ││  ← card, #111318 bg
│  │                 ││
│  │ • Stay calm     ││
│  │ • Stay in place ││  ← AI-generated guest instruction from Gemini
│  │   unless staff  ││  ← shown in the guest's selected language
│  │   say otherwise ││
│  │ • Do not use    ││
│  │   the elevator  ││
│  └─────────────────┘│
│                     │
│  Staff responding   │
│  in: 0:47           │  ← live countdown timer, JetBrains Mono 22px, green
│                     │
│  [Report Another]   │  ← ghost button — only if situation worsens
│                     │
│  Emergency: 112     │  ← always visible, red text, tappable to call
└─────────────────────┘
```

**What the guest sees on this screen:**
- The exact safety instruction Gemini generated for their crisis type, in their language
- A countdown timer (starts at 60 seconds, counts down — this is aspirational, not a contract)
- The national emergency number 112 — always visible, always tappable

**Timer behavior:**
- Counts down from 60 to 0
- When it hits 0, it changes to: "Staff should be on their way. If no one has arrived, call 112."
- Timer is cosmetic/motivational — it doesn't actually track staff arrival

**"Report Another" button:**
- Only appears if the countdown has elapsed OR if a second report is needed
- Returns to Screen 2A with type pre-cleared

**This screen has NO back button. Guest cannot accidentally back out to the report form.**

---

## SCREEN 2C: GUEST SAFETY INSTRUCTIONS PAGE
**Who sees it:** Guest, pushed via Firebase notification OR navigated to from Screen 2B
**Triggered when:** Staff broadcasts a hotel-wide or floor-specific safety update

```
┌─────────────────────┐
│  🚨 HOTEL ALERT     │  ← full-width red banner at top
│                     │
│  FIRE — 3rd Floor   │  ← Syne 600, 22px
│  Issued 2 min ago   │  ← timestamp, muted
│                     │
│  Instructions for   │
│  all guests:        │
│                     │
│  ┌─────────────────┐│
│  │ 1. Evacuate to  ││
│  │    ground floor ││
│  │ 2. Use staircase││
│  │    only — NOT   ││
│  │    elevator     ││
│  │ 3. Assembly     ││
│  │    point: Front ││
│  │    parking lot  ││
│  └─────────────────┘│
│                     │
│  [View on Map  →]   │  ← opens Google Maps showing hotel layout + exit markers
│                     │
│  [I am Safe ✓]      │  ← primary green button — marks guest as "accounted for"
│                     │
│  Emergency: 112     │
└─────────────────────┘
```

**"I am Safe" button behavior:**
- Writes `{guest_uid, room_number, status: "safe", timestamp}` to Firestore `/incidents/{id}/guest_status`
- Admin dashboard shows real-time count: "47 of 120 guests confirmed safe"
- Button changes to: "✓ You're marked safe" — disabled, green
- Guest can still call 112 from this screen

**"View on Map" button:**
- Opens Google Maps embed with:
  - Hotel location pin
  - Assembly point pin (pre-configured by admin)
  - Route from current floor to nearest exit (requires pre-loaded floor data)

---

# PART 3 — STAFF FLOW

---

## SCREEN 3A: STAFF DASHBOARD (HOME)
**Who sees it:** Logged-in staff, immediately after login
**This is the command center. Staff will leave this app open all shift.**

```
┌─────────────────────┐
│ CrisisSync    [🔔 2]│  ← notification bell with badge count
│ Grand Meridian      │  ← hotel name
│ ─────────────────── │
│                     │
│ 🔴 CRITICAL         │  ← ACTIVE INCIDENT BANNER (only if active)
│ Fire — Floor 3      │  ← tap to open incident
│ Reported 2 min ago  │
│ ─────────────────── │
│                     │
│ YOUR ROLE: SECURITY │  ← role badge — always visible
│ On shift since 9PM  │
│                     │
│ ─── Live Feed ───   │
│                     │
│ ┌─────────────────┐ │
│ │ 🔴 Fire         │ │  ← Incident card 1 (Critical — red left border)
│ │ Floor 3, Rm 312 │ │
│ │ 3 min ago       │ │
│ │ [Acknowledge]   │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ 🟡 Medical      │ │  ← Incident card 2 (Medium — amber left border)
│ │ Lobby, Guest    │ │
│ │ 18 min ago      │ │
│ │ [Acknowledged ✓]│ │
│ └─────────────────┘ │
│                     │
│ ─── No more items ──│
│                     │
│ [📋] [🗺] [📊] [⚙] │  ← bottom nav: Feed / Map / Reports / Settings
└─────────────────────┘
```

**Real-time behavior:**
- Staff dashboard subscribes to Firebase Realtime DB `/live_incidents` using `onValue()` listener
- The moment a new incident is created → card appears at top of feed WITHOUT refreshing the page
- A push notification also fires (Firebase Cloud Messaging) even if app is in background
- Critical incidents: red banner slides down from top of screen, phone vibrates

**Active Incident Banner (top red bar):**
- Only appears if there is a CRITICAL or HIGH incident currently active
- Tapping it → opens Screen 3B (Incident Detail)
- Banner stays until incident is resolved

**Incident Card — "Acknowledge" button:**
- Tapping writes `{staff_uid, role, action: "acknowledged", timestamp}` to the incident's response_log in Firestore
- Button changes to: "✓ Acknowledged" — green, no longer tappable
- Other staff see the acknowledgment in real-time (their card updates too)
- Staff who acknowledged get their name shown in the card's responder list

**Bottom Navigation:**
- 📋 Feed — current screen (live incidents)
- 🗺 Map — hotel floor map with incident pins (Screen 3D)
- 📊 Reports — incident history (Screen 3E)
- ⚙ Settings — profile, notifications, shift status (Screen 3F)

---

## SCREEN 3B: INCIDENT DETAIL — STAFF
**Who sees it:** Staff who tapped an incident card
**This is where staff coordinate their response**

```
┌─────────────────────┐
│ ← Back   #INC-00431 │  ← incident ID in JetBrains Mono
│                     │
│ 🔴 CRITICAL — FIRE  │  ← severity badge + crisis type
│ 3rd Floor — Rm 312  │  ← location
│ Reported 4 min ago  │  ← timestamp
│ ─────────────────── │
│                     │
│ AI ANALYSIS         │  ← Gemini section header
│ ──────────────────  │
│ "Guest reported     │
│  smoke and burning  │
│  smell near room    │
│  312. Likely source:│
│  electrical. 3rd    │
│  and 4th floor      │
│  guests at risk."   │  ← Gemini summary, DM Sans 14px
│                     │
│ Confidence: 94%     │  ← thin progress bar
│                     │
│ ─────────────────── │
│ YOUR INSTRUCTIONS   │  ← role-specific section
│ (SECURITY)          │
│ ──────────────────  │
│ → Proceed to 3rd    │
│   floor immediately │
│ → Locate source of  │
│   smoke             │
│ → Begin evacuation  │
│   of floors 3–4     │  ← Gemini-generated, role-specific
│                     │
│ [Mark Done ✓]       │  ← check off when completed, green
│ ─────────────────── │
│                     │
│ [📸 Add Photo]      │  ← camera opens, uploads to Firebase Storage
│ [💬 Add Update]     │  ← text input, adds to response log
│                     │
│ ─────────────────── │
│ RESPONSE LOG        │
│ ──────────────────  │
│ 4m ago: Raj (F.Desk)│
│ → Acknowledged      │
│ 3m ago: Priya (Sec) │
│ → Proceeding to 3F  │  ← live, updates in real-time
│                     │
│ ─────────────────── │
│ GUEST STATUS        │
│ 12 / 80 confirmed   │  ← "I am Safe" count from guest confirmations
│ safe                │
│                     │
│ [📍 View on Map]    │  ← opens map view pinned to this incident
│                     │
│ [📢 Broadcast to    │
│    Guests]          │  ← opens Screen 3C (Broadcast)
│                     │
│ [✅ Mark Resolved]  │  ← only visible to admin role or shift manager
└─────────────────────┘
```

**"Mark Done" button:**
- Per-instruction checkboxes
- Each tap → logs `{staff_uid, instruction_index, done: true, timestamp}` to Firestore
- Other staff who view this incident see completed instructions grayed out
- When ALL instructions are checked → a green banner appears: "All tasks completed. Mark as Resolved?"

**"Add Photo" button:**
- Opens native camera
- Photo taken → compressed client-side → uploaded to Firebase Storage `/incidents/{id}/photos/`
- Thumbnail appears immediately in the response log
- Useful for: documenting fire source, damaged area, evacuated guests

**"Add Update" button:**
- Small text input sheet slides up from bottom
- Staff types a status update (e.g., "Smoke source located near electrical panel, room 308")
- Tapping "Post" → writes to response log → appears on ALL staff viewing this incident in real-time

**"Broadcast to Guests" button:**
- Opens Screen 3C
- Pre-fills crisis context from this incident

**"Mark Resolved" button:**
- Confirm dialog: "Mark this incident as resolved? This will end active alerts."
- On confirm: Firestore `/incidents/{id}/status` → "resolved", resolved_at → timestamp
- Cloud Function triggers: deletes from Realtime DB (clears all active alert banners for all staff/guests)
- Admin gets summary notification: "Incident #INC-00431 resolved by [name]"

---

## SCREEN 3C: BROADCAST TO GUESTS
**Who sees it:** Staff, from incident detail or independently
**Purpose:** Push a message to all guests on specific floors or hotel-wide**

```
┌─────────────────────┐
│ ← Cancel            │
│                     │
│ Broadcast Alert     │  ← Syne 600, 22px
│ ─────────────────── │
│                     │
│ TARGET AUDIENCE     │
│ ○ All guests        │  ← radio buttons
│ ● Floors 3–4 only   │
│ ○ Custom (select    │
│   floors below)     │
│                     │
│ LANGUAGE            │
│ [All languages   ▾] │  ← sends to guests in their selected language via Gemini
│                     │
│ MESSAGE             │
│ ┌─────────────────┐ │
│ │ A fire has been │ │
│ │ reported on 3rd │ │  ← pre-filled from Gemini based on incident
│ │ floor. Please   │ │  ← staff can edit before sending
│ │ evacuate using  │ │
│ │ staircases...   │ │
│ └─────────────────┘ │
│                     │
│ PREVIEW             │
│ Hindi: "तीसरी मंज़िल│
│ पर आग लगी है..."    │  ← auto-translated preview
│                     │
│ [Send to 247 guests]│  ← primary red button, shows recipient count
│                     │
└─────────────────────┘
```

**"Send to X guests" button:**
- Confirms the count before sending
- Triggers Cloud Function that queries Firestore for all guest devices matching the target floors
- Sends Firebase Cloud Messaging push notification to each device
- Also updates `/live_incidents/{id}/guest_broadcast` → guests currently on Screen 2A see an alert banner appear
- Shows delivery status: "Sent to 247 of 247 devices"

**Language behavior:**
- If "All languages" is selected → Gemini translates the message into all 9 supported languages
- Each guest receives the notification in the language they selected at Screen 2A
- If no language was selected by guest → default is English

---

## SCREEN 3D: FLOOR MAP VIEW
**Who sees it:** Staff, from bottom nav or "View on Map" button

```
┌─────────────────────┐
│ ← Back     Floor: 3 ▾│  ← floor selector dropdown at top
│                     │
│ ┌─────────────────┐ │
│ │                 │ │
│ │   [Hotel Floor  │ │
│ │    Map Image]   │ │  ← pre-uploaded floor plan image by admin
│ │       🔴        │ │  ← red pin at incident location
│ │      Rm 312     │ │
│ │       🟢        │ │  ← green pin at assembly point
│ │   Assembly Pt   │ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
│ LEGEND              │
│ 🔴 Active incident  │
│ 🟢 Assembly point   │
│ 🔵 Staff location   │
│ ⬛ Fire exit         │
│                     │
│ ACTIVE ON THIS FLOOR│
│ ┌─────────────────┐ │
│ │ #INC-00431 Fire │ │  ← tappable → opens incident detail
│ │ Room 312, 4m ago│ │
│ └─────────────────┘ │
└─────────────────────┘
```

**Floor selector dropdown:**
- Shows all floors for the hotel (pre-configured by admin)
- Switching floors loads that floor's map image and its active incidents

**Map image:**
- Static image uploaded by admin during hotel setup (can be a photo of the printed floor plan)
- Active incident pins are overlaid using absolute positioning based on admin-configured coordinates
- Staff taps a pin → opens incident detail

**Staff location pins:**
- If staff have location sharing enabled → their avatar appears as a blue pin on their current floor
- Location is only shared while they are on shift and consent is given at login

---

## SCREEN 3E: INCIDENT HISTORY (REPORTS)
**Who sees it:** Staff (own hotel only), from bottom nav

```
┌─────────────────────┐
│ ← Back              │
│                     │
│ Incident History    │  ← Syne 600, 22px
│ Grand Meridian      │
│                     │
│ FILTER              │
│ [All▾] [Date▾] [Type▾]│  ← filter row
│                     │
│ ─── This Week ───   │
│                     │
│ ┌─────────────────┐ │
│ │ 🔴 CRITICAL     │ │
│ │ Fire — Floor 3  │ │
│ │ Apr 22, 11:43PM │ │
│ │ Resolved in 8m  │ │  ← resolution time shown
│ │ [View Report →] │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ 🟡 MEDIUM       │ │
│ │ Medical — Lobby │ │
│ │ Apr 21, 2:15PM  │ │
│ │ Resolved in 12m │ │
│ │ [View Report →] │ │
│ └─────────────────┘ │
│                     │
│ ─── Last Week ───   │
│  ...                │
│                     │
└─────────────────────┘
```

**Filter row:**
- All / Critical / High / Medium / Low (severity filter)
- Date picker — "Last 7 days / Last 30 days / Custom"
- Type — Fire / Medical / Security / Power / Other

**"View Report" button:**
- Opens Screen 3E2 (Incident Report Detail — read-only version of Screen 3B)
- Shows full timeline, all photos, all staff actions, resolution time
- "Download PDF" button available for completed incidents (generates PDF via backend)

---

## SCREEN 3F: SETTINGS / PROFILE
**Who sees it:** Staff, from bottom nav

```
┌─────────────────────┐
│ Settings            │
│                     │
│ ACCOUNT             │
│ Priya Sharma        │  ← name
│ Security Team       │  ← role
│ Grand Meridian      │  ← hotel
│ [Edit Profile]      │
│                     │
│ SHIFT               │
│ Status: On Shift ●  │  ← green dot, tap to toggle off
│ Shift since: 9:00PM │
│ [End Shift]         │  ← removes from active staff list
│                     │
│ NOTIFICATIONS       │
│ Critical alerts  ✓  │  ← toggle — CANNOT be turned off for critical
│ High alerts      ✓  │  ← toggle
│ Medium alerts    ○  │  ← toggle, off by default
│ Low alerts       ○  │
│                     │
│ LANGUAGE            │
│ [English         ▾] │  ← interface language
│                     │
│ EMERGENCY CONTACTS  │
│ 112 (National)      │
│ 101 (Fire)          │
│ 102 (Ambulance)     │
│ [Edit contacts]     │  ← admin-configured hotel-specific numbers
│                     │
│ [Sign Out]          │  ← logs out, clears token, back to Screen 1B
└─────────────────────┘
```

**"End Shift" behavior:**
- Updates `/staff/{uid}/on_shift` to false
- Staff is removed from the "currently on shift" count in Admin Dashboard
- They still receive critical notifications until they explicitly sign out

**Critical alerts toggle:**
- Cannot be turned off. If staff tries to toggle it off → shows: "Critical alerts cannot be disabled. These are safety notifications."
- This is intentional and non-negotiable in the UX.

---

# PART 4 — ADMIN FLOW

---

## SCREEN 4A: ADMIN DASHBOARD
**Who sees it:** Hotel admin/manager
**More data-dense than staff dashboard — admin needs overview, not just live feed**

```
┌─────────────────────┐
│ Admin  Grand Meridian│
│ ─────────────────── │
│                     │
│ 🔴 1 ACTIVE INCIDENT│  ← critical banner if active
│                     │
│ TODAY AT A GLANCE   │
│ ┌────┬────┬────┐    │
│ │ 3  │ 0  │ 94%│    │  ← stat cards row
│ │Inc.│Crit│Res.│    │
│ └────┴────┴────┘    │
│                     │
│ STAFF ON SHIFT: 6   │
│ Raj (FD) • Priya (S)│  ← abbreviated list with role codes
│ +4 more             │
│                     │
│ GUESTS CHECKED IN   │
│ 247 guests today    │
│                     │
│ ─── Recent ─────    │
│ [incident cards...] │  ← same cards as staff, all incidents visible
│                     │
│ [+] [🗺] [📊] [⚙]  │  ← bottom nav: Create / Map / Analytics / Settings
└─────────────────────┘
```

**"+" (Create Incident) button:**
- Admin can manually log an incident that wasn't reported via the app (e.g., verbal report from a guest)
- Opens a form: Crisis Type selector + Location + Description + Severity override
- Bypasses Gemini classification (admin selects manually) OR can still send to Gemini for instruction generation

**Staff On Shift section:**
- Tappable → expands to full list with each staff member's current status
- Green dot = on shift and acknowledged recent alert
- Red dot = on shift but hasn't acknowledged a critical alert (>2 min)
- Gray = off shift

---

## SCREEN 4B: ADMIN ANALYTICS
**Who sees it:** Admin, from bottom nav 📊

```
┌─────────────────────┐
│ Analytics           │
│ Grand Meridian      │
│ [Apr 2026       ▾]  │  ← month picker
│                     │
│ INCIDENTS THIS MONTH│
│ ──────────────────  │
│ Total:    47        │
│ Critical: 6  🔴     │
│ High:     12 🟠     │
│ Medium:   19 🟡     │
│ Low:      10 🟢     │
│                     │
│ AVG RESPONSE TIME   │
│ 1m 42s              │  ← target: under 2 minutes
│ ▼ 34% faster than   │
│   last month        │
│                     │
│ INCIDENT TYPES      │
│ 🔥 Fire       32%   │  ← horizontal bar chart, colored
│ 🩺 Medical    28%   │
│ 🚨 Security   18%   │
│ ⚡ Power      14%   │
│ ❓ Other       8%   │
│                     │
│ PEAK HOURS          │
│ 11PM–3AM  ████████  │  ← heatmap-style bar chart
│ 6AM–9AM   ████      │
│                     │
│ [Download Report]   │  ← generates PDF monthly report
└─────────────────────┘
```

**"Download Report" button:**
- Calls backend `/report/monthly?hotel_id=X&month=2026-04`
- FastAPI queries Firestore for all incidents in that month
- Generates structured report with: incident table, response time stats, staff performance, recommendations
- Downloads as PDF via browser

---

## SCREEN 4C: ADMIN SETTINGS — HOTEL SETUP
**Who sees it:** Admin only — initial hotel configuration
**This is where the hotel is set up before going live**

```
┌─────────────────────┐
│ ← Back              │
│                     │
│ Hotel Setup         │
│                     │
│ HOTEL DETAILS       │
│ Name: [Grand Mer...] │
│ Address: [Mumbai...] │
│ Total Floors: [12  ] │
│ Total Rooms: [240  ] │
│                     │
│ EMERGENCY CONTACTS  │
│ Police: [100       ] │
│ Fire: [101         ] │
│ Ambulance: [102    ] │
│ Front Desk: [ext 0 ] │
│                     │
│ ASSEMBLY POINT      │
│ [Set on Map  →]     │  ← opens map to drop a pin
│ Current: Front      │
│ parking lot         │
│                     │
│ FLOOR MAPS          │
│ Floor 1: [Upload ▾] │
│ Floor 2: [Upload ▾] │
│ Floor 3: ✓ Uploaded │  ← green check
│ [+Add Floor]        │
│                     │
│ STAFF MANAGEMENT    │
│ [Manage Staff →]    │  ← opens staff list with invite/remove
│ 12 staff registered │
│                     │
│ GUEST QR CODES      │
│ [Generate Room QR   │
│  Codes →]           │  ← batch generates QR for each room
│                     │
│ [Save Changes]      │
└─────────────────────┘
```

**"Set on Map" for assembly point:**
- Opens Google Maps
- Admin drops a pin → coordinates saved to Firestore `/hotels/{id}/assembly_point`
- This pin appears on the floor map for all guests during an incident

**"Generate Room QR Codes":**
- Generates a batch PDF with QR codes for every room (Room 101–240)
- Admin prints and places in each room (back of door)
- Each QR encodes: `{hotel_id, room_number}` — no sensitive data
- Guest scans it → their session is linked to their room automatically

---

# PART 5 — NOTIFICATION SYSTEM

---

## HOW NOTIFICATIONS WORK (Every Type)

### Type 1: New Critical Incident
**Who gets it:** All staff on shift at that hotel
**When:** Within 3 seconds of incident being created
**What they see:**
- Push notification (even if app is closed): "🔴 CRITICAL: Fire reported on Floor 3 — Grand Meridian. Open CrisisSync."
- Phone vibrates 3 times
- If app is open: red banner slides down from top of any screen they're on

### Type 2: New High Incident
**Who gets it:** All staff on shift
**What they see:**
- Push notification: "🟠 HIGH: Security incident in lobby — Grand Meridian."
- Phone vibrates once
- App badge count increments

### Type 3: Medium / Low Incident
**Who gets it:** Staff who have medium/low notifications enabled (optional in Settings)
**What they see:**
- Silent push notification (no vibration)
- Badge count increments

### Type 4: Incident Updated
**Who gets it:** Any staff who acknowledged the incident
**When:** A status update or photo is posted by another staff member
**What they see:** "Update on #INC-00431: Priya posted — Smoke source located in electrical panel"

### Type 5: Incident Resolved
**Who gets it:** All staff who were part of the incident
**What they see:** "✅ Resolved: Fire incident on Floor 3 resolved in 8 minutes."

### Type 6: Guest Broadcast Confirmation
**Who gets it:** The staff member who sent the broadcast
**What they see:** "📢 Broadcast sent to 247 guests. 239 delivered."

### Type 7: Escalation Alert (Auto)
**When:** A HIGH incident has no acknowledgment from any staff for 3 minutes
**Triggered by:** Cloud Function with a Firestore time-based trigger
**Who gets it:** Admin
**What they see:** "⚠️ Escalation: #INC-00432 (HIGH) has no staff response in 3 minutes. Immediate action needed."

---

# PART 6 — REAL-TIME DATA FLOW (EVERY INCIDENT LIFECYCLE)

---

## COMPLETE LIFECYCLE OF ONE INCIDENT

```
T+0:00  Guest taps "FIRE" panic button on Screen 2A
        └── App sends POST to /api/classify
        
T+0:02  FastAPI receives request
        └── Calls Gemini 1.5 Flash with incident context
        
T+0:04  Gemini returns JSON:
        {
          crisis_type: "fire",
          severity: "critical",
          summary: "Guest reports smoke near Room 312...",
          guest_instruction: "Stay in room, place towel under door...",
          staff_instructions: {
            front_desk: "Call 101 (fire services) immediately, announce PA",
            security: "Proceed to Floor 3, locate smoke source, begin evacuation",
            housekeeping: "Assist guests in rooms 301-320 to staircase",
            management: "Activate fire protocol, notify ownership, contact insurance"
          },
          call_emergency_services: true,
          confidence: 0.96
        }

T+0:05  FastAPI writes to Firestore /incidents/INC-00431
        └── status: "reported"
        
T+0:05  Cloud Function triggers on Firestore write
        └── Writes to Realtime DB /live_incidents/INC-00431
        └── Sends FCM push to all 6 on-shift staff
        
T+0:06  All 6 staff phones vibrate simultaneously
        └── Push notification appears
        └── Staff who have app open see red banner
        
T+0:08  Guest sees Screen 2B (report sent confirmation)
        └── Gemini guest instruction displayed in Hindi
        └── Countdown timer starts

T+0:45  Raj (Front Desk) taps "Acknowledge" on incident card
        └── Firestore: response_log entry written
        └── Realtime DB: all other staff see "1 responding"
        └── Raj sees role-specific instructions on Screen 3B
        
T+0:47  Priya (Security) acknowledges
        └── Proceeds to Floor 3
        └── Taps "Add Update": "I am at 3F, locating smoke source"
        └── All staff see this update in real-time
        
T+1:30  Priya adds photo of smoke source
        └── Uploaded to Firebase Storage
        └── Thumbnail visible in incident response log for all staff
        
T+2:15  Raj broadcasts to guests on floors 3–4 (Screen 3C)
        └── Cloud Function sends FCM to 63 guest devices
        └── Guests see Screen 2C with evacuation instructions
        
T+5:00  Priya marks her instructions done (checkbox)
        └── Other instructions still pending
        
T+8:12  Admin marks incident as Resolved
        └── Firestore: status → "resolved", resolved_at → timestamp
        └── Cloud Function deletes /live_incidents/INC-00431
        └── All active alert banners disappear for all staff and guests
        └── All staff receive "Resolved in 8 min" notification
        └── Incident moves to history in Screen 3E
        
T+8:12  Admin sees updated analytics — avg response time recalculated
```

---

# PART 7 — ERROR STATES + EDGE CASES

---

## EVERY ERROR THAT CAN HAPPEN AND HOW THE APP HANDLES IT

| Situation | What App Shows | What Happens Behind the Scenes |
|---|---|---|
| Guest submits report but internet drops | "Sending failed. Call front desk: 022-XXXX" + retry button | Request is queued, retried when connectivity restored |
| Gemini API takes >5s to respond | Progress indicator: "Analyzing... (this takes a moment)" | Request continues, no timeout until 15s |
| Gemini API fails completely | Crisis classified as "UNCLASSIFIED — URGENT" with generic staff instructions | Fallback hardcoded instructions sent immediately |
| Staff notification not delivered (FCM failure) | Admin sees red dot next to unnotified staff | Cloud Function retries 3x, then escalates to admin |
| Two staff tap "Acknowledge" simultaneously | Both acknowledgments are recorded | Firestore transaction ensures no overwrites — both appear in log |
| Admin marks wrong incident resolved | "Undo" option appears for 30 seconds after resolving | Reverts Firestore status and re-writes to Realtime DB |
| Guest tries to submit duplicate report | "You already reported this. Your report is being handled." | Checked via guest uid against last 5 minutes of reports |
| Staff tries to open incident from another hotel | "You don't have access to this incident." | Firestore security rules block cross-hotel reads |
| App opened but no internet | Cached last-known state from localStorage. Banner: "Offline — showing last updated data" | Service worker serves cached shell. No real-time updates until reconnected. |

---

# PART 8 — FEATURE SUMMARY TABLE

---

| Feature | Guest | Staff | Admin | Screen |
|---|---|---|---|---|
| One-tap panic buttons | ✓ | ✗ | ✗ | 2A |
| Text crisis report | ✓ | ✓ | ✓ | 2A / 3B |
| Voice report | ✓ | ✗ | ✗ | 2A |
| Multilingual input (10 languages) | ✓ | ✓ | ✓ | All |
| Gemini AI classification | auto | auto | auto | backend |
| Receive safety instructions | ✓ | ✗ | ✗ | 2B / 2C |
| "I am Safe" confirmation | ✓ | ✗ | ✗ | 2C |
| Real-time incident feed | ✗ | ✓ | ✓ | 3A / 4A |
| Role-specific instructions | ✗ | ✓ | ✓ | 3B |
| Acknowledge incident | ✗ | ✓ | ✓ | 3A / 3B |
| Add photo evidence | ✗ | ✓ | ✓ | 3B |
| Add status update | ✗ | ✓ | ✓ | 3B |
| Broadcast to guests | ✗ | ✓ | ✓ | 3C |
| Floor map with incident pins | ✗ | ✓ | ✓ | 3D |
| Incident history | ✗ | ✓ (own hotel) | ✓ | 3E |
| Mark incident resolved | ✗ | ✗ | ✓ | 3B / 4A |
| Analytics dashboard | ✗ | ✗ | ✓ | 4B |
| Hotel setup & floor maps | ✗ | ✗ | ✓ | 4C |
| Manage staff accounts | ✗ | ✗ | ✓ | 4C |
| Generate room QR codes | ✗ | ✗ | ✓ | 4C |
| Auto-escalation if unacknowledged | ✗ | ✗ | ✓ (receives) | auto |
| Download incident PDF report | ✗ | ✗ | ✓ | 4B |
| Shift status management | ✗ | ✓ | ✓ | 3F |
| Notification preferences | ✗ | ✓ | ✓ | 3F |
