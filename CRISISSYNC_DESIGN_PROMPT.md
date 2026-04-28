# CrisisSync — Full App Native Mobile Design Prompt
# For Agent Use: Copy this entire prompt and give it to your design agent or AI code editor.
# Target: Play Store production-ready, native Android Material You + custom design system.

---

## MASTER PROMPT — GIVE THIS ENTIRE BLOCK TO YOUR AGENT

```
You are building the complete UI for CrisisSync — a real-time AI-powered hotel crisis
response mobile app. This is a Play Store production-ready app. Every screen must pass
Google Play Store screenshot guidelines and look like a professionally shipped Android
app, not a prototype or student project.

The app has three user types:
  - Guest (hotel guest, no login, reports emergencies)
  - Staff (hotel staff, email login, responds to incidents)
  - Admin (hotel manager, full access, analytics and settings)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — DESIGN SYSTEM (Apply to every single screen)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANVAS SIZE:
  - All screens: 390px wide × 844px tall (iPhone 14 / Pixel 7 equivalent)
  - Safe area top: 44px (status bar)
  - Safe area bottom: 34px (home indicator / gesture bar)
  - All content must stay within safe areas — nothing bleeds into status bar or home indicator

COLOR SYSTEM (use CSS variables, use these exact values everywhere):
  --bg-primary:       #0A0C10   /* main screen background */
  --bg-surface:       #111318   /* cards, input fields, bottom sheets */
  --bg-elevated:      #1A1D24   /* modals, dropdowns, tooltips */
  --border:           #2A2D35   /* all dividers and borders — 1px only */
  --accent-blue:      #3B82F6   /* primary interactive: buttons, links, focus */
  --accent-blue-dim:  #1E3A5F   /* pressed state for blue elements */
  --severity-critical:#FF3B3B   /* CRITICAL severity — fire, life threat */
  --severity-high:    #FF8C00   /* HIGH severity */
  --severity-medium:  #F5A623   /* MEDIUM severity */
  --severity-low:     #00C9A7   /* LOW severity */
  --severity-safe:    #00E676   /* resolved, safe, confirmed */
  --text-primary:     #F4F6FA   /* headings, labels, all main text */
  --text-secondary:   #8A8FA8   /* timestamps, metadata, subtitles */
  --text-muted:       #4A4F62   /* placeholders, disabled states */
  --text-link:        #3B82F6   /* tappable text */

TYPOGRAPHY SYSTEM:
  Font 1 — Syne (Google Fonts): Used ONLY for screen titles, headings, and the app logo
  Font 2 — DM Sans (Google Fonts): Used for ALL body text, buttons, labels, inputs
  Font 3 — JetBrains Mono (Google Fonts): Used ONLY for incident IDs, timestamps, codes

  Scale — do not deviate from these sizes:
    Screen Title:     Syne 700,   24px,  line-height 1.2,  color: --text-primary
    Section Header:   DM Sans 600, 13px, line-height 1.4,  color: --text-secondary, UPPERCASE, letter-spacing: 0.08em
    Card Title:       DM Sans 600, 16px, line-height 1.3,  color: --text-primary
    Body Text:        DM Sans 400, 15px, line-height 1.6,  color: --text-primary
    Supporting Text:  DM Sans 400, 13px, line-height 1.5,  color: --text-secondary
    Micro Label:      DM Sans 700, 11px, UPPERCASE,         color: --text-muted, letter-spacing: 0.1em
    Mono/Code:        JetBrains Mono 500, 13px,             color: --text-secondary

SPACING SYSTEM (8px base grid — use multiples of 8 only):
  xs:   4px
  sm:   8px
  md:   16px
  lg:   24px
  xl:   32px
  xxl:  48px

  Screen horizontal padding: 20px left and right (NOT 16px, NOT 24px — exactly 20px)
  Between cards: 12px gap
  Inside cards: 16px padding all sides
  Between sections: 32px gap
  Between label and its content: 8px

BORDER RADIUS:
  Screens/modals:   0px (full screen = no radius)
  Cards:            12px
  Buttons (primary):10px
  Buttons (small):  8px
  Input fields:     10px
  Badges/chips:     4px
  Bottom sheets:    20px top corners only
  Avatar circles:   50%

ELEVATION (dark theme — use opacity borders, NOT box-shadows):
  Level 0 (background):   #0A0C10
  Level 1 (cards):        #111318, border: 1px solid #2A2D35
  Level 2 (bottom sheet): #1A1D24, border-top: 1px solid #2A2D35
  Level 3 (modal):        #1E2128, border: 1px solid #3A3D45

SEVERITY COLOR SYSTEM (apply to cards, badges, borders):
  CRITICAL: card bg rgba(255,59,59,0.07)  | left-border 3px solid #FF3B3B | badge bg #FF3B3B
  HIGH:     card bg rgba(255,140,0,0.06)  | left-border 3px solid #FF8C00 | badge bg #FF8C00
  MEDIUM:   card bg rgba(245,166,35,0.06) | left-border 3px solid #F5A623 | badge bg #F5A623
  LOW:      card bg rgba(0,201,167,0.06)  | left-border 3px solid #00C9A7 | badge bg #00C9A7
  RESOLVED: card bg rgba(0,230,118,0.05)  | left-border 3px solid #00E676 | badge bg #1A3A2A, text #00E676

INTERACTIVE STATES (every tappable element must have all three):
  Default:  as designed
  Pressed:  scale(0.97) + background darkens 12% — 100ms transition
  Disabled: opacity 0.4, not tappable
  Focus:    2px solid #3B82F6 outline, 2px offset

ANIMATION TIMING (use these exact values — no exceptions):
  Micro (hover, press):      100ms  ease-out
  Component (cards, modals): 220ms  cubic-bezier(0.4, 0, 0.2, 1)
  Page transitions:          300ms  cubic-bezier(0.4, 0, 0.2, 1)
  Alert entry (critical):    350ms  cubic-bezier(0.34, 1.56, 0.64, 1)  ← slight bounce
  Stagger delay per item:    40ms   between each card in a list

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — GLOBAL COMPONENT LIBRARY
Build these components first. Every screen uses them.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPONENT: StatusBar
  Height: 44px
  Background: transparent (inherits screen bg)
  Left: time "9:41" in DM Sans 500 15px, --text-primary
  Right: battery + wifi + signal icons, 16px, --text-secondary
  This sits at absolute top of every screen

COMPONENT: TopAppBar
  Height: 56px, sits below StatusBar
  Horizontal padding: 20px
  Left slot: back arrow icon (24px, --text-primary) OR hamburger/logo
  Center slot: screen title in Syne 700 18px, --text-primary
  Right slot: icon button(s) — 40×40px tap target, icon 22px
  No border below — use the screen background
  Elevation: none (flat, same as screen bg)

COMPONENT: BottomNavBar
  Height: 60px + 34px safe area = 94px total
  Background: #111318
  Border-top: 1px solid #2A2D35
  4 items maximum: icon (24px) + label (DM Sans 500, 11px)
  Active item: icon + label in #3B82F6
  Inactive item: icon + label in #4A4F62
  Active indicator: 40×32px rounded rect #1E3A5F behind active icon (no underline)
  Tap target per item: full height, 25% width each

COMPONENT: PrimaryButton
  Height: 52px
  Width: full width of container (100%)
  Background: #3B82F6
  Border-radius: 10px
  Label: DM Sans 700 16px, white, center
  Loading state: replace label with 20px spinner (white, 2px stroke)
  Disabled: background #1E3A5F, label --text-muted
  Pressed: scale(0.97), background #2563EB, 100ms

COMPONENT: DestructiveButton
  Same as PrimaryButton but background: #FF3B3B
  Used only for: Send Emergency Report, Confirm Escalation

COMPONENT: GhostButton
  Height: 44px
  Background: transparent
  Border: 1px solid #2A2D35
  Border-radius: 10px
  Label: DM Sans 600 15px, --text-primary
  Pressed: background rgba(255,255,255,0.05)

COMPONENT: IconButton
  Size: 40×40px tap target
  Icon: 22px, centered
  Background: transparent
  Pressed: background rgba(255,255,255,0.08), border-radius 8px

COMPONENT: InputField
  Height: 52px
  Background: #111318
  Border: 1px solid #2A2D35
  Border-radius: 10px
  Padding: 0 16px
  Label above field: DM Sans 500 13px, --text-secondary, margin-bottom 6px
  Placeholder: DM Sans 400 15px, --text-muted
  Active/focus border: 1px solid #3B82F6
  Error border: 1px solid #FF3B3B
  Error message below: DM Sans 400 12px, #FF3B3B, margin-top 4px
  Icon right slot: 20px icon, --text-muted

COMPONENT: TextArea
  Min-height: 100px, max-height: 180px, grows with content
  Same styling as InputField
  Resize: none (no resize handle)
  Padding: 14px 16px

COMPONENT: SeverityBadge
  Height: 22px
  Padding: 0 8px
  Border-radius: 4px
  Label: DM Sans 700 11px UPPERCASE, white, letter-spacing 0.08em
  Colors: use severity color system above
  CRITICAL badge: also has 1px animated pulse ring at 2s interval

COMPONENT: RoleBadge
  Height: 20px
  Padding: 0 8px
  Border-radius: 4px
  Background: #1A1D24
  Border: 1px solid #2A2D35
  Label: DM Sans 700 10px UPPERCASE, --text-secondary, letter-spacing 0.1em

COMPONENT: LiveDot
  Size: 8px circle
  Color: #00E676 (safe) or #FF3B3B (critical)
  Animation: scale 1→1.5→1, opacity 1→0.3→1, 1.5s infinite

COMPONENT: Divider
  Height: 1px
  Background: #2A2D35
  Margin: 0 (full width) OR margin: 0 20px (inset)
  Never use for every item — only between sections

COMPONENT: BottomSheet
  Background: #1A1D24
  Border-top-left-radius: 20px
  Border-top-right-radius: 20px
  Border-top: 1px solid #2A2D35
  Handle bar: 40×4px, #2A2D35, border-radius 2px, centered, margin-top 12px
  Backdrop: rgba(0,0,0,0.7)
  Slides up from bottom: 300ms cubic-bezier(0.4, 0, 0.2, 1)

COMPONENT: Toast/Snackbar
  Position: fixed, bottom 100px (above bottom nav), centered horizontally
  Width: calc(100% - 40px), max-width 350px
  Background: #1E2128
  Border: 1px solid #3A3D45
  Border-radius: 10px
  Padding: 12px 16px
  Icon left (20px) + message text (DM Sans 500 14px --text-primary)
  Auto-dismiss: 3 seconds, slides down with fade

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — ALL SCREENS (Build in this exact order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══════════════════════════════════
SCREEN 01 — SPLASH SCREEN
═══════════════════════════════════
Background: #0A0C10
Centered vertically and horizontally.

Layout (center column, no horizontal padding):
  [CrisisSync logo mark]
    SVG: two concentric circles, outer circle broken at 10 o'clock position
    Inner: small wifi/pulse arc
    Outer ring: 2px stroke #3B82F6
    Break gap color: #FF3B3B
    Size: 64×64px

  [App name]
    "Crisis" + "Sync" on same line
    "Crisis" = Syne 700 28px #F4F6FA
    "Sync" = Syne 700 28px #3B82F6
    Margin-top: 16px from logo

  [Tagline]
    "Real-time crisis response for hotels"
    DM Sans 400 14px --text-secondary
    Margin-top: 8px

  [Loading indicator]
    3 dots, 8px each, #3B82F6, spacing 8px between
    Staggered pulse animation: dot 1 at 0ms, dot 2 at 150ms, dot 3 at 300ms
    Margin-top: 48px

Bottom of screen (above safe area):
  "Powered by Google AI" — DM Sans 400 12px --text-muted, centered

Duration: 2 seconds, then auto-navigate.


═══════════════════════════════════
SCREEN 02 — ROLE SELECT
═══════════════════════════════════
Background: #0A0C10
No TopAppBar (first screen after splash).

StatusBar at top.

Content starts at 80px from top:
  Logo (40px version, same SVG as splash)
  "CrisisSync" — Syne 700 22px --text-primary, margin-top 12px

  Section title:
    "Who are you?" — Syne 700 24px --text-primary, margin-top 48px
    "Select your role to continue" — DM Sans 400 14px --text-secondary, margin-top 6px

  Three role cards, stacked vertically, 12px gap, margin-top 32px:

    CARD STRUCTURE (each card):
      Width: 100% (with 20px horizontal screen padding)
      Height: 80px
      Background: #111318
      Border: 1px solid #2A2D35
      Border-radius: 12px
      Padding: 0 20px
      Layout: horizontal flex, align-center, space-between

      LEFT: icon (32px) + text column
        Icon in 48×48px rounded rect container (bg: role-specific color at 10% opacity)
        Text column: role title (DM Sans 600 16px --text-primary) + subtitle (DM Sans 400 13px --text-secondary)

      RIGHT: chevron right icon, 20px, --text-muted

    Card 1 — Hotel Guest:
      Icon: person with luggage emoji or Heroicon "user" — container bg rgba(59,130,246,0.1)
      Title: "Hotel Guest"
      Subtitle: "Report an emergency · No login needed"
      On tap: navigate to SCREEN 04 (Guest Home)

    Card 2 — Hotel Staff:
      Icon: Heroicon "badge-check" — container bg rgba(0,201,167,0.1)
      Title: "Hotel Staff"
      Subtitle: "Respond to incidents · Login required"
      On tap: navigate to SCREEN 03 (Staff Login)

    Card 3 — Admin / Manager:
      Icon: Heroicon "building-office" — container bg rgba(245,166,35,0.1)
      Title: "Hotel Manager"
      Subtitle: "Full access · Admin login"
      On tap: navigate to SCREEN 03 (Staff Login, admin=true flag)


═══════════════════════════════════
SCREEN 03 — STAFF / ADMIN LOGIN
═══════════════════════════════════
Background: #0A0C10

TopAppBar:
  Left: back arrow (navigate to SCREEN 02)
  Center: "Staff Login" — Syne 700 18px

Content (20px horizontal padding):
  Role indicator chip at top:
    Inline chip, 32px height, border-radius 8px
    Background: rgba(0,201,167,0.1), border: 1px solid #00C9A7
    Icon (16px) + "Logging in as: Hotel Staff" — DM Sans 500 13px #00C9A7
    Margin-top: 32px

  Section title:
    "Welcome back" — Syne 700 24px --text-primary, margin-top 24px
    "Enter your hotel credentials" — DM Sans 400 14px --text-secondary, margin-top 6px

  Form (margin-top 32px, 20px gap between fields):
    InputField: label "Work Email", type email, placeholder "your@hotel.com"
    InputField: label "Password", type password, placeholder "Enter password"
                Right icon: eye toggle (show/hide password), 20px

  "Forgot password?" — DM Sans 500 14px #3B82F6, right-aligned, margin-top 8px

  PrimaryButton: "Sign In" — full width, margin-top 32px

  Divider with "OR" text:
    Horizontal line #2A2D35, "OR" in center on --bg-primary background
    DM Sans 400 13px --text-muted
    Margin: 24px 0

  GhostButton: "Scan Staff QR Badge" — full width
    Left icon: QR code scan icon, 20px
    On tap: opens camera for QR badge scan

  Error state (shown below Sign In button on failure):
    Red inline message: icon + "Invalid email or password. Try again."
    DM Sans 400 13px #FF3B3B, margin-top 12px

  Loading state (when Sign In tapped):
    Button shows spinner
    Both fields become disabled (opacity 0.4)
    No page transition until auth resolves


═══════════════════════════════════
SCREEN 04 — GUEST HOME (PANIC REPORT)
═══════════════════════════════════
CRITICAL SCREEN — This must work under stress. Zero cognitive load.
Background: #0A0C10

StatusBar at top.

No TopAppBar. Instead, hotel context bar:
  Height: 52px, background #111318, border-bottom 1px solid #2A2D35
  Left: hotel name "The Grand Meridian" — DM Sans 600 14px --text-primary
  Right: room number chip "Room 412" — 26px height, border-radius 6px,
         bg #1A1D24, border 1px solid #2A2D35, DM Sans 500 13px --text-secondary

Main content (20px horizontal padding):
  Screen title:
    "Report Emergency" — Syne 700 24px --text-primary, margin-top 28px
    "Tap what you see. Help arrives in seconds." — DM Sans 400 14px --text-secondary, margin-top 6px

  PANIC BUTTONS GRID — 2×2 grid, 12px gap, margin-top 32px:
    Each button: width calc(50% - 6px), height 120px, border-radius 12px
    Layout: flex column, align-center, justify-center, gap 10px

    Button internal structure:
      Icon container: 48×48px, border-radius 12px (icon-specific bg color at 15%)
      Icon: 28px SVG
      Label: DM Sans 700 16px, color matches icon color
      Sub-label: DM Sans 400 12px --text-secondary, text-align center

    Button 1 — FIRE:
      Background: rgba(255,59,59,0.08)
      Border: 1px solid rgba(255,59,59,0.3)
      Icon-container bg: rgba(255,59,59,0.15)
      Icon: flame SVG, #FF3B3B
      Label: "Fire" #FF3B3B
      Sub-label: "Smoke or flames"

    Button 2 — SECURITY:
      Background: rgba(255,140,0,0.08)
      Border: 1px solid rgba(255,140,0,0.3)
      Icon: shield-exclamation SVG, #FF8C00
      Label: "Security" #FF8C00
      Sub-label: "Threat or intrusion"

    Button 3 — MEDICAL:
      Background: rgba(245,166,35,0.08)
      Border: 1px solid rgba(245,166,35,0.3)
      Icon: heart-pulse SVG, #F5A623
      Label: "Medical" #F5A623
      Sub-label: "Injury or illness"

    Button 4 — OTHER:
      Background: rgba(59,130,246,0.08)
      Border: 1px solid rgba(59,130,246,0.3)
      Icon: exclamation-triangle SVG, #3B82F6
      Label: "Other" #3B82F6
      Sub-label: "Any emergency"

    SELECTED STATE (when a button is tapped):
      Border becomes 2px solid [button color]
      Background opacity increases to 0.15
      Checkmark icon appears top-right corner of button (16px, white, in colored circle 24px)
      Other buttons dim to opacity 0.5

  "— or describe what you see —" divider:
    DM Sans 400 13px --text-muted, centered, with lines either side
    Margin: 24px 0

  TextArea:
    Placeholder: "e.g. Smoke coming from room 311, 3rd floor..."
    Min-height: 100px
    No label above (placeholder is sufficient)

  Voice button row:
    Full width, height 48px, background #111318, border 1px solid #2A2D35, border-radius 10px
    Left: microphone icon 20px --text-secondary
    Center: "Hold to speak" DM Sans 500 14px --text-secondary
    RECORDING STATE: border #FF3B3B, red pulsing ring on mic icon, "Recording... release to send" in #FF3B3B

  Language row:
    Label "Language:" DM Sans 500 13px --text-secondary
    Dropdown "English ▾" DM Sans 500 13px #3B82F6
    Horizontal flex, space-between, margin-top 12px

  DestructiveButton: "Send Emergency Report"
    Height: 56px (taller than standard for easy thumb tap)
    Margin-top: 20px
    Icon: arrow-right 20px, right side of label
    LOADING STATE: spinner, "Sending..." text

  Emergency fallback (always visible, below send button):
    "Can't submit? Call front desk: 022-XXXX-XXXX"
    DM Sans 400 12px --text-muted, centered
    Phone number tappable (tel: link) in --text-link

  Bottom safe area: 34px — no content here


═══════════════════════════════════
SCREEN 05 — GUEST REPORT SENT (SUCCESS)
═══════════════════════════════════
Background: #0A0C10
Full screen. No back button. No navigation bar.

StatusBar at top.

Content centered vertically and horizontally (use flex column, justify-center):
  Success animation container (96×96px):
    Circle background: rgba(0,230,118,0.1), border: 1px solid rgba(0,230,118,0.3)
    Checkmark SVG inside: stroke-dashoffset animation draws the check in 400ms
    Checkmark color: #00E676, stroke-width 2.5

  "Report Sent" — Syne 700 28px --text-primary, margin-top 20px, centered

  "Hotel staff have been notified." — DM Sans 400 16px --text-secondary, margin-top 8px, centered

  Safety instructions card (margin-top 32px):
    Width: 100% with 20px horizontal padding
    Background: #111318
    Border: 1px solid #2A2D35, border-left: 3px solid #00E676
    Border-radius: 12px
    Padding: 16px

    Header row: shield icon 18px #00E676 + "Stay safe" DM Sans 600 15px #00E676
    Instructions list (margin-top 12px, 8px gap between items):
      Each item: 10px bullet dot (--text-secondary) + DM Sans 400 14px --text-primary
      Instruction 1: "Stay calm and stay in your room"
      Instruction 2: "Do not use the elevator"
      Instruction 3: "Place a towel under the door if you smell smoke"
      Instruction 4: "Wait for staff or follow announcement"
      NOTE: These are AI-generated by Gemini based on crisis type — show them dynamically

  Countdown timer (margin-top 28px):
    "Staff responding in:" — DM Sans 400 13px --text-secondary, centered
    "0:47" — JetBrains Mono 700 36px #00E676, centered, live countdown from 60
    When timer reaches 0: text changes to "Call 112 if no one has arrived"

  Emergency button (margin-top 24px):
    "Call 112 — Emergency Services"
    GhostButton style but border color #FF3B3B, label #FF3B3B, icon: phone 18px
    Height: 48px, full width with 20px horizontal padding
    On tap: initiates phone call to 112

  "Report another emergency" — DM Sans 400 14px #3B82F6, centered, margin-top 16px
    On tap: navigates back to SCREEN 04


═══════════════════════════════════
SCREEN 06 — GUEST SAFETY ALERT (RECEIVED)
═══════════════════════════════════
Background: #0A0C10
Shown when staff broadcasts to guests OR guest receives push notification.

Full-width alert bar at very top (below StatusBar, above content):
  Height: 48px
  Background: #FF3B3B (CRITICAL) or #FF8C00 (HIGH)
  LiveDot (white) + "ACTIVE ALERT — FIRE" — DM Sans 700 14px white
  No border-radius (full bleed)

TopAppBar:
  Background: #0A0C10
  Center: "Hotel Alert" — Syne 700 18px

Content (20px horizontal padding, margin-top 20px):
  Crisis header:
    SeverityBadge "CRITICAL" + crisis type "— Fire, 3rd Floor"
    DM Sans 600 16px --text-primary, margin-top 8px
    "Issued 2 minutes ago" — DM Sans 400 13px --text-secondary, margin-top 4px

  Instructions card (margin-top 24px):
    Background: #111318, border-left 3px solid #FF3B3B, border-radius 12px
    Padding: 16px

    "What to do NOW" — DM Sans 700 13px #FF3B3B UPPERCASE, letter-spacing 0.08em
    Numbered list (margin-top 12px, DM Sans 400 15px --text-primary, 12px gap):
      1. Evacuate to ground floor immediately
      2. Use staircase only — NOT the elevator
      3. Assembly point: Front parking lot
      4. Do not collect belongings
      5. Assist others nearby if safe to do so

  "View Exit Map" button — GhostButton, full width, margin-top 20px
    Left icon: map-pin 18px

  "I Am Safe" button — PrimaryButton (background #00E676, label black DM Sans 700)
    Full width, height 52px, margin-top 12px
    On tap: sends safety confirmation to staff dashboard
    POST-TAP STATE: button grays out, "✓ You're marked safe" DM Sans 600 15px #00E676

  Emergency row (margin-top 24px, centered):
    "Emergency services: " DM Sans 400 13px --text-secondary
    "Call 112" DM Sans 600 13px #FF3B3B — tappable


═══════════════════════════════════
SCREEN 07 — STAFF DASHBOARD (MAIN)
═══════════════════════════════════
Background: #0A0C10

StatusBar at top.

Active Incident Banner (conditional — show only if CRITICAL/HIGH active):
  Full width, height 52px, background #FF3B3B
  Left: LiveDot (white) + "ACTIVE: Fire — Floor 3, Room 311" — DM Sans 600 13px white
  Right: "View →" DM Sans 600 12px white, chevron
  Slides down from top on entry (350ms bounce)
  Tap: navigates to incident detail

TopAppBar:
  Left: avatar (32px circle, initials, bg #1E3A5F) + hotel name "Grand Meridian"
  Right: notification bell icon (IconButton), badge count pill on bell (12px red dot with number)

Role pill (below TopAppBar, 20px padding, margin-top 8px):
  Horizontal flex row:
    "Your role:" DM Sans 400 13px --text-secondary
    RoleBadge "SECURITY" — margin-left 8px
    LiveDot #00E676 + "On shift" DM Sans 400 13px #00C9A7 — margin-left auto

Filter row (horizontal scroll, 20px left padding, 8px right, margin-top 16px):
  Pill filter buttons: ALL · CRITICAL · HIGH · MEDIUM · LOW · RESOLVED
  Each pill: height 32px, padding 0 14px, border-radius 8px, DM Sans 500 13px
  Inactive: bg #111318, border 1px solid #2A2D35, label --text-secondary
  Active: bg matches severity color (CRITICAL=#FF3B3B, etc), label white
  ALL active: bg #3B82F6, label white
  No horizontal scrollbar visible

Incident feed (margin-top 16px, 20px horizontal padding, 12px gap between cards):
  Each incident card — see INCIDENT CARD COMPONENT below
  List animates: each card fades in + translateY(8px)→0, staggered 40ms per card
  New cards entering in real-time: slide in from top with 220ms animation

INCIDENT CARD COMPONENT (used in SCREEN 07 and 08):
  Width: 100%
  Background: uses severity bg tint (see severity color system)
  Border: 1px solid #2A2D35, left-border 3px solid [severity color]
  Border-radius: 12px
  Padding: 16px

  Row 1 (flex, space-between):
    LEFT: SeverityBadge + crisis type label DM Sans 600 14px --text-primary
    RIGHT: Incident ID JetBrains Mono 12px --text-secondary

  Row 2 (margin-top 6px):
    Location: map-pin icon 14px --text-secondary + "Floor 3, Room 311" DM Sans 500 14px --text-primary

  Row 3 (margin-top 8px):
    Gemini summary: DM Sans 400 14px --text-secondary, line-clamp 2 lines, line-height 1.5

  Row 4 — Staff instructions chip row (margin-top 10px, horizontal scroll):
    Small chips per role:
      Height: 28px, padding 0 10px, border-radius 6px
      Background: #1A1D24, border 1px solid #2A2D35
      Icon 14px + role name + ": " + action text (truncated)
      DM Sans 400 12px --text-secondary
    Chips scroll horizontally, no scrollbar

  Row 5 (margin-top 12px, border-top 1px solid #1A1D24, padding-top 12px, flex space-between):
    LEFT: responder avatars (stack of 24px circles, -8px overlap) + "2 responding" DM Sans 400 12px --text-secondary
    RIGHT: two buttons side by side:
      "Acknowledge" — height 36px, border-radius 8px, bg #3B82F6, DM Sans 600 13px white, padding 0 14px
      POST-ACKNOWLEDGE: bg #1A3A2A, border 1px solid #00E676, label "✓ Done" DM Sans 600 13px #00E676
      "View →" — GhostButton 36px height, DM Sans 600 13px --text-primary, padding 0 12px

  TIMESTAMP: "3 min ago" — absolute positioned top-right inside card, JetBrains Mono 11px --text-muted

BottomNavBar:
  Items: Feed (active) / Map / Reports / Settings


═══════════════════════════════════
SCREEN 08 — INCIDENT DETAIL (STAFF)
═══════════════════════════════════
Background: #0A0C10
Scrollable content.

TopAppBar:
  Left: back arrow → SCREEN 07
  Center: incident ID "INC-00431" — JetBrains Mono 14px --text-secondary
  Right: share icon (for sending incident link to other staff)

Sticky header below TopAppBar (NOT scrollable — stays fixed while content scrolls):
  Height: 72px, background #0A0C10, border-bottom 1px solid #2A2D35
  Row 1: SeverityBadge "CRITICAL" + crisis name "Fire" DM Sans 700 18px --text-primary
  Row 2 (margin-top 4px): map-pin icon + "Floor 3, Room 311" DM Sans 500 14px --text-secondary + "4 min ago" JetBrains Mono 13px --text-muted (right)

Scrollable content (20px horizontal padding):

  Section 1 — AI Analysis card (margin-top 20px):
    Background: #111318
    Border: 1px solid #2A2D35
    Border-radius: 12px
    Padding: 16px

    Header row:
      Gemini "G" logomark icon 18px (Google colors) + "AI Analysis" DM Sans 600 14px --text-primary
      "94% confidence" JetBrains Mono 12px #00C9A7 — right-aligned

    Confidence bar (margin-top 8px):
      Height: 4px, border-radius 2px
      Track: #2A2D35, Fill: #3B82F6 at 94% width
      Animated fill from 0→94% on mount: 600ms ease-out

    Gemini summary (margin-top 12px):
      DM Sans 400 14px --text-primary, line-height 1.6
      "Guest reported smoke and burning smell near Room 311. Likely source: electrical fault in corridor. Guests on 3rd and 4th floors at elevated risk. Immediate evacuation of affected floors recommended."

    Detected language chip (margin-top 10px):
      "Detected: Hindi → Translated to English" — DM Sans 400 12px --text-muted
      Translation icon 14px, margin-right 4px

  Section 2 — Your Role Instructions (margin-top 20px):
    Section header: "YOUR INSTRUCTIONS" + RoleBadge "SECURITY" inline

    Instructions card:
      Background: rgba(59,130,246,0.06)
      Border: 1px solid rgba(59,130,246,0.2)
      Border-radius: 12px
      Padding: 16px

      Instruction items (14px gap between):
        Each item: horizontal flex, align-start
        Left: checkbox (22×22px, border-radius 6px, unchecked: border 1.5px solid #2A2D35, checked: bg #3B82F6 with white checkmark SVG)
        Right: DM Sans 400 15px --text-primary, line-height 1.5
        CHECKED STATE: text has line-through, opacity 0.5

      Instruction 1: "Proceed to 3rd floor immediately via staircase"
      Instruction 2: "Locate source of smoke — check Room 308 corridor"
      Instruction 3: "Begin evacuation of floors 3 and 4"
      Instruction 4: "Report back to dashboard with findings"

  Section 3 — Quick Actions (margin-top 20px):
    Section header: "QUICK ACTIONS" DM Sans 700 11px UPPERCASE --text-muted

    Action buttons (vertical stack, 10px gap):
      Action 1: "📸 Add Photo Evidence" — GhostButton full width, left-icon camera
      Action 2: "💬 Post Update" — GhostButton full width, left-icon chat
      Action 3: "📢 Broadcast to Guests" — GhostButton full width, left-icon megaphone

    Resolve button (margin-top 8px):
      "✅ Mark as Resolved" — GhostButton full width
      Border color: #00E676, label: #00E676
      Only visible if user is admin role

  Section 4 — Response Log (margin-top 20px):
    Section header: "RESPONSE LOG" + "Live" chip (LiveDot + "Live" DM Sans 500 12px #00E676)

    Timeline (left-border 2px solid #2A2D35, padding-left 20px, position relative):
      Each entry:
        Dot: 10px circle #3B82F6, absolute left -25px, centered vertically
        Top row: staff name DM Sans 600 14px --text-primary + RoleBadge inline
        Action: DM Sans 400 14px --text-secondary, margin-top 2px
        Time: JetBrains Mono 12px --text-muted, margin-top 2px
        Photo thumbnail (if photo): 60×60px, border-radius 8px, margin-top 8px

  Section 5 — Guest Safety Count (margin-top 20px, margin-bottom 40px):
    Card: background #111318, border 1px solid #2A2D35, border-radius 12px, padding 16px
    "GUEST SAFETY STATUS" section header
    "12 of 247 guests confirmed safe" — DM Sans 500 15px --text-primary, margin-top 8px
    Progress bar: height 6px, border-radius 3px, track #2A2D35, fill #00E676
    Fill: 12/247 = ~5% width


═══════════════════════════════════
SCREEN 09 — POST UPDATE / BOTTOM SHEET
═══════════════════════════════════
Triggered when staff taps "Post Update" on SCREEN 08.
Rendered as BottomSheet over SCREEN 08 (backdrop #000 70%).

BottomSheet content (padding 20px):
  Handle bar at top center
  Title: "Post Update" — Syne 700 18px --text-primary, margin-top 8px

  TextArea:
    Placeholder: "What did you find? What action did you take?"
    Height: 120px, margin-top 20px

  Attachment row (margin-top 12px):
    Camera button: 44×44px, bg #111318, border 1px solid #2A2D35, border-radius 10px, camera icon 20px
    "Attach photo" DM Sans 400 13px --text-secondary, margin-left 10px

  PrimaryButton: "Post Update" — full width, margin-top 24px

  GhostButton: "Cancel" — full width, margin-top 10px


═══════════════════════════════════
SCREEN 10 — BROADCAST TO GUESTS
═══════════════════════════════════
Full screen (not bottom sheet — complex enough to warrant full screen).

TopAppBar:
  Left: "Cancel" DM Sans 500 16px #3B82F6 (text button, not icon)
  Center: "Broadcast Alert" Syne 700 18px
  Right: "Send" DM Sans 700 16px #FF3B3B (active only when form valid)

Content (20px horizontal padding, margin-top 24px):
  Who to notify — Section header + options:
    Radio card group (vertical, 10px gap):
      Each option: horizontal flex, align-center, height 52px
      bg #111318, border 1px solid #2A2D35, border-radius 10px, padding 0 16px
      Radio circle left (20px, unchecked: border 2px solid #2A2D35, checked: filled #3B82F6 with white dot center)
      Label DM Sans 500 15px --text-primary
      Sub-label DM Sans 400 13px --text-secondary (right side, muted)

      Option 1: "All hotel guests" — "247 devices"
      Option 2: "Affected floors only" — "Floors 3–4 · 63 devices"
      Option 3: "Custom selection" — "Choose floors"

  Message (section header, margin-top 24px):
    TextArea — pre-filled with Gemini-generated message based on incident
    Label above: "Message (auto-translated to each guest's language)"
    Min-height: 120px

  Language preview (margin-top 16px):
    Section header: "TRANSLATION PREVIEW"
    Two-row preview:
      "Hindi: तीसरी मंज़िल पर आग लगी है..." — DM Sans 400 13px --text-secondary
      "Tamil: மூன்றாம் தளத்தில் தீ..." — DM Sans 400 13px --text-secondary
    "and 8 more languages" — DM Sans 400 13px --text-link, tap to expand

  Recipient count bar (margin-top 24px, fixed to bottom above keyboard):
    Background: #111318, border-top 1px solid #2A2D35, padding 16px 20px
    Left: "Sending to 247 guests" DM Sans 600 15px --text-primary
    Right: DestructiveButton "Send Now" height 44px, border-radius 10px


═══════════════════════════════════
SCREEN 11 — FLOOR MAP
═══════════════════════════════════
Background: #0A0C10

TopAppBar:
  Left: back arrow
  Center: "Floor Map" Syne 700 18px
  Right: floor selector "Floor 3 ▾" — DM Sans 600 14px #3B82F6

Floor selector dropdown (appears when right button tapped):
  BottomSheet style
  List of floors: 1, 2, 3 (current, checkmark), 4, 5... etc
  Each item: 48px height, DM Sans 500 15px --text-primary

Map area:
  Full width, height 420px
  Background: #111318
  Border-radius: 0 (full bleed)
  Hotel floor plan image (grayscale, tinted with #111318 overlay at 40%)
  Incident pins overlaid:
    Active incident: animated red pulse pin (16px red circle + radiating ring animation)
    Label below pin: "Room 311" JetBrains Mono 12px #FF3B3B
  Assembly point pin: green flag icon, "Assembly Pt" label
  Staff location pins: blue avatar circles (24px)

Legend (horizontal scroll row, 20px padding, margin-top 16px):
  Each legend item: colored dot (10px) + DM Sans 400 12px --text-secondary
  Items: Active Incident · Assembly Point · Staff Location · Fire Exit · Elevator

Active incidents on this floor (margin-top 20px, 20px horizontal padding):
  Section header: "ACTIVE ON THIS FLOOR"
  Incident mini-cards (compact version, height 64px):
    Same structure as full incident card but condensed to 2 rows
    Tap: navigate to SCREEN 08


═══════════════════════════════════
SCREEN 12 — INCIDENT HISTORY (REPORTS)
═══════════════════════════════════
Background: #0A0C10

TopAppBar:
  Center: "Incident History" Syne 700 18px
  Right: filter icon (IconButton)

Filter bar (horizontal scroll, 20px left padding, margin-top 8px):
  Same pill filter pattern as SCREEN 07

Search bar (margin-top 12px, 20px padding):
  InputField style, height 44px
  Left icon: search 18px --text-muted
  Placeholder: "Search incidents..."

Grouped list (20px horizontal padding, margin-top 20px):
  Date group headers: "TODAY" / "THIS WEEK" / "LAST MONTH"
    DM Sans 700 11px UPPERCASE --text-muted, letter-spacing 0.1em
    Margin-bottom 8px

  Each incident: compact card (height 80px), 10px gap
    Same structure as incident card but no instruction chips row
    "Resolved in 8 min" — DM Sans 400 13px #00C9A7, bottom-right of card
    "View Report →" — DM Sans 500 13px #3B82F6, inline right

  Empty state (if no results):
    Center of screen (below filter)
    Abstract minimal icon (shield with checkmark) — 64px, --text-muted
    "No incidents found" Syne 500 18px --text-secondary, margin-top 16px
    "All clear. Venue is operating normally." DM Sans 400 14px --text-muted, margin-top 6px


═══════════════════════════════════
SCREEN 13 — ADMIN DASHBOARD
═══════════════════════════════════
Background: #0A0C10

TopAppBar:
  Left: avatar + "Grand Meridian" DM Sans 600 14px --text-primary
  Right: notification bell + settings gear (two IconButtons)

Content (20px horizontal padding):
  Active incident banner: same as SCREEN 07 if critical active

  "Good evening, Dinesh" — Syne 600 20px --text-primary, margin-top 24px
  Date: "Monday, April 27, 2026" — DM Sans 400 13px --text-secondary, margin-top 4px

  STAT CARDS ROW (horizontal scroll OR 2×2 grid if 4 stats):
    Each stat card: width calc(50% - 6px) for 2-column grid
    Background: #111318, border 1px solid #2A2D35, border-radius 12px, padding 16px
    Number: Syne 700 28px --text-primary
    Label: DM Sans 400 12px --text-secondary, margin-top 4px
    Trend: DM Sans 500 12px (#00E676 for positive, #FF3B3B for negative), margin-top 8px

    Stat 1: "47" / "Total Incidents" / "↑ 12% this week"
    Stat 2: "1m 42s" / "Avg Response" / "↓ 34% faster"
    Stat 3: "6" / "Critical" / last 30 days (no trend — just muted)
    Stat 4: "94%" / "Resolved" / "2 pending"

  Staff on shift (margin-top 24px):
    Section header: "STAFF ON SHIFT" + count "6 active" chip (bg rgba(0,201,167,0.1), #00C9A7)

    Horizontal scroll of staff avatars:
      Each: 44px circle + name below DM Sans 400 11px --text-secondary + role dot (color coded)
      Green ring: acknowledged recent alert
      Red ring: critical alert unacknowledged >2min
      Gray ring: off shift

  Recent incidents (margin-top 24px):
    Section header: "RECENT" + "View all →" DM Sans 500 13px #3B82F6 right-aligned
    Last 3 incident cards (compact version)

BottomNavBar:
  Items: Dashboard / Map / Analytics / Settings


═══════════════════════════════════
SCREEN 14 — ADMIN ANALYTICS
═══════════════════════════════════
Background: #0A0C10

TopAppBar:
  Center: "Analytics" Syne 700 18px
  Right: date range picker "Apr 2026 ▾" DM Sans 600 13px #3B82F6

Content (20px horizontal padding, scrollable):
  KPI row (2×2 grid, same stat card components, margin-top 20px)

  Incident types chart (margin-top 24px):
    Section header: "BY TYPE"
    Horizontal bar chart:
      Each bar: label left (DM Sans 500 14px --text-primary), bar (height 8px, border-radius 4px, colored by type), percentage right (JetBrains Mono 13px --text-secondary)
      Bar container bg: #1A1D24
      Bar fill: severity/type color
      Bars animate width 0→value on mount: 600ms staggered

    Types:
      Fire:     ████████░░  32%  #FF3B3B
      Medical:  ███████░░░  28%  #F5A623
      Security: █████░░░░░  18%  #FF8C00
      Power:    ████░░░░░░  14%  #3B82F6
      Other:    ██░░░░░░░░   8%  #00C9A7

  Peak hours (margin-top 24px):
    Section header: "PEAK HOURS"
    Micro bar chart — 24 bars (one per hour):
      Bar width: calc((100%-23*4px)/24)
      Color intensity: higher count = brighter, lower = dim
      Hover/tap on bar: tooltip with count

  Response time trend (margin-top 24px):
    Section header: "RESPONSE TIME"
    Simple line chart — sparkline style
    Two lines: This week (solid #3B82F6), Last week (dashed #2A2D35)
    X-axis: Mon Tue Wed Thu Fri Sat Sun — DM Sans 400 11px --text-muted

  Download report button (margin-top 32px, margin-bottom 40px):
    GhostButton: "Download Monthly PDF Report" — full width
    Left icon: document-arrow-down 18px


═══════════════════════════════════
SCREEN 15 — SETTINGS / PROFILE (STAFF)
═══════════════════════════════════
Background: #0A0C10

TopAppBar:
  Center: "Settings" Syne 700 18px

Content (20px horizontal padding):
  Profile section (margin-top 20px):
    Avatar: 72px circle, bg #1E3A5F, initials "DK" Syne 700 24px #3B82F6
    Name: "Bingi Dinesh Kumar" Syne 600 18px --text-primary, margin-top 12px, centered
    Role badge + hotel name, centered, margin-top 6px
    "Edit Profile →" DM Sans 500 14px #3B82F6, centered, margin-top 8px

  Shift card (margin-top 24px):
    Background: rgba(0,201,167,0.07), border 1px solid rgba(0,201,167,0.2), border-radius 12px, padding 16px
    Row: LiveDot #00E676 + "On Shift" DM Sans 600 15px #00E676
    "Since 9:00 PM · 4h 32m" DM Sans 400 13px --text-secondary, margin-top 4px
    "End Shift" GhostButton, height 36px, border-color #FF3B3B, label #FF3B3B, right-aligned

  Settings sections (margin-top 24px):
    Each section has a section header label then rows

    NOTIFICATIONS section:
      Toggle row component:
        Height: 52px, horizontal flex space-between, align-center
        Label: DM Sans 500 15px --text-primary
        Sub-label (optional): DM Sans 400 12px --text-secondary
        Right: iOS-style toggle (44×24px, track bg: off=#2A2D35 / on=#3B82F6, thumb white 20px circle)
        Border-bottom: 1px solid #1A1D24 (last row has none)

      Row 1: "Critical Alerts" / "Cannot be disabled" sub-label / Toggle LOCKED ON (gray, not interactive)
      Row 2: "High Alerts" / toggle ON by default
      Row 3: "Medium Alerts" / toggle OFF by default
      Row 4: "Low Alerts" / toggle OFF by default

    EMERGENCY CONTACTS section:
      Contact rows: icon + name + number, chevron right, tap to call
      Row 1: phone icon + "Police" + "100"
      Row 2: fire icon + "Fire Service" + "101"
      Row 3: medical icon + "Ambulance" + "102"
      Row 4: building icon + "Hotel Front Desk" + "022-XXXX-XXXX"

    ACCOUNT section:
      Row: "Language" / "English" right label + chevron
      Row: "Notifications" / "Push + Sound" + chevron
      Row: "Privacy Policy" + chevron
      Row: "App Version" / "v1.0.0" right label (no chevron)

  Sign Out button (margin-top 32px, margin-bottom 40px):
    GhostButton full width, border #FF3B3B, label "Sign Out" #FF3B3B
    On tap: confirmation dialog, then navigate to SCREEN 02

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — PLAY STORE COMPLIANCE REQUIREMENTS
Apply these to every screen without exception.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOUCH TARGETS:
  Every tappable element minimum 44×44px
  Buttons: minimum 44px height (primary: 52px, critical: 56px)
  List items: minimum 48px height
  Icon buttons: 40×40px visible + 44×44px actual tap target (padding around icon)
  Bottom nav items: full height × 25% width each

ACCESSIBILITY:
  All text meets WCAG AA contrast minimum:
    --text-primary #F4F6FA on #0A0C10: contrast ratio ~17:1 ✓
    --text-secondary #8A8FA8 on #0A0C10: contrast ratio ~4.6:1 ✓
    Badge text white on #FF3B3B: contrast ratio ~4.2:1 ✓
  All interactive elements have accessible labels (aria-label)
  All images have alt text
  Focus states visible (2px #3B82F6 outline)

TYPOGRAPHY MINIMUMS:
  No text below 11px (micro labels only — not body copy)
  Body text minimum 14px
  No line-length above 70 characters (handled by 20px horizontal padding)

SPACING MINIMUMS:
  No interactive elements within 8px of screen edge (use 20px padding)
  No content within StatusBar area (44px top)
  No content within safe area bottom (34px)

SCROLL BEHAVIOR:
  All lists: momentum scroll (scroll-behavior: smooth)
  Overscroll: rubber-band effect
  No horizontal scroll for main content (horizontal scroll only for explicit chip rows)
  Pull-to-refresh on: incident feed (SCREEN 07), analytics (SCREEN 14)

LOADING STATES:
  Every async operation shows a loading state — NO blank screens
  Skeleton loaders for lists (gray shimmer rectangles matching card layout)
  Spinner in buttons during form submission
  Skeleton: bg #111318, shimmer: linear-gradient moving left→right, 1.5s loop

EMPTY STATES:
  Every list screen has an empty state
  Layout: centered, abstract minimal icon (64px) + heading (Syne 500 18px) + sub-text (DM Sans 400 14px)
  SCREEN 07 empty: "No Active Incidents" + shield-check icon + "All clear. Venue is safe."
  SCREEN 12 empty: "No incidents found" + filter suggestion

ERROR STATES:
  Network error: bottom toast, red icon, "Connection error. Retry?" with retry button
  Auth error: inline below form field, red text
  Submit failure: replace button with error message + retry option, never blank screen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — NAVIGATION ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GUEST FLOW (linear, no bottom nav):
  SCREEN 01 (Splash) → SCREEN 02 (Role Select) → SCREEN 04 (Report)
  → SCREEN 05 (Sent) → SCREEN 06 (Safety Alert, if broadcast received)

STAFF FLOW (bottom nav after login):
  SCREEN 01 → SCREEN 02 → SCREEN 03 (Login) → SCREEN 07 (Dashboard)
  SCREEN 07 → SCREEN 08 (Incident Detail) → SCREEN 09 (Post Update, sheet)
  SCREEN 07 → SCREEN 10 (Broadcast)
  Bottom nav: SCREEN 07 / SCREEN 11 (Map) / SCREEN 12 (History) / SCREEN 15 (Settings)

ADMIN FLOW (bottom nav after login):
  Same as staff + access to:
  SCREEN 13 (Admin Dashboard) → SCREEN 14 (Analytics)
  Admin sees "Mark Resolved" on SCREEN 08

TRANSITIONS:
  Push (→): new screen slides in from right, 300ms
  Modal (sheet): slides up from bottom, 300ms
  Dismiss modal: slides down, 220ms
  Replace (tab switch): crossfade, 200ms, no slide
  Alert banner: slides down from top, 350ms with bounce

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — WHAT NOT TO DO (Anti-patterns to avoid)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT use Inter, Roboto, or system-ui fonts — use only Syne, DM Sans, JetBrains Mono
DO NOT use border-radius above 12px on cards or 10px on buttons
DO NOT use box-shadow for elevation on dark backgrounds — use border + bg color
DO NOT use purple, teal, or gradient backgrounds as the main theme color
DO NOT use more than 3 font sizes on a single screen
DO NOT stack more than 3 different font weights on a single screen
DO NOT use full-bleed images without dark overlay
DO NOT use horizontal padding less than 20px on any content
DO NOT use text smaller than 11px anywhere in the app
DO NOT use icons without a label on any bottom navigation item
DO NOT add decorative elements that have no functional purpose
DO NOT place any interactive element within 8px of another interactive element
DO NOT use white or light backgrounds — this is a dark-theme-only app
DO NOT use more than 2 primary actions on any single screen
```

---

## HOW TO USE THIS PROMPT

1. Copy everything inside the triple backtick block above.
2. Paste it into your agent (Cursor, Claude Code, v0, etc.) as the first message.
3. Then say: "Build SCREEN 01 first, then confirm before moving to the next."
4. Review each screen before moving on. Do not let the agent build all 15 screens at once.
5. After each screen, check: typography sizes, spacing, touch target sizes, and color values against this document.

## SCREEN BUILD ORDER (follow this sequence)

Build in this order to avoid dependency issues:

1. Design System tokens (CSS variables, fonts) — no UI yet
2. Component Library (all components from Section 2) — no screens yet
3. SCREEN 01 Splash
4. SCREEN 02 Role Select
5. SCREEN 03 Login
6. SCREEN 04 Guest Report (most important — get this perfect before moving on)
7. SCREEN 05 Report Sent
8. SCREEN 07 Staff Dashboard
9. SCREEN 08 Incident Detail
10. SCREEN 06 Guest Safety Alert
11. SCREEN 09 Post Update (bottom sheet)
12. SCREEN 10 Broadcast
13. SCREEN 11 Floor Map
14. SCREEN 12 Incident History
15. SCREEN 13 Admin Dashboard
16. SCREEN 14 Analytics
17. SCREEN 15 Settings
