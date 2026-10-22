-- ============================================================================
-- Booking functions
--   get_unavailable()  – anonymous-safe: returns only time ranges, no PII
--   create_booking()   – service_role ONLY; validates and inserts atomically
--   page_exists()      – tells the app a page row exists even if unpublished
-- ============================================================================

-- ----------------------------------------------------------------------------
-- get_unavailable: busy/blocked ranges for a date window (IST dates).
-- Safe for anon: exposes ranges only, never customer data or block reasons.
-- ----------------------------------------------------------------------------
create or replace function public.get_unavailable(p_from date, p_to date)
returns table (kind text, starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select 'booking'::text,
         b.starts_at,
         b.held_until
  from public.bookings b
  where b.status in ('pending', 'confirmed')
    and b.starts_at < (((p_to + 1)::timestamp) at time zone 'Asia/Kolkata')
    and b.held_until > ((p_from::timestamp) at time zone 'Asia/Kolkata')
  union all
  select 'blocked'::text,
         ((d.blocked_on + coalesce(d.start_time, time '00:00')) at time zone 'Asia/Kolkata'),
         (case
            when d.end_time is null then ((d.blocked_on + 1)::timestamp)
            else (d.blocked_on + d.end_time)
          end) at time zone 'Asia/Kolkata'
  from public.blocked_dates d
  where d.blocked_on between p_from and p_to;
$$;

revoke all on function public.get_unavailable(date, date) from public;
grant execute on function public.get_unavailable(date, date) to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- page_exists: lets the app distinguish "unpublished" from "never created".
-- ----------------------------------------------------------------------------
create or replace function public.page_exists(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.pages where slug = p_slug);
$$;

revoke all on function public.page_exists(text) from public;
grant execute on function public.page_exists(text) to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- hidden_section_keys: keys (NOT content) of sections the owner has hidden, so
-- built-in defaults for those keys are not shown again. Safe for anon.
-- ----------------------------------------------------------------------------
create or replace function public.hidden_section_keys(p_slug text)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(s.section_key), '{}'::text[])
  from public.page_sections s
  join public.pages p on p.id = s.page_id
  where p.slug = p_slug and not s.is_visible;
$$;

revoke all on function public.hidden_section_keys(text) from public;
grant execute on function public.hidden_section_keys(text) to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- create_booking: the ONLY way a public visitor creates a booking.
-- Called from a Next.js Server Action using the service-role key, after the
-- server has validated the payload with Zod and checked rate limits.
--
-- Raises (SQLSTATE P0001) with one of these messages:
--   service_unavailable | invalid_time | outside_hours | blocked
--   too_many_requests   | slot_taken
-- ----------------------------------------------------------------------------
create or replace function public.create_booking(
  p_service_id   uuid,
  p_starts_at    timestamptz,
  p_name         text,
  p_email        text,
  p_phone        text,
  p_birth_date   date,
  p_birth_time   time,
  p_birth_place  text,
  p_notes        text
)
returns table (booking_id uuid, booking_code text, booking_token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_service      public.services%rowtype;
  v_buffer       integer := 10;
  v_notice       integer := 12;
  v_advance      integer := 30;
  v_local        timestamp;
  v_local_end    timestamp;
  v_ends         timestamptz;
  v_held         timestamptz;
  v_rule         public.availability_rules%rowtype;
  v_recent       integer;
  v_code         text;
  v_id           uuid;
  v_token        uuid;
  v_attempt      integer := 0;
begin
  select * into v_service
  from public.services s
  where s.id = p_service_id and s.status = 'published';
  if not found then
    raise exception 'service_unavailable' using errcode = 'P0001';
  end if;

  select st.buffer_minutes, st.min_notice_hours, st.max_advance_days
    into v_buffer, v_notice, v_advance
  from public.site_settings st where st.id = 1;
  v_buffer  := coalesce(v_buffer, 10);
  v_notice  := coalesce(v_notice, 12);
  v_advance := coalesce(v_advance, 30);

  -- Window: not too soon, not too far ahead.
  if p_starts_at < now() + make_interval(hours => v_notice)
     or p_starts_at > now() + make_interval(days => v_advance + 1) then
    raise exception 'invalid_time' using errcode = 'P0001';
  end if;

  v_ends  := p_starts_at + make_interval(mins => v_service.duration_minutes);
  v_held  := v_ends + make_interval(mins => v_buffer);

  -- Must fall inside an active weekly window (IST wall-clock, same calendar day).
  v_local     := p_starts_at at time zone 'Asia/Kolkata';
  v_local_end := v_ends at time zone 'Asia/Kolkata';

  select * into v_rule
  from public.availability_rules r
  where r.weekday = extract(dow from v_local)::smallint and r.is_active;

  if not found
     or v_local_end::date <> v_local::date
     or v_local::time < v_rule.start_time
     or v_local_end::time > v_rule.end_time then
    raise exception 'outside_hours' using errcode = 'P0001';
  end if;

  -- Must not touch a blocked day / blocked time range.
  if exists (
    select 1 from public.blocked_dates d
    where d.blocked_on = v_local::date
      and (
        d.start_time is null
        or (v_local::time < d.end_time and v_local_end::time > d.start_time)
      )
  ) then
    raise exception 'blocked' using errcode = 'P0001';
  end if;

  -- Durable abuse backstop (in addition to per-IP limits in the app):
  -- at most 3 open pending requests per e-mail or phone in 24 hours.
  select count(*) into v_recent
  from public.bookings b
  where b.created_at > now() - interval '24 hours'
    and b.status = 'pending'
    and (lower(b.customer_email) = lower(p_email) or b.customer_phone = p_phone);
  if v_recent >= 3 then
    raise exception 'too_many_requests' using errcode = 'P0001';
  end if;

  -- Insert. The exclusion constraint serialises concurrent requests for
  -- overlapping slots: exactly one wins, the others get 'slot_taken'.
  loop
    v_attempt := v_attempt + 1;
    v_code := 'KA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into public.bookings (
        public_code, service_id, service_title, service_price_paise, currency,
        duration_minutes, customer_name, customer_email, customer_phone,
        birth_date, birth_time, birth_place, customer_notes,
        starts_at, ends_at, held_until
      ) values (
        v_code, v_service.id, v_service.title, v_service.price_paise, v_service.currency,
        v_service.duration_minutes, btrim(p_name), btrim(p_email), btrim(p_phone),
        p_birth_date, p_birth_time, nullif(btrim(coalesce(p_birth_place, '')), ''),
        nullif(btrim(coalesce(p_notes, '')), ''),
        p_starts_at, v_ends, v_held
      )
      returning id, access_token into v_id, v_token;
      exit;
    exception
      when exclusion_violation then
        raise exception 'slot_taken' using errcode = 'P0001';
      when unique_violation then
        -- public_code collision (astronomically unlikely): retry with a new code
        if v_attempt >= 5 then raise; end if;
    end;
  end loop;

  return query select v_id, v_code, v_token;
end;
$$;

revoke all on function public.create_booking(uuid, timestamptz, text, text, text, date, time, text, text) from public;
revoke all on function public.create_booking(uuid, timestamptz, text, text, text, date, time, text, text) from anon, authenticated;
grant execute on function public.create_booking(uuid, timestamptz, text, text, text, date, time, text, text) to service_role;
