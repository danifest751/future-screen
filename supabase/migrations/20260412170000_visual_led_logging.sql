create extension if not exists pgcrypto;

create table if not exists public.visual_led_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key text not null unique,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  duration_sec integer null,
  page_url text null,
  referrer text null,
  utm jsonb not null default '{}'::jsonb,
  is_admin boolean not null default false,
  admin_user_id uuid null,
  client_ip text null,
  user_agent text null,
  accept_language text null,
  timezone text null,
  viewport jsonb not null default '{}'::jsonb,
  screen jsonb not null default '{}'::jsonb,
  device jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visual_led_sessions_started_at_idx
  on public.visual_led_sessions (started_at desc);

create table if not exists public.visual_led_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.visual_led_sessions(id) on delete cascade,
  ts timestamptz not null default now(),
  event_type text not null,
  scene_id text null,
  screen_id text null,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists visual_led_events_session_ts_idx
  on public.visual_led_events (session_id, ts desc);

create index if not exists visual_led_events_type_idx
  on public.visual_led_events (event_type);

create table if not exists public.visual_led_assets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.visual_led_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  asset_type text not null,
  file_name text not null,
  mime_type text null,
  size_bytes bigint null,
  storage_bucket text not null,
  storage_path text not null,
  public_url text null,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists visual_led_assets_session_idx
  on public.visual_led_assets (session_id, created_at desc);

create unique index if not exists visual_led_assets_storage_path_uidx
  on public.visual_led_assets (storage_bucket, storage_path);

create or replace function public.touch_visual_led_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_visual_led_sessions_updated_at on public.visual_led_sessions;

create trigger trg_visual_led_sessions_updated_at
before update on public.visual_led_sessions
for each row
execute function public.touch_visual_led_sessions_updated_at();

insert into storage.buckets (id, name, public)
values ('visual-led-backgrounds', 'visual-led-backgrounds', false)
on conflict (id) do nothing;

alter table public.visual_led_sessions enable row level security;
alter table public.visual_led_events enable row level security;
alter table public.visual_led_assets enable row level security;
