-- Vikendly: holiday offers ("Praznici") and special prices for chosen nights.
-- Run once in Supabase → SQL Editor, after 0015. Safe to run again.
--
-- 1. house_special_prices: a price per night for chosen nights (e.g. 31.12–1.1 for Nova godina),
--    entered by the team in admin → Kuće → "Posebne cene". For a house split into units each row
--    belongs to one unit; for a house rented as one, unit_id is empty. It replaces the normal
--    weekday/weekend and smaller-group price for those nights, and can require a longer stay.
-- 2. holidays + holiday_houses: a holiday offer shown on the homepage and on its own page
--    (/sr/praznici/…) while it is switched on. The team ticks the houses that are free.

-- ───────────── 1. Special prices ─────────────

create table if not exists public.house_special_prices (
  id          uuid primary key default gen_random_uuid(),
  house_id    uuid not null references public.houses (id) on delete cascade,
  unit_id     uuid references public.house_units (id) on delete cascade,
  label       text not null default '' check (char_length(label) <= 60),
  first_night date not null,
  last_night  date not null,
  price       numeric(10, 2) not null check (price >= 0),
  min_nights  int check (min_nights is null or min_nights between 1 and 30),
  check (last_night >= first_night)
);
create index if not exists house_special_prices_house_idx on public.house_special_prices (house_id);

alter table public.house_special_prices enable row level security;
drop policy if exists "Anyone can read special prices" on public.house_special_prices;
create policy "Anyone can read special prices" on public.house_special_prices
  for select to anon, authenticated using (true);
drop policy if exists "Admins manage special prices" on public.house_special_prices;
create policy "Admins manage special prices" on public.house_special_prices
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant select on public.house_special_prices to anon;
grant select, insert, update, delete on public.house_special_prices to authenticated;

-- ───────────── 2. Holidays ─────────────

create table if not exists public.holidays (
  id         uuid primary key default gen_random_uuid(),
  -- URL name (/sr/praznici/nova-godina-2027), fixed after creation
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_sr    text not null check (char_length(name_sr) between 2 and 80),
  name_en    text not null default '' check (char_length(name_en) <= 80),
  text_sr    text not null default '' check (char_length(text_sr) <= 600),
  text_en    text not null default '' check (char_length(text_en) <= 600),
  -- Suggested stay: arrival and departure day
  check_in   date not null,
  check_out  date not null,
  image_url  text,
  is_active  boolean not null default false,
  created_at timestamptz not null default now(),
  check (check_out > check_in)
);

create table if not exists public.holiday_houses (
  holiday_id uuid not null references public.holidays (id) on delete cascade,
  house_id   uuid not null references public.houses (id) on delete cascade,
  primary key (holiday_id, house_id)
);

alter table public.holidays enable row level security;
alter table public.holiday_houses enable row level security;

drop policy if exists "Anyone can read active holidays" on public.holidays;
create policy "Anyone can read active holidays" on public.holidays
  for select to anon, authenticated using (is_active);  -- fixed in 0017 (was: is_active or is_admin())
drop policy if exists "Admins manage holidays" on public.holidays;
create policy "Admins manage holidays" on public.holidays
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read holiday houses" on public.holiday_houses;
create policy "Anyone can read holiday houses" on public.holiday_houses
  for select to anon, authenticated using (true);
drop policy if exists "Admins manage holiday houses" on public.holiday_houses;
create policy "Admins manage holiday houses" on public.holiday_houses
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.holidays, public.holiday_houses to anon;
grant select, insert, update, delete on public.holidays, public.holiday_houses to authenticated;
