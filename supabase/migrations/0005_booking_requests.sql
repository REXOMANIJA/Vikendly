-- Vikendly: booking requests, private owner phone, no cleaning fee / tourist tax
-- Run once in Supabase → SQL Editor, after 0004.
--
-- New flow: guests don't contact owners directly. They send a booking request to Vikendly,
-- the team calls the owner and gets back to the guest.

-- ───────────── 1. Prices: nights only ─────────────
alter table public.houses drop column cleaning_fee;
alter table public.destinations drop column tourist_tax_per_person_per_night;

-- ───────────── 2. Owner phone: private, admins only ─────────────
-- Moved out of public.houses (which anyone can read) into its own table.

create table public.house_owner_contacts (
  house_id   uuid primary key references public.houses (id) on delete cascade,
  phone      text not null check (char_length(phone) between 6 and 40),
  updated_at timestamptz not null default now()
);
alter table public.house_owner_contacts enable row level security;
create policy "Admins can manage owner contacts" on public.house_owner_contacts
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant select, insert, update, delete on public.house_owner_contacts to authenticated;

-- Keep each house's number: phone first, otherwise WhatsApp, otherwise Viber
insert into public.house_owner_contacts (house_id, phone)
select id, coalesce(contact_phone, contact_whatsapp, contact_viber)
from public.houses
where coalesce(contact_phone, contact_whatsapp, contact_viber) is not null;

alter table public.houses
  drop column contact_viber,
  drop column contact_whatsapp,
  drop column contact_phone;

-- ───────────── 3. Booking requests ─────────────

create table public.booking_requests (
  id           uuid primary key default gen_random_uuid(),
  house_id     uuid references public.houses (id) on delete set null,
  house_name   text not null,                 -- kept even if the house is deleted later
  check_in     date not null,
  check_out    date not null,
  guests       int not null check (guests > 0),
  quoted_total numeric(10,2) not null check (quoted_total >= 0),  -- price shown to the guest
  name         text not null check (char_length(name) between 2 and 120),
  phone        text not null check (char_length(phone) between 6 and 40),
  email        text check (email is null or char_length(email) between 5 and 200),
  message      text check (message is null or char_length(message) <= 2000),
  locale       text not null default 'sr' check (locale in ('sr', 'en')),
  status       text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'declined')),
  created_at   timestamptz not null default now(),
  check (check_out > check_in)
);
create index booking_requests_created_idx on public.booking_requests (created_at desc);

alter table public.booking_requests enable row level security;

-- Visitors can only send a request for a published house; they can never read requests
create policy "Anyone can send a booking request" on public.booking_requests
  for insert to anon, authenticated
  with check (
    status = 'new'
    and exists (select 1 from public.houses h where h.id = house_id and h.is_published)
  );
create policy "Admins can read booking requests" on public.booking_requests
  for select to authenticated using ((select public.is_admin()));
create policy "Admins can update booking requests" on public.booking_requests
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete booking requests" on public.booking_requests
  for delete to authenticated using ((select public.is_admin()));

grant insert on public.booking_requests to anon, authenticated;
grant select, update, delete on public.booking_requests to authenticated;

-- ───────────── 4. Save function without fees/contacts, with owner phone ─────────────

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
      check_in_time, check_out_time, address, is_published, featured_rank
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
