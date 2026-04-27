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
- Git publishing completed: remote `origin` now points to `https://github.com/Dineshkumar2006471/crisis-sync.git`, branch `main` was pushed, and the latest pushed commit is `434d178`.
- Cloud Run deployment remains blocked by IAM on the GCP project default build service account. `gcloud run deploy` reached the build step after enabling required APIs, then failed with `PERMISSION_DENIED` for `617654374792-compute@developer.gserviceaccount.com`.
- Additional deployment risk remains in `firebase.json`: the current hosting config rewrites everything to `/index.html` under `.next`, which is not a valid production deployment shape for a Next.js App Router app.
