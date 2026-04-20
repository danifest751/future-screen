# Wave 0: Safe Status and Next Plan (2026-04-20)

This document is a factual checkpoint before the next hardening wave.
It is intentionally conservative: we only mark an item as "done" if it is
confirmed in current code/migrations, otherwise it remains "open/verify".

## 1) Confirmed done in repository

- C1: telegram webhook admin guard and strict webhook secret checks.
- C2: role source switched to trusted `app_metadata` in client logic.
- C3: admin routes enforce `requiredRole="admin"`.
- C6/C7: `site_settings` reconcile migration exists; legacy hook removed.
- C8: shared report sanitization uses server-side DOMPurify + sandbox CSP.
- C9/C10: header CSP cleanup and extra hardening directives are present.
- H2: request form analytics no longer sends direct PII fields.
- H3: rate limiting moved from in-memory map to shared Upstash limiter.
- H4: no anon fallback for service-role paths in critical APIs.
- H8/H9/H10/H11/H12: implemented in codebase.

## 2) Open or needs production verification

- C4/C5: final confirmation in production DB required (policies + runtime path).
- H1: `useStarBorderGlobal` still uses broad `MutationObserver` without throttle.
- H5: `api/visual-led/analyze.ts` still allows reflected origin, no dedicated limit.
- H7: `shared_reports` has no explicit TTL/retention mechanism.
- H13: direct DOM usage still present in multiple components/hooks.
- H15: reproducibility gap risk for some app-used tables not present as
  explicit `supabase/migrations` create scripts.
- H16: pre-commit checks exist, but no standard PR CI workflow
  (`lint + test + build`) yet.

## 3) Wave 0 execution goal

Do **read-only** drift diagnostics first, then choose next implementation wave.

- SQL entrypoint: [sql/011_wave0_readonly_drift_checks.sql](C:/Projects/future-screen/sql/011_wave0_readonly_drift_checks.sql)
- This script is SELECT-only and safe to run on production.
- Output should be attached to the task before any schema-changing PR.

## 4) Updated safe rollout order

1. Wave 0 (current): run read-only DB checks and confirm actual production state.
2. Wave 1: low-risk sync PR for stale SQL/docs consistency only.
3. Wave 2: H5 hardening (`visual-led/analyze`) in an isolated PR.
4. Wave 3: H1 performance hardening (`useStarBorderGlobal`) in isolated PR.
5. Wave 4: H7 retention strategy for `shared_reports` (no new paid infra).
6. Wave 5: H15/H16 infrastructure reliability (missing migrations + PR CI).

## 5) Go/No-Go gate for next wave

Proceed beyond Wave 0 only if:

- `public.current_user_role()` exists and uses `app_metadata`;
- legacy permissive leads/site policies are absent in production;
- canonical `site_settings.id='default'` exists (no active `global`);
- RLS is enabled on core tables listed in the SQL report.

If any gate fails, first fix drift with a minimal dedicated PR/migration.
