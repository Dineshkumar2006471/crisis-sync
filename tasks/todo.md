# Layout + Classify Flow Stabilization (2026-04-28)

## Plan

- [x] Restart backend/frontend services cleanly and verify both endpoints are live.
- [x] Eliminate nested dashboard shell causing double-scroll and structural misalignment.
- [x] Redesign landing hero to normal viewport height with compact spacing, visible title/tagline, and primary CTAs placed correctly in the first section.
- [x] Fix incident classify flow so report submissions complete reliably instead of hanging.
- [x] Validate with live `/api/classify` submission and capture review notes.

## Review

- Restarted both servers and confirmed they are live on `http://127.0.0.1:3000` and `http://127.0.0.1:8000`.
- Simplified `app/dashboard/layout.tsx` to return children directly, removing the duplicate app shell that was creating conflicting full-height wrappers and overflow behavior.
- Rebuilt `app/page.tsx` into a compact landing structure with controlled hero height (`min-h-[72vh]`), reduced section count, tighter spacing, a clear single-line uppercase pricing slogan, and both CTAs in the first hero image section.
- Hardened backend model initialization in `backend/services/gemini_service.py` so Vertex init failures now auto-fallback to Gemini API key mode.
- Reduced server-side classify timeout in `app/api/classify/route.ts` from 90s to 20s so requests fail fast to local fallback instead of appearing stuck.
- Live verification: POST to `/api/classify` returned `success: true`, with both `write_status.rtdb = ok` and `write_status.firestore = ok`.

---
# Landing + Login Simplification (2026-04-27)

## Plan

- [x] Replace landing page with simple scrolling storytelling layout per user spec.
- [x] Redesign login page to a minimal, readable style with reduced typography scale.
- [x] Verify locally by running Next.js and checking `/login` renders.

## Review

- Landing page now uses a simple top navbar, single-line normal-size header, two main CTA buttons, 100px spacing blocks, a 300px full-width hero image, and horizontally scrollable storytelling taglines below.
- Login page now uses a clean minimal card with reduced typography scale while preserving authentication behavior, password reset, and registration link flows.
- Local verification: Next.js dev server already active on `http://localhost:3000`; `/login` responded with HTTP `200`.

---

# Landing Full-Width + Motion Story Cards (2026-04-27)

## Plan

- [x] Remove constrained container width and make landing sections span full screen width while keeping centered content alignment.
- [x] Replace current hero image with a concept-focused CrisisSync visual asset.
- [x] Build motion-based horizontal scrolling feature cards with related images, gradient overlays, and storytelling copy.
- [x] Run lint and verify the updated home page loads locally.

## Review

- Home layout now uses full-width sections (no centered max-width container cap causing 10% side margins).
- Hero image replaced with a new concept-specific asset at `/public/images/crisis-sync-concept-hero.svg`.
- Added motion-based horizontal storytelling cards with crisis-sync feature narratives, gradient image overlays, and auto-scrolling animation (`story-rail` / `story-scroll`).
- Added related concept images for each story card at `/public/images/story-detect.svg`, `/public/images/story-classify.svg`, `/public/images/story-dispatch.svg`, and `/public/images/story-resolve.svg`.
- Verification: `npm run lint` passed; local home route check returned HTTP `200` from `http://localhost:3000/`.

---

# Landing Simplification + New Generated Story Images (2026-04-27)

## Plan

- [x] Simplify landing page to a normal generic layout and remove the current hero image section.
- [x] Generate new storytelling images via `imagegen` and store them under `/public/images`.
- [x] Replace existing story card images with generated ones and keep horizontal motion scrolling.
- [x] Run lint and verify local home page response.

## Review

- Home page simplified to a normal generic landing style with simple heading, supporting text, and two buttons; the standalone hero image section was removed.
- Used `imagegen` skill (built-in tool mode) to generate 4 new story images and copied them into the project:
  - `/public/images/story-generated-intake.png`
  - `/public/images/story-generated-classify.png`
  - `/public/images/story-generated-dispatch.png`
  - `/public/images/story-generated-resolve.png`
- Existing story cards now use the newly generated images with gradient overlays and horizontal motion scrolling.
- Removed previously added SVG concept images that are no longer used.
- Verification: `npm run lint` passed and local home route returned HTTP `200` at `http://localhost:3000/`.

---

# Landing Desktop Two-Screen Split (2026-04-28)

## Plan

- [x] Extract operator login UI/logic into a reusable component so all fields/actions can appear on both `/` and `/login`.
- [x] Redesign desktop landing page into two side-by-side panels with branding/tagline on the left and full login panel on the right.
- [x] Add a second left-panel CTA button that expands to fill remaining panel height under the primary report action.
- [x] Verify with lint and route response checks, then document results.

## Review

- Home page now renders as a desktop two-panel split: left panel for logo/title + single uppercase tagline (20px) + report action, and right panel for full operator login fields/actions.
- Added a second CTA under Report Incident that fills the remaining left-panel height (h-full) to satisfy the full-height button requirement.
- Extracted login behavior into components/OperatorLoginPanel.tsx and reused it in both / and /login, preserving auth, reset-password, and registration-link flows.
- Verification: `npm run lint` passed; `http://localhost:3000/` returned HTTP `200`.

---

# Landing Desktop Editorial Redesign (2026-04-28)

## Plan

- [ ] Replace current home layout with a product-grade desktop editorial hero focused on typography and visual hierarchy.
- [ ] Keep exactly two desktop CTAs (`Report Incident`, `Operator Login`) with clearer iconography and spacing.
- [ ] Integrate concept-accurate real incident imagery from existing project assets with stable aspect-ratio wrappers and readability overlays.
- [ ] Preserve mobile fallback layout without introducing desktop visual complexity on small screens.
- [ ] Run `npm run lint` and `npm run build`, then validate local route response and document review notes.
- [x] Replace current home layout with a product-grade desktop editorial hero focused on typography and visual hierarchy.
- [x] Keep exactly two desktop CTAs (`Report Incident`, `Operator Login`) with clearer iconography and spacing.
- [x] Integrate concept-accurate real incident imagery from existing project assets with stable aspect-ratio wrappers and readability overlays.
- [x] Preserve mobile fallback layout without introducing desktop visual complexity on small screens.
- [x] Run `npm run lint` and `npm run build`, then validate local route response and document review notes.

## Review

- Desktop home route is now a full editorial split-screen composition with stronger typographic hierarchy, monochrome high-contrast surfaces, and a dedicated visual column using concept-aligned incident imagery.
- CTA structure is constrained to the two requested actions only: `Report Incident` and `Operator Login`, both with explicit emergency/operator icons.
- Added stable image containers with overlay gradients and sharp-border treatment to avoid layout shifts and maintain readability.
- Mobile remains intentionally simpler while preserving the same two-action workflow.
- Verification passed: `npm run lint`, `npm run build`, and local route probe (`http://localhost:3000` => `200`).


---

# Landing Full-Screen Normal Typography Refresh (2026-04-28)

## Plan

- [x] Replace split-screen home layout with a full-width, single-flow structure.
- [x] Use normal typography styling while keeping primary story copy in uppercase text.
- [x] Rework sections for clearer storytelling: headline, narrative steps, and primary actions.
- [x] Run lint and verify the home route response.

## Review

- Removed the split-screen desktop structure from the main landing page and replaced it with a single full-width narrative layout.
- Switched to normal, clean typography styling (no stylized/tactical type treatment) while keeping key story text in uppercase as requested.
- Reorganized content into clear sections: platform headline, concise mission copy, primary actions, and four structured storytelling steps.
- Verification: 
pm run lint passed and http://localhost:3000/ returned HTTP 200.


