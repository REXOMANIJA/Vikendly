-- Vikendly: initial schema
-- Run once in Supabase → SQL Editor (or `supabase db push` with the CLI).
-- Matches the House / Destination types in types/index.ts.

-- ───────────────────────── Reference data ─────────────────────────

create table public.destinations (
  id          text primary key,                     -- 'zlatibor'
  slug        text not null unique,
  name        text not null,                        -- proper noun, same in sr/en
  country     text not null check (country in ('SR', 'HR', 'BA', 'ME')),
  -- TODO: verify real rates per municipality
  tourist_tax_per_person_per_night numeric(6,2) not null default 1.5 check (tourist_tax_per_person_per_night >= 0),
  sort_order  int not null default 0
);

create table public.categories (
  id         text primary key,                      -- 'mountain'; labels live in locales/*.json
  slug       text not null unique,
  sort_order int not null default 0
);

create table public.amenities (
  id         text primary key,                      -- 'wifi'; labels live in locales/*.json
  sort_order int not null default 0
);

-- ───────────────────────── Houses ─────────────────────────

create table public.houses (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null,
  destination_id  text not null references public.destinations (id),

  capacity        int not null check (capacity > 0),
  bedrooms        int not null check (bedrooms >= 0),
  bathrooms       int not null check (bathrooms >= 0),

  -- Prices in EUR
  weekday_price   numeric(8,2) not null check (weekday_price >= 0),
  weekend_price   numeric(8,2) not null check (weekend_price >= 0),  -- Friday and Saturday nights
  cleaning_fee    numeric(8,2) not null default 0 check (cleaning_fee >= 0),
  min_nights      int not null default 1 check (min_nights >= 1),

  description_sr  text not null,
  description_en  text not null,

  parties_allowed boolean not null default false,
  pets_allowed    boolean not null default false,
  smoking_allowed boolean not null default false,
  check_in_time   text not null default '15:00' check (check_in_time ~ '^\d{2}:\d{2}$'),
  check_out_time  text not null default '11:00' check (check_out_time ~ '^\d{2}:\d{2}$'),

  address         text not null,
  lat             double precision,
  lng             double precision,

  contact_viber    text,
  contact_whatsapp text,
  contact_phone    text,

  -- Only published houses are visible on the site (the team publishes after the visit)
  is_published    boolean not null default false,
  -- Houses with a rank show in "Izdvojeno za ovaj vikend", lowest first
  featured_rank   int,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index houses_destination_idx on public.houses (destination_id) where is_published;
create index houses_featured_idx on public.houses (featured_rank) where is_published and featured_rank is not null;

create table public.house_categories (
  house_id    uuid not null references public.houses (id) on delete cascade,
  category_id text not null references public.categories (id),
  primary key (house_id, category_id)
);

create table public.house_amenities (
  house_id   uuid not null references public.houses (id) on delete cascade,
  amenity_id text not null references public.amenities (id),
  primary key (house_id, amenity_id)
);

create table public.house_photos (
  id         uuid primary key default gen_random_uuid(),
  house_id   uuid not null references public.houses (id) on delete cascade,
  url        text not null,             -- '/images/…' now; Supabase Storage URLs later
  sort_order int not null default 0     -- 0 = cover photo
);
create index house_photos_house_idx on public.house_photos (house_id, sort_order);

-- Keep updated_at current
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger houses_set_updated_at
  before update on public.houses
  for each row execute function public.set_updated_at();

-- ───────────────────────── Owner applications ─────────────────────────
-- Filled by the "Izdajte svoju kuću" form. Visitors can only insert, never read.

create table public.owner_applications (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  phone       text not null check (char_length(phone) between 6 and 40),
  location    text not null check (char_length(location) between 2 and 200),
  description text not null check (char_length(description) between 1 and 2000),
  locale      text not null default 'sr' check (locale in ('sr', 'en')),
  status      text not null default 'new' check (status in ('new', 'contacted', 'visited', 'published', 'rejected')),
  created_at  timestamptz not null default now()
);

-- ───────────────────────── Security (Row Level Security) ─────────────────────────
-- The site uses the publishable key, so these rules decide what anyone on the internet can do.

alter table public.destinations       enable row level security;
alter table public.categories         enable row level security;
alter table public.amenities          enable row level security;
alter table public.houses             enable row level security;
alter table public.house_categories   enable row level security;
alter table public.house_amenities    enable row level security;
alter table public.house_photos       enable row level security;
alter table public.owner_applications enable row level security;

create policy "Public can read destinations" on public.destinations for select to anon, authenticated using (true);
create policy "Public can read categories"   on public.categories   for select to anon, authenticated using (true);
create policy "Public can read amenities"    on public.amenities    for select to anon, authenticated using (true);

create policy "Public can read published houses" on public.houses
  for select to anon, authenticated using (is_published);

create policy "Public can read categories of published houses" on public.house_categories
  for select to anon, authenticated
  using (exists (select 1 from public.houses h where h.id = house_id and h.is_published));

create policy "Public can read amenities of published houses" on public.house_amenities
  for select to anon, authenticated
  using (exists (select 1 from public.houses h where h.id = house_id and h.is_published));

create policy "Public can read photos of published houses" on public.house_photos
  for select to anon, authenticated
  using (exists (select 1 from public.houses h where h.id = house_id and h.is_published));

create policy "Anyone can submit an owner application" on public.owner_applications
  for insert to anon, authenticated
  with check (status = 'new');
-- No select/update/delete policy: applications are only visible in the Supabase dashboard.

grant select on public.destinations, public.categories, public.amenities, public.houses,
  public.house_categories, public.house_amenities, public.house_photos to anon, authenticated;
grant insert on public.owner_applications to anon, authenticated;
