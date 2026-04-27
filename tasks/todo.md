# CrisisSync Audit and Stabilization

## Plan

- [x] Document current product concept, implemented flows, and architecture status.
- [x] Audit frontend routes and shared components for responsive layout and structural issues.
- [x] Audit backend routes, Gemini integration, Firebase integration, and deployment readiness.
- [x] Run validation: lint, Next.js build, backend tests, and frontend e2e where feasible.
- [x] Fix frontend issues across landing, login, report, dashboard, admin, and incident flows.
- [x] Fix backend/runtime issues blocking local operation or Cloud Run deployment.
- [x] Re-run validation and capture residual risks.
- [ ] Commit, push, and deploy only if verification is clean and credentials/tooling are available.

## Review

- Product concept confirmed: CrisisSync is a hotel crisis coordination system with guest/staff reporting, AI crisis classification, RTDB live alerting, Firestore history, operational dashboards, tactical map, and incident response workflows.
- Implemented surfaces reviewed: landing, login, register, report, dashboard, admin analytics, map, logs, status, personnel, settings, and incident response detail.
- Frontend corrections completed: report form was rebuilt for responsive structure, login flow was tightened for E2E and accessibility, theme hydration mismatch was removed, map/card/status/dashboard pages were cleaned up to satisfy React and TypeScript constraints.
- Backend corrections completed: classification route nullability hardened, Firebase admin typing cleaned up, backend pytest flow repaired to run without async plugin assumptions.
- Verified locally: `npm run lint`, `npm run build`, `python -m pytest backend/tests -q`, and `npm run test:e2e` all pass.
- Deployment blockers found: local git remote is unset, `gh` CLI is unavailable, active `gcloud` project is `secrets-467623` while app config points to `fir-project-f09ad`, and current `firebase.json` hosting config is not valid for a production Next.js deployment.
