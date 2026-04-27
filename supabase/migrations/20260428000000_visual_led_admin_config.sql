-- 2026-04-28  Admin-editable config for the Visual LED configurator.
--
-- Moves preset definitions and pixel-pitch specs out of hardcoded TypeScript
-- constants into Supabase so they can be edited from the admin panel without
-- a deploy.  The TypeScript fallbacks in presets.ts / types.ts remain in
-- place so the visualizer still works if these tables are unavailable.

-- ── visual_led_presets ───────────────────────────────────────────────────────

create table public.visual_led_presets (
  id                    uuid          primary key default gen_random_uuid(),
  slug                  text          not null unique,
  name_ru               text          not null,
  name_en               text          not null,
  description_ru        text          not null default '',
  description_en        text          not null default '',
  sort_order            int           not null default 0,
  is_active             boolean       not null default true,
  area_m2               numeric(10,2) not null,
  width_m               numeric(10,2) not null,
  height_m              numeric(10,2) not null,
  base_price            numeric(12,2) not null,
  price_per_m2          numeric(10,2) not null,
  event_multiplier      numeric(6,4)  not null,
  round_step            int           not null,
  default_pitch         text          not null,
  default_cabinet_side_m numeric(6,3) not null default 0.5,
  -- public path or Supabase storage path; null → built-in /visual-led-presets/{slug}.jpg
  preview_path          text          null,
  updated_at            timestamptz   not null default now()
);

alter table public.visual_led_presets enable row level security;

create policy "public read visual_led_presets"
  on public.visual_led_presets for select
  using (true);

create policy "admin write visual_led_presets"
  on public.visual_led_presets for all
  using  (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ── visual_led_pitch_config ──────────────────────────────────────────────────

create table public.visual_led_pitch_config (
  pitch               text          primary key,   -- '2.6', '1.9', '3.9', …
  label               text          not null,      -- display label  'P2.6'
  pixels_per_cabinet  int           not null,      -- px along one side of a 0.5 m cabinet
  cabinet_side_m      numeric(6,3)  not null default 0.5,
  weight_min_kg       numeric(6,2)  not null,
  weight_max_kg       numeric(6,2)  not null,
  max_power_w         int           not null,
  average_power_w     int           not null,
  is_active           boolean       not null default true,
  sort_order          int           not null default 0,
  updated_at          timestamptz   not null default now()
);

alter table public.visual_led_pitch_config enable row level security;

create policy "public read visual_led_pitch_config"
  on public.visual_led_pitch_config for select
  using (true);

create policy "admin write visual_led_pitch_config"
  on public.visual_led_pitch_config for all
  using  (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ── Seed: pitch specs ────────────────────────────────────────────────────────
-- pixels_per_cabinet ≈ floor(500 mm / pitch_mm) — rounded to common module sizes.

insert into public.visual_led_pitch_config
  (pitch, label, pixels_per_cabinet, cabinet_side_m,
   weight_min_kg, weight_max_kg, max_power_w, average_power_w, sort_order)
values
  ('1.9', 'P1.9', 256, 0.5,  7,  9, 200,  70, 0),
  ('2.6', 'P2.6', 192, 0.5,  6,  8, 160,  55, 1),
  ('3.9', 'P3.9', 128, 0.5,  7,  9, 200,  65, 2),
  ('5.9', 'P5.9',  84, 0.5, 12, 16, 300, 100, 3);

-- ── Seed: presets ────────────────────────────────────────────────────────────

insert into public.visual_led_presets
  (slug, name_ru, name_en, description_ru, description_en, sort_order,
   area_m2, width_m, height_m, base_price, price_per_m2, event_multiplier,
   round_step, default_pitch, default_cabinet_side_m)
values
  ('compact',
   'Малая презентация', 'Compact presentation',
   'Камерное событие, презентация, малый зал',
   'Small event, presentation, intimate venue',
   0, 15, 5, 3, 30000, 1500, 1.0, 5000, '2.6', 0.5),

  ('corporate',
   'Корпоратив / форум', 'Corporate / forum',
   'Корпоратив, конференция, форум',
   'Corporate event, conference, forum',
   1, 35, 7, 5, 50000, 1800, 1.1, 5000, '2.6', 0.5),

  ('concert',
   'Сцена / концерт', 'Concert stage',
   'Сцена, концерт, шоу-программа',
   'Stage, concert, performance',
   2, 60, 10, 6, 80000, 2200, 1.3, 10000, '3.9', 0.5),

  ('festival',
   'Фестиваль', 'Festival',
   'Фестиваль, большая сцена, выставка',
   'Festival, large stage, exhibition',
   3, 120, 15, 8, 150000, 2500, 1.5, 10000, '3.9', 0.5),

  ('flagship',
   'Топ-проект', 'Flagship project',
   'Уличное шоу, арена, большой фестиваль',
   'Outdoor show, arena, large festival',
   4, 200, 20, 10, 250000, 2800, 1.7, 10000, '5.9', 0.5);
