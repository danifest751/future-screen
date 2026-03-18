# Deploy Checklist

## Test Status

- `npm test` — passed
- `npm run test:e2e` — passed
- `npm run test:all` — passed

## E2E Coverage

- Public routes app-shell availability
- Admin routes app-shell availability
- Home/admin smoke checks
- Client bundle availability on home page

## Database (Supabase)

Project: `pyframwlnqrzeynqcvle`

Applied migrations:

- `harden_public_rls_and_cleanup_indexes_v2`
- `optimize_rls_policies_for_performance`

Done:

- Enabled RLS for public tables (`cases`, `categories`, `contacts`, `packages`, `test`)
- Normalized `leads` policies
- Added FK helper index on `file_materials(file_id)`
- Removed duplicate indexes (`idx_cases_slug`, `idx_leads_created`)

Advisors after fixes:

- No critical RLS exposure errors on public content tables
- Remaining warnings are non-blocking (auth leaked-password protection, mostly unused indexes)

## Release Gate

- [x] Tests green
- [x] E2E green
- [x] DB hardening applied
- [x] Ready to deploy
