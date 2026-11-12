-- Vikendly: party-only spaces (no sleeping), e.g. a "Letnjikovac" rented only for parties.
-- Run once in Supabase → SQL Editor, after 0011. Safe to run again.
--
-- A party-only unit has no beds (capacity 0) and no nightly price: the guest picks a day and
-- how many people come, and pays the party price level for that number (weekday or weekend).
-- Units with beds no longer have party prices; they only show how many people may be there
-- during the day (day_capacity).

alter table public.house_units add column if not exists price_tiers jsonb not null default '[]'::jsonb;
alter table public.house_units add column if not exists party_only boolean not null default false;

-- Party-only units have 0 beds; every other unit still needs at least 1
alter table public.house_units drop constraint if exists house_units_capacity_check;
alter table public.house_units
  add constraint house_units_capacity_check check (capacity >= 0 and (party_only or capacity > 0));

-- Kutak u Vraniću: "Letnjikovac" was entered as a 1-bed unit with the 70-person price as its
-- nightly price. Turn it into a party-only space and keep that price as the "up to 70" level.
update public.house_units u set
  party_only = true,
  parties_allowed = true,
  capacity = 0,
  party_prices = (
    select coalesce(jsonb_agg(level order by (level->>'max_guests')::int), '[]'::jsonb)
    from jsonb_array_elements(
      u.party_prices || jsonb_build_array(jsonb_build_object(
        'max_guests', u.day_capacity, 'weekday_price', u.weekday_price, 'weekend_price', u.weekend_price
      ))
    ) as level
  ),
  weekday_price = 0,
  weekend_price = 0,
  price_tiers = '[]'::jsonb
where u.name = 'Letnjikovac' and u.capacity = 1 and u.day_capacity = 70 and not u.party_only;

-- Listings with units: beds = only units with beds (party spaces don't count)
update public.houses h set capacity = beds.total
from (
  select house_id, sum(capacity)::int as total
  from public.house_units
  where not party_only
  group by house_id
) as beds
where beds.house_id = h.id and beds.total > 0 and h.capacity <> beds.total;

-- Units with beds: party prices are no longer used
update public.house_units set party_prices = '[]'::jsonb where not party_only and party_prices <> '[]'::jsonb;

-- Save function: same as 0011, plus party_only
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
    parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, party_prices, price_tiers,
    party_only
  )
  select
    coalesce(nullif(x->>'id', '')::uuid, gen_random_uuid()), v_id, (ordinality - 1)::int,
    x->>'name', (x->>'capacity')::int, nullif(x->>'day_capacity', '')::int,
    (x->>'weekday_price')::numeric, (x->>'weekend_price')::numeric,
    (x->>'parties_allowed')::boolean, (x->>'pets_allowed')::boolean, (x->>'smoking_allowed')::boolean,
    x->>'check_in_time', x->>'check_out_time', coalesce(x->'party_prices', '[]'::jsonb),
    coalesce(x->'price_tiers', '[]'::jsonb),
    coalesce((x->>'party_only')::boolean, false)
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
    price_tiers = excluded.price_tiers,
    party_only = excluded.party_only
  -- a unit id can only be updated within its own house
  where public.house_units.house_id = excluded.house_id;

  return v_id;
end;
$$;
