create table if not exists public.shared_reports (
  slug text primary key,
  html text not null,
  created_at timestamptz not null default now()
);

create index if not exists shared_reports_created_at_idx
  on public.shared_reports (created_at desc);

alter table public.shared_reports enable row level security;
