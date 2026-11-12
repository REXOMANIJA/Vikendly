-- Vikendly: limits against spam on the two public forms (booking requests, owner applications).
-- Run once in Supabase → SQL Editor, after 0008.
--
-- Two layers:
-- 1. Per visitor (done by the website): at most a few requests per hour from the same
--    internet address. The address is stored only as a one-way hash, never as plain text.
-- 2. For everyone together (done here in the database, so it also stops bots that skip the
--    website): if far more requests than normal arrive within 10 minutes, new ones are refused.

-- ───────────── 1. Per-visitor counter ─────────────

create table public.rate_limits (
  key        text not null,
  created_at timestamptz not null default now()
);
create index rate_limits_key_time_idx on public.rate_limits (key, created_at);
-- No policies: nobody can read or write this table directly, only through the function below.
alter table public.rate_limits enable row level security;

-- Records one attempt for `p_key` and returns false if it already had `p_max` attempts
-- in the last `p_window_seconds`.
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  attempts int;
begin
  if length(p_key) > 100 or p_max < 1 or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;

  -- Housekeeping: nothing older than a day is needed
  delete from public.rate_limits where created_at < now() - interval '1 day';

  select count(*) into attempts
  from public.rate_limits
  where key = p_key and created_at > now() - make_interval(secs => p_window_seconds);

  if attempts >= p_max then
    return false;
  end if;

  insert into public.rate_limits (key) values (p_key);
  return true;
end;
$$;

revoke all on function public.hit_rate_limit(text, int, int) from public;
grant execute on function public.hit_rate_limit(text, int, int) to anon, authenticated;

-- ───────────── 2. Flood guard for everyone together ─────────────

-- Refuses a new row if the table already got `tg_argv[0]` rows in the last 10 minutes.
create or replace function public.refuse_floods()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  recent int;
begin
  execute format(
    'select count(*) from %I.%I where created_at > now() - interval ''10 minutes''',
    tg_table_schema, tg_table_name
  ) into recent;
  if recent >= tg_argv[0]::int then
    raise exception 'Too many requests right now' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger booking_requests_flood_guard
  before insert on public.booking_requests
  for each row execute function public.refuse_floods('40');

create trigger owner_applications_flood_guard
  before insert on public.owner_applications
  for each row execute function public.refuse_floods('20');
