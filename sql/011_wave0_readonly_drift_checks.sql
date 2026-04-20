-- Wave 0: read-only production drift checks (safe).
-- Purpose:
-- 1) verify that critical hardening migrations are effectively applied;
-- 2) detect DB drift before any next security wave;
-- 3) produce facts for go/no-go decisions.
--
-- Safety:
-- - this script is SELECT-only;
-- - no DDL, no DML, no transaction locks that change data.

-- ============================================================
-- 0) Environment quick info
-- ============================================================
select
  now() as checked_at_utc,
  current_database() as db_name,
  current_user as db_user,
  version() as pg_version;

-- ============================================================
-- 1) Migration registry visibility
-- ============================================================
select to_regclass('supabase_migrations.schema_migrations') as migration_table;

-- If the table exists, inspect structure first:
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'supabase_migrations'
  and table_name = 'schema_migrations'
order by ordinal_position;

-- If available, inspect recent rows (generic, no column-name assumptions):
select *
from supabase_migrations.schema_migrations
order by 1 desc
limit 50;

-- ============================================================
-- 2) Core table existence checks
-- ============================================================
with expected(table_name) as (
  values
    ('site_settings'),
    ('site_content'),
    ('leads'),
    ('shared_reports'),
    ('visual_led_projects'),
    ('visual_led_sessions'),
    ('visual_led_events'),
    ('visual_led_assets'),
    ('cases'),
    ('categories'),
    ('packages'),
    ('contacts'),
    ('media_items'),
    ('case_media_links'),
    ('telegram_sessions'),
    ('telegram_processed_messages')
)
select
  table_name,
  (to_regclass('public.' || table_name) is not null) as exists_in_public
from expected
order by table_name;

-- ============================================================
-- 3) Critical columns and canonical rows
-- ============================================================
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'site_settings' and column_name in ('id', 'background', 'background_settings', 'star_border_settings', 'updated_at'))
    or
    (table_name = 'leads' and column_name in ('id', 'status', 'deleted_at', 'created_at'))
  )
order by table_name, column_name;

select
  id,
  updated_at,
  (star_border_settings is not null) as has_star_border_settings
from public.site_settings
where id in ('default', 'global')
order by id;

-- ============================================================
-- 4) Function sanity: current_user_role()
-- ============================================================
-- If this fails with "does not exist", function is missing.
select pg_get_functiondef('public.current_user_role()'::regprocedure) as current_user_role_ddl;

select
  position('app_metadata' in lower(pg_get_functiondef('public.current_user_role()'::regprocedure))) > 0 as uses_app_metadata,
  position('user_metadata' in lower(pg_get_functiondef('public.current_user_role()'::regprocedure))) > 0 as still_mentions_user_metadata;

-- ============================================================
-- 5) RLS enabled on critical tables
-- ============================================================
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'site_settings',
    'site_content',
    'leads',
    'shared_reports',
    'visual_led_projects',
    'visual_led_sessions',
    'visual_led_events',
    'visual_led_assets'
  )
order by c.relname;

-- ============================================================
-- 6) Policy inventory (actual source of truth)
-- ============================================================
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'site_settings',
    'site_content',
    'leads',
    'shared_reports',
    'visual_led_projects',
    'visual_led_sessions',
    'visual_led_events',
    'visual_led_assets'
  )
order by tablename, policyname;

-- Legacy policy names that should generally be absent after hardening.
select
  tablename,
  policyname
from pg_policies
where schemaname = 'public'
  and policyname in (
    'Allow anonymous inserts',
    'Allow authenticated full access',
    'Allow authenticated users to read site_content',
    'Allow admins to update site_content',
    'Allow admins to insert site_content',
    'Allow authenticated users to read site_settings',
    'Allow admins to update site_settings',
    'Allow admins to insert site_settings'
  )
order by tablename, policyname;

-- Detect any remaining policy expressions referencing user_metadata.
select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%user_metadata%'
order by tablename, policyname;

-- ============================================================
-- 7) Leads hardening checks
-- ============================================================
select
  count(*) as total_leads,
  count(*) filter (where deleted_at is null) as live_leads,
  count(*) filter (where deleted_at is not null) as soft_deleted_leads
from public.leads;

-- ============================================================
-- 8) Shared reports retention pressure checks (H7 context)
-- ============================================================
select
  count(*) as reports_total,
  min(created_at) as oldest_report,
  max(created_at) as newest_report,
  coalesce(sum(length(html)::bigint), 0) as html_bytes_total,
  pg_size_pretty(coalesce(sum(length(html)::bigint), 0)) as html_size_total_pretty
from public.shared_reports;

select
  date_trunc('day', created_at) as day,
  count(*) as reports_created
from public.shared_reports
group by 1
order by 1 desc
limit 30;

-- ============================================================
-- 9) Visual LED logging checks
-- ============================================================
select
  count(*) as sessions_total,
  min(started_at) as oldest_session,
  max(started_at) as newest_session
from public.visual_led_sessions;

select
  event_type,
  count(*) as events_count
from public.visual_led_events
group by event_type
order by events_count desc;

select
  count(*) as assets_total,
  coalesce(sum(size_bytes), 0) as assets_size_bytes_total,
  pg_size_pretty(coalesce(sum(size_bytes), 0)) as assets_size_total_pretty
from public.visual_led_assets;

-- End of Wave 0 checks.
