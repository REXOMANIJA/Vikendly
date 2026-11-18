-- Vikendly: guests never get a house's written address.
-- Run once in Supabase → SQL Editor. Safe to run twice.
--
-- The site shows the house on a map (lat / lng), but the address itself is only for the team:
-- the public key (anon) may no longer read the "address" column. The admin panel (logged in)
-- still sees and edits everything.
-- If a later migration adds a house column the public site needs, add it to the grant below.

revoke select on public.houses from anon;
grant select (
  id, slug, name, destination_id, capacity, day_capacity, bedrooms, bathrooms,
  weekday_price, weekend_price, min_nights, description_sr, description_en,
  parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time,
  lat, lng, is_published, featured_rank, created_at, updated_at, verified_at, party_prices,
  rules_sr, rules_en, nearby_sr, nearby_en
) on public.houses to anon;
