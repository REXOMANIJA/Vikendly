-- Vikendly: party capacity, optional rooms, prices by group size
-- Run once in Supabase → SQL Editor, after 0003.

-- ───────────── Capacity ─────────────
-- capacity      = how many people can stay overnight ("spava X osoba")
-- day_capacity  = how many people may come for a party / gathering (optional)
alter table public.houses
  add column day_capacity int check (day_capacity is null or day_capacity > 0);

comment on column public.houses.capacity is 'Guests who can stay overnight';
comment on column public.houses.day_capacity is 'Guests allowed for a party or daytime gathering (optional)';

-- Bedrooms and bathrooms are optional now
alter table public.houses alter column bedrooms drop not null;
alter table public.houses alter column bathrooms drop not null;

-- ───────────── Prices by group size ─────────────
-- houses.weekday_price / weekend_price = price for the whole house (up to capacity).
-- Optional cheaper prices for smaller groups: "up to max_guests people".
-- The site uses the smallest tier that fits the group, otherwise the whole-house price.

create table public.house_price_tiers (
  id            uuid primary key default gen_random_uuid(),
  house_id      uuid not null references public.houses (id) on delete cascade,
  max_guests    int not null check (max_guests > 0),
  weekday_price numeric(8,2) not null check (weekday_price >= 0),
  weekend_price numeric(8,2) not null check (weekend_price >= 0),
  unique (house_id, max_guests)
);
create index house_price_tiers_house_idx on public.house_price_tiers (house_id);

alter table public.house_price_tiers enable row level security;

create policy "Public can read price tiers of published houses" on public.house_price_tiers
  for select to anon, authenticated
  using (exists (select 1 from public.houses h where h.id = house_id and h.is_published));
create policy "Admins can manage price tiers" on public.house_price_tiers
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.house_price_tiers to anon, authenticated;
grant insert, update, delete on public.house_price_tiers to authenticated;

-- ───────────── Save function, now with the new fields ─────────────

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
      weekday_price, weekend_price, cleaning_fee, min_nights,
      description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed,
      check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone,
      is_published, featured_rank
    ) values (
      payload->>'slug', payload->>'name', payload->>'destination_id',
      (payload->>'capacity')::int, nullif(payload->>'day_capacity', '')::int,
      nullif(payload->>'bedrooms', '')::int, nullif(payload->>'bathrooms', '')::int,
      (payload->>'weekday_price')::numeric, (payload->>'weekend_price')::numeric,
      (payload->>'cleaning_fee')::numeric, (payload->>'min_nights')::int,
      payload->>'description_sr', payload->>'description_en',
      (payload->>'parties_allowed')::boolean, (payload->>'pets_allowed')::boolean,
      (payload->>'smoking_allowed')::boolean,
      payload->>'check_in_time', payload->>'check_out_time', payload->>'address',
      nullif(payload->>'contact_viber', ''), nullif(payload->>'contact_whatsapp', ''),
      nullif(payload->>'contact_phone', ''),
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
      cleaning_fee = (payload->>'cleaning_fee')::numeric,
      min_nights = (payload->>'min_nights')::int,
      description_sr = payload->>'description_sr',
      description_en = payload->>'description_en',
      parties_allowed = (payload->>'parties_allowed')::boolean,
      pets_allowed = (payload->>'pets_allowed')::boolean,
      smoking_allowed = (payload->>'smoking_allowed')::boolean,
      check_in_time = payload->>'check_in_time',
      check_out_time = payload->>'check_out_time',
      address = payload->>'address',
      contact_viber = nullif(payload->>'contact_viber', ''),
      contact_whatsapp = nullif(payload->>'contact_whatsapp', ''),
      contact_phone = nullif(payload->>'contact_phone', ''),
      is_published = (payload->>'is_published')::boolean,
      featured_rank = nullif(payload->>'featured_rank', '')::int
    where id = v_id;
    if not found then
      raise exception 'House not found' using errcode = 'P0002';
    end if;
  end if;

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
