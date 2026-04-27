# Lessons

- For Cloud Run frontend deploys, verify both build-time and runtime environment requirements. `NEXT_PUBLIC_*` values used by prerendered client pages must be present during `next build`, not only as Cloud Run runtime env vars.
- When a long-running deploy stalls or fails, inspect Cloud Build logs immediately and report the exact failing build step before continuing. That shortens the fix loop and keeps status updates concrete.
- When a frontend API route wraps an AI backend, measure real end-to-end latency before setting abort timeouts. A short timeout can silently replace valid AI analysis with fallback content and distort the user-visible incident record.
- Never feed UI hint text like `Panic type hint: security` into the same fallback classifier path used for the real guest report. If AI falls back, classify from the raw report text plus a separate optional hint so the hint does not falsely raise severity.
- For `gcloud run deploy` and `gcloud run services update`, verify Cloud Run env vars after deployment. PowerShell argument formatting can collapse multiple env assignments into one malformed value and disable live AI initialization.
