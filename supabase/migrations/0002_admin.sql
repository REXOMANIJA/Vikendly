-- Vikendly: admin panel (/admin)
-- Run once in Supabase → SQL Editor, after 0001_init.sql.
--
-- Admins are normal Supabase Auth users listed in public.admins.
-- Every write is checked here, in the database, so the website code can't bypass it.

-- ───────────────────────── Who is an admin ─────────────────────────

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create policy "Users can see whether they are an admin" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.admins to authenticated;

-- security definer: can look into admins without needing a policy for it
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ───────────────────────── Admin permissions ─────────────────────────

-- Admins also see unpublished houses (and their photos, categories, amenities)
create policy "Admins can read all houses" on public.houses
  for select to authenticated using ((select public.is_admin()));
create policy "Admins can read all house categories" on public.house_categories
  for select to authenticated using ((select public.is_admin()));
create policy "Admins can read all house amenities" on public.house_amenities
  for select to authenticated using ((select public.is_admin()));
create policy "Admins can read all house photos" on public.house_photos
  for select to authenticated using ((select public.is_admin()));

-- Admins can add, change and delete houses and everything attached to them
create policy "Admins can insert houses" on public.houses
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update houses" on public.houses
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete houses" on public.houses
  for delete to authenticated using ((select public.is_admin()));

create policy "Admins can manage house categories" on public.house_categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can manage house amenities" on public.house_amenities
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can manage house photos" on public.house_photos
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Admins read owner applications and update their status
create policy "Admins can read owner applications" on public.owner_applications
  for select to authenticated using ((select public.is_admin()));
create policy "Admins can update owner applications" on public.owner_applications
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete owner applications" on public.owner_applications
  for delete to authenticated using ((select public.is_admin()));

grant insert, update, delete on public.houses, public.house_categories, public.house_amenities,
  public.house_photos to authenticated;
grant select, update, delete on public.owner_applications to authenticated;

-- ───────────────────────── Save a house in one step ─────────────────────────
-- The admin form sends the whole house as JSON. This saves the house, its categories,
-- amenities and photos together: either everything is saved or nothing is.
-- security invoker = runs with the caller's permissions, so the policies above apply.

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
      slug, name, destination_id, capacity, bedrooms, bathrooms,
      weekday_price, weekend_price, cleaning_fee, min_nights,
      description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed,
      check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone,
      is_published, featured_rank
    ) values (
      payload->>'slug', payload->>'name', payload->>'destination_id',
      (payload->>'capacity')::int, (payload->>'bedrooms')::int, (payload->>'bathrooms')::int,
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
      bedrooms = (payload->>'bedrooms')::int,
      bathrooms = (payload->>'bathrooms')::int,
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

  return v_id;
end;
$$;
revoke execute on function public.admin_save_house(jsonb) from public, anon;
grant execute on function public.admin_save_house(jsonb) to authenticated;

-- ───────────────────────── Photo storage ─────────────────────────
-- Public bucket: anyone can view photos, only admins can upload or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('house-photos', 'house-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "Admins can upload house photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'house-photos' and (select public.is_admin()));
create policy "Admins can update house photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'house-photos' and (select public.is_admin()));
create policy "Admins can delete house photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'house-photos' and (select public.is_admin()));
