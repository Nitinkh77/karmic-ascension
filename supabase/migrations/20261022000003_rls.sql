-- ============================================================================
-- Row Level Security
--   * RLS is ENABLED on every table. It is never disabled.
--   * Anonymous visitors can read only published content and active services.
--   * Customer data (bookings, payments, booking_events) is admin-only.
--   * "Admin" is decided by public.is_admin(), which reads profiles.role on the
--     server side of the database. A client can never supply its own role.
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.site_settings       enable row level security;
alter table public.pages               enable row level security;
alter table public.page_sections       enable row level security;
alter table public.media_assets        enable row level security;
alter table public.services            enable row level security;
alter table public.faqs                enable row level security;
alter table public.testimonials        enable row level security;
alter table public.availability_rules  enable row level security;
alter table public.blocked_dates       enable row level security;
alter table public.bookings            enable row level security;
alter table public.booking_events      enable row level security;
alter table public.payments            enable row level security;

-- ---- profiles --------------------------------------------------------------
-- Users may read their own profile (needed to resolve their role).
-- There is deliberately NO update/insert policy for non-admins, so nobody can
-- promote themselves. Admins may read/update profiles.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy profiles_admin_update on public.profiles
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- site_settings ---------------------------------------------------------
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);

create policy site_settings_admin_write on public.site_settings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- pages -----------------------------------------------------------------
create policy pages_public_read on public.pages
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy pages_admin_write on public.pages
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- page_sections ---------------------------------------------------------
create policy page_sections_public_read on public.page_sections
  for select to anon, authenticated
  using (
    (is_visible and exists (
      select 1 from public.pages p where p.id = page_id and p.is_published
    ))
    or (select public.is_admin())
  );

create policy page_sections_admin_write on public.page_sections
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- media_assets (metadata is not sensitive; files live in a public bucket)
create policy media_assets_public_read on public.media_assets
  for select to anon, authenticated using (true);

create policy media_assets_admin_write on public.media_assets
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- services --------------------------------------------------------------
create policy services_public_read on public.services
  for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy services_admin_write on public.services
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- faqs ------------------------------------------------------------------
create policy faqs_public_read on public.faqs
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy faqs_admin_write on public.faqs
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- testimonials (publicly visible only if published AND verified) --------
create policy testimonials_public_read on public.testimonials
  for select to anon, authenticated
  using ((is_published and is_verified) or (select public.is_admin()));

create policy testimonials_admin_write on public.testimonials
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- availability_rules (working hours are public information) -------------
create policy availability_rules_public_read on public.availability_rules
  for select to anon, authenticated using (true);

create policy availability_rules_admin_write on public.availability_rules
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- blocked_dates (reasons may be private → admin only; public sees ranges
--      through get_unavailable()) -------------------------------------------
create policy blocked_dates_admin_all on public.blocked_dates
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- bookings / booking_events / payments: ADMIN ONLY ----------------------
-- No anon policies exist, so anonymous visitors cannot read, insert, update or
-- delete. Public booking creation goes through create_booking() (service role).
create policy bookings_admin_all on public.bookings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy booking_events_admin_select on public.booking_events
  for select to authenticated
  using ((select public.is_admin()));

create policy payments_admin_all on public.payments
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---- Table privileges: least privilege on top of RLS -----------------------
revoke all on public.bookings, public.booking_events, public.payments, public.blocked_dates, public.profiles
  from anon;
revoke insert, update, delete on
  public.site_settings, public.pages, public.page_sections, public.media_assets,
  public.services, public.faqs, public.testimonials, public.availability_rules
  from anon;
