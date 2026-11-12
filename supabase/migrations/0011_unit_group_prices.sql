-- Vikendly: smaller-group prices for units (and the save function that stores them).
-- Run once in Supabase → SQL Editor, after 0010. Safe to run again.
--
-- Needed if 0010 was run before unit group prices were added to it. Adds the missing column
-- and replaces the save function with the version that also saves unit group prices and
-- weekday/weekend party prices.

alter table public.house_units
  add column if not exists price_tiers jsonb not null default '[]'::jsonb;  -- cheaper prices for smaller groups

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
      check_in_time, check_out_time, address, lat, lng, is_published, featured_rank, verified_at,
      party_prices
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
      (payload->>'is_published')::boolean, nullif(payload->>'featured_rank', '')::int,
      nullif(payload->>'verified_at', '')::date,
      coalesce(payload->'party_prices', '[]'::jsonb)
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
      featured_rank = nullif(payload->>'featured_rank', '')::int,
      verified_at = nullif(payload->>'verified_at', '')::date,
      party_prices = coalesce(payload->'party_prices', '[]'::jsonb)
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

  -- Units: kept in the order they were entered. Existing ids are kept (old booking requests
  -- point to them); units no longer in the list are deleted.
  delete from public.house_units u
  where u.house_id = v_id
    and u.id not in (
      select nullif(x->>'id', '')::uuid
      from jsonb_array_elements(coalesce(payload->'units', '[]')) as x
      where nullif(x->>'id', '') is not null
    );
  insert into public.house_units (
    id, house_id, sort_order, name, capacity, day_capacity, weekday_price, weekend_price,
    parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, party_prices, price_tiers
  )
  select
    coalesce(nullif(x->>'id', '')::uuid, gen_random_uuid()), v_id, (ordinality - 1)::int,
    x->>'name', (x->>'capacity')::int, nullif(x->>'day_capacity', '')::int,
    (x->>'weekday_price')::numeric, (x->>'weekend_price')::numeric,
    (x->>'parties_allowed')::boolean, (x->>'pets_allowed')::boolean, (x->>'smoking_allowed')::boolean,
    x->>'check_in_time', x->>'check_out_time', coalesce(x->'party_prices', '[]'::jsonb),
    coalesce(x->'price_tiers', '[]'::jsonb)
  from jsonb_array_elements(coalesce(payload->'units', '[]')) with ordinality as list(x, ordinality)
  on conflict (id) do update set
    sort_order = excluded.sort_order,
    name = excluded.name,
    capacity = excluded.capacity,
    day_capacity = excluded.day_capacity,
    weekday_price = excluded.weekday_price,
    weekend_price = excluded.weekend_price,
    parties_allowed = excluded.parties_allowed,
    pets_allowed = excluded.pets_allowed,
    smoking_allowed = excluded.smoking_allowed,
    check_in_time = excluded.check_in_time,
    check_out_time = excluded.check_out_time,
    party_prices = excluded.party_prices,
    price_tiers = excluded.price_tiers
  -- a unit id can only be updated within its own house
  where public.house_units.house_id = excluded.house_id;

  return v_id;
end;
$$;
