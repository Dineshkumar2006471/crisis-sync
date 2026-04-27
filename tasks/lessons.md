# Lessons

- For Cloud Run frontend deploys, verify both build-time and runtime environment requirements. `NEXT_PUBLIC_*` values used by prerendered client pages must be present during `next build`, not only as Cloud Run runtime env vars.
- When a long-running deploy stalls or fails, inspect Cloud Build logs immediately and report the exact failing build step before continuing. That shortens the fix loop and keeps status updates concrete.
