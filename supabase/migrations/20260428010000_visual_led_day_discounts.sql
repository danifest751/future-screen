-- 2026-04-28  Multi-day rental discounts for the Visual LED configurator.
--
-- Each row defines the discount applied on a specific rental day.
-- The row marked `is_last_tier = true` is the catch-all for any day
-- at or beyond that day_number (e.g. "day 4 and above → 40%").
-- Only one row should have is_last_tier = true; the application picks
-- the last-tier row when day > max explicit day_number.

create table public.visual_led_day_discounts (
  day_number        int           primary key,  -- 1-based (1 = first rental day)
  discount_percent  numeric(5,2)  not null default 0 check (discount_percent >= 0 and discount_percent < 100),
  label_ru          text          not null,     -- display label  'День 1', 'День 4+'
  is_last_tier      boolean       not null default false,
  updated_at        timestamptz   not null default now()
);

alter table public.visual_led_day_discounts enable row level security;

create policy "public read visual_led_day_discounts"
  on public.visual_led_day_discounts for select
  using (true);

create policy "admin write visual_led_day_discounts"
  on public.visual_led_day_discounts for all
  using  (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ── Seed ─────────────────────────────────────────────────────────────────────

insert into public.visual_led_day_discounts
  (day_number, discount_percent, label_ru, is_last_tier)
values
  (1,  0,  'День 1',   false),
  (2, 20,  'День 2',   false),
  (3, 30,  'День 3',   false),
  (4, 40,  'День 4+',  true);
