-- Vikendly: event venues (listings with only party spaces) and guest reviews.
-- Run once in Supabase → SQL Editor, after 0012. Safe to run again.

-- ───────────── 1. Event venues ─────────────
-- A listing made only of party-only units has nobody sleeping over, so its capacity is 0.
-- (Party-only units themselves already allow 0 since 0012.)
alter table public.houses drop constraint if exists houses_capacity_check;
alter table public.houses add constraint houses_capacity_check check (capacity >= 0);

-- ───────────── 2. Guest reviews ─────────────
-- Only guests with a confirmed booking can review: the team creates a private link (token) for
-- a booking request in admin and sends it to the guest. The guest's review waits until an admin
-- approves it; only approved reviews are public.

create table if not exists public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  booking_request_id uuid unique references public.booking_requests (id) on delete set null,
  house_id           uuid not null references public.houses (id) on delete cascade,
  token              uuid not null unique default gen_random_uuid(),
  status             text not null default 'invited'
                     check (status in ('invited', 'submitted', 'approved', 'hidden')),
  guest_name         text check (guest_name is null or char_length(guest_name) between 1 and 60),
  rating             smallint check (rating is null or rating between 1 and 5),
  comment            text check (comment is null or char_length(comment) <= 1500),
  locale             text not null default 'sr' check (locale in ('sr', 'en')),
  created_at         timestamptz not null default now(),
  submitted_at       timestamptz
);
create index if not exists reviews_house_idx on public.reviews (house_id) where status = 'approved';

alter table public.reviews enable row level security;

drop policy if exists "Anyone can read approved reviews" on public.reviews;
create policy "Anyone can read approved reviews" on public.reviews
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews" on public.reviews
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Visitors may read only these columns (never the private token or the booking link)
revoke all on public.reviews from anon, authenticated;
grant select (id, house_id, status, guest_name, rating, comment, locale, submitted_at) on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;

-- The review page: what the link is for (house, guest's first name, dates) and whether it was used.
-- Runs with the owner's rights so visitors never need to read the table directly.
create or replace function public.get_review_invite(p_token uuid)
returns table (house_name text, house_slug text, guest_name text, check_in date, check_out date, status text)
language sql stable security definer set search_path = '' as $$
  select h.name, h.slug, r.guest_name, b.check_in, b.check_out, r.status
  from public.reviews r
  join public.houses h on h.id = r.house_id
  left join public.booking_requests b on b.id = r.booking_request_id
  where r.token = p_token;
$$;

-- Saves the guest's review. Works once per link; returns false if the link is unknown or used.
create or replace function public.submit_review(
  p_token uuid, p_rating int, p_comment text, p_name text, p_locale text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be 1–5' using errcode = '22023';
  end if;
  update public.reviews set
    status = 'submitted',
    rating = p_rating,
    comment = nullif(left(trim(coalesce(p_comment, '')), 1500), ''),
    guest_name = coalesce(nullif(left(trim(coalesce(p_name, '')), 60), ''), guest_name),
    locale = case when p_locale = 'en' then 'en' else 'sr' end,
    submitted_at = now()
  where token = p_token and status = 'invited'
  returning id into v_id;
  return v_id is not null;
end;
$$;

revoke all on function public.get_review_invite(uuid) from public;
revoke all on function public.submit_review(uuid, int, text, text, text) from public;
grant execute on function public.get_review_invite(uuid) to anon, authenticated;
grant execute on function public.submit_review(uuid, int, text, text, text) to anon, authenticated;
