-- Vikendly: fixes holidays not showing on the site, and adds holiday prices for party spaces.
-- Run once in Supabase → SQL Editor, after 0016. Safe to run again.

-- ───────────── 1. Visitors can read switched-on holidays ─────────────
-- 0016 let visitors read a holiday when "is_active or is_admin()", but visitors may not call
-- is_admin(), so every read failed ("permission denied for function is_admin") and the homepage
-- block and the holiday page stayed empty. Admins read everything through "Admins manage holidays".
drop policy if exists "Anyone can read active holidays" on public.holidays;
create policy "Anyone can read active holidays" on public.holidays
  for select to anon, authenticated using (is_active);

-- ───────────── 2. Holiday prices for party spaces ─────────────
-- A party-only space is priced per party by size ("do 30 / 50 / 70 osoba"). A holiday price for it
-- is one row per size: max_guests = that size, price = the party price on those days.
-- Empty max_guests = a nightly price for a place with beds (as before).
alter table public.house_special_prices add column if not exists max_guests int;
alter table public.house_special_prices drop constraint if exists house_special_prices_max_guests_check;
alter table public.house_special_prices add constraint house_special_prices_max_guests_check
  check (max_guests is null or max_guests between 1 and 1000);
