-- Vikendly: manage destinations in the admin, destination pictures, map coordinates for houses
-- Run once in Supabase → SQL Editor, after 0006.

-- ───────────── 1. Destinations: picture + admin can add/edit/delete ─────────────

alter table public.destinations add column image_url text;
update public.destinations set image_url = '/images/destination-' || slug || '.svg' where image_url is null;

create policy "Admins can add destinations" on public.destinations
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can edit destinations" on public.destinations
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete destinations" on public.destinations
  for delete to authenticated using ((select public.is_admin()));
grant insert, update, delete on public.destinations to authenticated;
-- A destination that still has houses can't be deleted (houses.destination_id references it).

-- ───────────── 2. Approximate coordinates for the sample houses ─────────────
-- Only fills empty values, so anything already set in the admin is kept.

update public.houses h set lat = c.lat, lng = c.lng
from (values
  ('vila-ribnica',                 43.7213, 19.7064),
  ('planinska-kuca-pancic',        43.2850, 20.8140),
  ('brvnara-na-drini',             43.9706, 19.5675),
  ('kuca-na-maljenu',              44.1036, 20.0047),
  ('vila-vinogradi',               45.2027, 19.9342),
  ('kuca-za-ekipu-perucac',        43.9581, 19.4370),
  ('kuca-kod-vlasinskog-jezera',   42.7300, 22.3400),
  ('kuca-pod-durmitorom',          43.1544, 19.1226),
  ('sale-jahorina',                43.7339, 18.5671),
  ('porodicna-kuca-kraljeva-voda', 43.7270, 19.6870),
  ('apartman-za-dvoje-brzece',     43.3088, 20.8706),
  ('kuca-mitrovac',                43.9230, 19.4230)
) as c(slug, lat, lng)
where h.slug = c.slug and h.lat is null and h.lng is null;

-- ───────────── 3. Save function: now also saves lat/lng ─────────────

create or replace function public.admin_save_house(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := nullif(payload->>'id', '')::uuid;
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if v_id is null then
    insert into public.houses (
      slug, name, destination_id, capacity, day_capacity, bedrooms, bathrooms,
      weekday_price, weekend_price, min_nights,
      description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed,
      check_in_time, check_out_time, address, lat, lng, is_published, featured_rank
    ) values (
      payload->>'slug', payload->>'name', payload->>'destination_id',
      (payload->>'capacity')::int, nullif(payload->>'day_capacity', '')::int,
      nullif(payload->>'bedrooms', '')::int, nullif(payload->>'bathrooms', '')::int,
      (payload->>'weekday_price')::numeric, (payload->>'weekend_price')::numeric,
      (payload->>'min_nights')::int,
      payload->>'description_sr', payload->>'description_en',
      (payload->>'parties_allowed')::boolean, (payload->>'pets_allowed')::boolean,
      (payload->>'smoking_allowed')::boolean,
      payload->>'check_in_time', payload->>'check_out_time', payload->>'address',
      nullif(payload->>'lat', '')::double precision, nullif(payload->>'lng', '')::double precision,
      (payload->>'is_published')::boolean, nullif(payload->>'featured_rank', '')::int
    )
    returning id into v_id;
  else
    update public.houses set
      slug = payload->>'slug',
      name = payload->>'name',
      destination_id = payload->>'destination_id',
      capacity = (payload->>'capacity')::int,
      day_capacity = nullif(payload->>'day_capacity', '')::int,
      bedrooms = nullif(payload->>'bedrooms', '')::int,
      bathrooms = nullif(payload->>'bathrooms', '')::int,
      weekday_price = (payload->>'weekday_price')::numeric,
      weekend_price = (payload->>'weekend_price')::numeric,
      min_nights = (payload->>'min_nights')::int,
      description_sr = payload->>'description_sr',
      description_en = payload->>'description_en',
      parties_allowed = (payload->>'parties_allowed')::boolean,
      pets_allowed = (payload->>'pets_allowed')::boolean,
      smoking_allowed = (payload->>'smoking_allowed')::boolean,
      check_in_time = payload->>'check_in_time',
      check_out_time = payload->>'check_out_time',
      address = payload->>'address',
      lat = nullif(payload->>'lat', '')::double precision,
      lng = nullif(payload->>'lng', '')::double precision,
      is_published = (payload->>'is_published')::boolean,
      featured_rank = nullif(payload->>'featured_rank', '')::int
    where id = v_id;
    if not found then
      raise exception 'House not found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.house_owner_contacts (house_id, phone, updated_at)
  values (v_id, payload->>'owner_phone', now())
  on conflict (house_id) do update set phone = excluded.phone, updated_at = now();

  delete from public.house_categories hc where hc.house_id = v_id;
  insert into public.house_categories (house_id, category_id)
    select v_id, value from jsonb_array_elements_text(coalesce(payload->'category_ids', '[]'));

  delete from public.house_amenities ha where ha.house_id = v_id;
  insert into public.house_amenities (house_id, amenity_id)
    select v_id, value from jsonb_array_elements_text(coalesce(payload->'amenity_ids', '[]'));

  delete from public.house_photos hp where hp.house_id = v_id;
  insert into public.house_photos (house_id, url, sort_order)
    select v_id, value, (ordinality - 1)::int
    from jsonb_array_elements_text(coalesce(payload->'photos', '[]')) with ordinality;

  delete from public.house_price_tiers pt where pt.house_id = v_id;
  insert into public.house_price_tiers (house_id, max_guests, weekday_price, weekend_price)
    select v_id, (t->>'max_guests')::int, (t->>'weekday_price')::numeric, (t->>'weekend_price')::numeric
    from jsonb_array_elements(coalesce(payload->'price_tiers', '[]')) as t;

  return v_id;
end;
$$;
