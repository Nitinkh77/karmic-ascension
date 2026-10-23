-- ============================================================================
-- Explicit table privileges (least privilege)
--
-- WHY THIS EXISTS
-- Row Level Security decides WHICH ROWS a role may touch, but Postgres first
-- requires the role to hold the table privilege (SELECT / INSERT / ...).
-- Earlier migrations relied on Supabase granting these automatically; on
-- projects where that is not the case every query fails with
--   42501 permission denied for table <name>
-- This migration grants only what the application uses. RLS stays enabled on
-- every table and remains the row-level gatekeeper. Safe to re-run.
--
-- NOTE FOR FUTURE TABLES: new tables get NO privileges by default; add an
-- explicit GRANT here (or in a new migration) when you create one.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Policies call is_admin(); every role that evaluates them must be allowed to run it.
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---- Public content: anonymous + signed-in visitors may READ (RLS filters rows) ----
grant select on
  public.site_settings,
  public.pages,
  public.page_sections,
  public.media_assets,
  public.services,
  public.faqs,
  public.testimonials,
  public.availability_rules
to anon, authenticated;

-- ---- Admin-managed content: writes only for the signed-in role. ----
-- Non-admins still cannot write: every one of these tables has an
-- is_admin()-only write policy, so these grants alone do nothing for them.
grant update                         on public.site_settings      to authenticated;
grant insert, update                 on public.pages              to authenticated;
grant insert, update                 on public.page_sections      to authenticated;
grant insert, update, delete         on public.media_assets       to authenticated;
grant insert, update, delete         on public.services           to authenticated;
grant insert, update, delete         on public.faqs               to authenticated;
grant insert, update, delete         on public.testimonials       to authenticated;
grant insert, update                 on public.availability_rules to authenticated;

-- ---- Private data: admin only (via RLS). Anonymous gets NOTHING. ----
grant select, insert, delete         on public.blocked_dates      to authenticated;
grant select, update                 on public.bookings           to authenticated;
grant select                         on public.booking_events     to authenticated;
grant select, insert, update         on public.payments           to authenticated;
-- Users may read their own profile (needed to resolve their role). No update
-- grant: nobody can change a role through the API.
grant select                         on public.profiles           to authenticated;

-- ---- Trusted server code (service role bypasses RLS but still needs privileges) ----
grant all on all tables in schema public to service_role;
