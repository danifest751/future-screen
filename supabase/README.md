# Supabase

Everything database-related lives here.

## Layout

```
supabase/
├── migrations/   canonical schema — run via Supabase CLI
└── legacy/       historical manual scripts kept for reference
```

### `migrations/`

Canonical DB schema. Files use the Supabase CLI format
`YYYYMMDDHHMMSS_<slug>.sql` and are applied in timestamp order.

Apply locally or to a remote project:

```bash
supabase db push                       # apply pending migrations to linked project
supabase migration up                  # apply to the local dev DB
supabase migration new <slug>          # scaffold a new migration
```

After changing schema through the dashboard, run
`npm run gen:types` to refresh `src/types/supabase.ts`.

### `legacy/`

Manual SQL scripts that predate the `supabase/migrations/` convention.
They document *how production got to its current shape* and are useful
when bootstrapping a fresh DB or auditing historical changes, but they
are **not** run by the CLI and should not be used as the source of truth
for new environments — use `migrations/` for that.

Do not add new files here. New changes go through `migrations/`.
