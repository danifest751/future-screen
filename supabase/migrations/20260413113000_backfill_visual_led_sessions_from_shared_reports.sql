-- Backfill legacy shared reports into visual_led_sessions / visual_led_events
-- so they become visible in the admin visualizations feed.

with shared_urls as (
  select
    sr.slug,
    sr.created_at,
    'https://future-screen.vercel.app/reports/' || sr.slug as url_vercel,
    'https://future-screen.ru/reports/' || sr.slug as url_ru
  from public.shared_reports sr
),
missing_reports as (
  select su.*
  from shared_urls su
  where not exists (
    select 1
    from public.visual_led_events e
    where e.event_type = 'report_shared'
      and (
        e.payload ->> 'url' = su.url_vercel
        or e.payload ->> 'url' = su.url_ru
      )
  )
),
upsert_sessions as (
  insert into public.visual_led_sessions (
    session_key,
    started_at,
    ended_at,
    duration_sec,
    page_url,
    is_admin,
    summary,
    utm,
    viewport,
    screen,
    device
  )
  select
    'legacy-report-' || mr.slug as session_key,
    mr.created_at,
    mr.created_at,
    0,
    'https://future-screen.vercel.app/visual-led',
    false,
    jsonb_build_object(
      'report_url', mr.url_vercel,
      'source', 'legacy-shared-report-backfill'
    ),
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  from missing_reports mr
  on conflict (session_key) do update
    set summary = coalesce(public.visual_led_sessions.summary, '{}'::jsonb) || jsonb_build_object(
      'report_url', excluded.summary ->> 'report_url',
      'source', 'legacy-shared-report-backfill'
    )
  returning id, session_key
)
insert into public.visual_led_events (
  session_id,
  ts,
  event_type,
  scene_id,
  screen_id,
  payload
)
select
  s.id,
  mr.created_at,
  'report_shared',
  null,
  null,
  jsonb_build_object(
    'status', 'success',
    'url', mr.url_vercel,
    'source', 'legacy-shared-report-backfill'
  )
from missing_reports mr
join public.visual_led_sessions s
  on s.session_key = 'legacy-report-' || mr.slug
where not exists (
  select 1
  from public.visual_led_events e
  where e.session_id = s.id
    and e.event_type = 'report_shared'
    and e.payload ->> 'url' = mr.url_vercel
);
