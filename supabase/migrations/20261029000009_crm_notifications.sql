-- ============================================================================
-- Admin CRM + notifications
--   * Private astrological case record and remedies on each booking
--   * Follow-up reminders (30 / 90 days or any date)
--   * Google review request tracking
--   * Booking-alert tracking (so an e-mail is never sent twice)
--   * Two new settings: Google review link, e-mail address for alerts
-- Idempotent (safe to re-run). Bookings are already admin-only under RLS, so the
-- new columns inherit that: customers can never read case notes.
-- Run in Supabase -> SQL Editor.
-- ============================================================================

alter table public.bookings
  add column if not exists case_lagna           text check (case_lagna is null or char_length(case_lagna) <= 120),
  add column if not exists case_rashi           text check (case_rashi is null or char_length(case_rashi) <= 120),
  add column if not exists case_dasha           text check (case_dasha is null or char_length(case_dasha) <= 160),
  add column if not exists case_observations    text check (case_observations is null or char_length(case_observations) <= 4000),
  add column if not exists case_pending_karma   text check (case_pending_karma is null or char_length(case_pending_karma) <= 4000),
  add column if not exists remedy_gemstones     text check (remedy_gemstones is null or char_length(remedy_gemstones) <= 1500),
  add column if not exists remedy_mantras       text check (remedy_mantras is null or char_length(remedy_mantras) <= 1500),
  add column if not exists remedy_fasts         text check (remedy_fasts is null or char_length(remedy_fasts) <= 1500),
  add column if not exists remedy_donations     text check (remedy_donations is null or char_length(remedy_donations) <= 1500),
  add column if not exists follow_up_on         date,
  add column if not exists follow_up_done       boolean not null default false,
  add column if not exists review_requested_at  timestamptz,
  add column if not exists notified_admin_at    timestamptz,
  add column if not exists notified_customer_at timestamptz;

create index if not exists bookings_followup_idx
  on public.bookings (follow_up_on)
  where follow_up_on is not null and not follow_up_done;

create index if not exists bookings_phone_idx on public.bookings (customer_phone);

alter table public.site_settings
  add column if not exists google_review_url text check (google_review_url is null or char_length(google_review_url) <= 400),
  add column if not exists notify_email      text check (notify_email is null or char_length(notify_email) <= 200),
  add column if not exists google_business_url text check (google_business_url is null or char_length(google_business_url) <= 400),
  add column if not exists google_rating numeric(2,1) check (google_rating is null or (google_rating >= 1 and google_rating <= 5)),
  add column if not exists google_review_count integer check (google_review_count is null or google_review_count >= 0);
