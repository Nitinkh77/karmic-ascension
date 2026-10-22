-- ============================================================================
-- Karmic Ascension – core schema
-- Conventions: all instants are timestamptz (UTC). Business time zone is
-- Asia/Kolkata (IST, UTC+05:30, no DST). Money is stored as integer paise.
-- ============================================================================

create extension if not exists btree_gist;

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles (one row per auth user; role is NEVER taken from client input)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user gets a plain 'user' profile. Promotion to admin is a
-- deliberate SQL step (see README) and cannot be triggered from the browser.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- media_assets (metadata for files in the 'site-media' storage bucket)
-- ----------------------------------------------------------------------------
create table public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null unique,
  folder        text not null default 'general',
  alt_text      text not null default '',
  mime_type     text,
  size_bytes    integer check (size_bytes is null or size_bytes >= 0),
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- site_settings (single row, id = 1)
-- ----------------------------------------------------------------------------
create table public.site_settings (
  id                      integer primary key default 1 check (id = 1),
  brand_name              text not null default 'Karmic Ascension – Vedic Astrology™',
  tagline                 text not null default 'Resolve Pending Karma',
  description             text not null default '',
  contact_email           text,
  contact_phone           text,
  whatsapp_number         text,            -- digits only, with country code
  address                 text,
  hours_text              text,
  facebook_url            text,
  instagram_url           text,
  youtube_url             text,
  astrosage_url           text,
  paytm_phonepe_number    text,
  gpay_upi_id             text,
  payment_instructions    text,
  razorpay_link           text,
  timezone                text not null default 'Asia/Kolkata',
  slot_minutes            integer not null default 30  check (slot_minutes between 5 and 240),
  buffer_minutes          integer not null default 10  check (buffer_minutes between 0 and 120),
  min_notice_hours        integer not null default 12  check (min_notice_hours between 0 and 720),
  max_advance_days        integer not null default 30  check (max_advance_days between 1 and 365),
  booking_policy_text     text,
  announcement_text       text,
  announcement_href       text,
  announcement_active     boolean not null default false,
  footer_text             text,
  seo_title               text,
  seo_description         text,
  og_image_asset_id       uuid references public.media_assets (id) on delete set null,
  updated_at              timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- pages & page_sections (editable content)
-- ----------------------------------------------------------------------------
create table public.pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title            text not null,
  meta_title       text,
  meta_description text,
  is_published     boolean not null default true,
  is_draft         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

create table public.page_sections (
  id              uuid primary key default gen_random_uuid(),
  page_id         uuid not null references public.pages (id) on delete cascade,
  section_key     text not null check (section_key ~ '^[a-z0-9_]+$'),
  eyebrow         text,
  heading         text,
  body            text,
  items           jsonb not null default '[]'::jsonb,
  cta_label       text,
  cta_href        text,
  image_asset_id  uuid references public.media_assets (id) on delete set null,
  sort_order      integer not null default 0,
  is_visible      boolean not null default true,
  is_draft        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (page_id, section_key)
);

create index page_sections_page_idx on public.page_sections (page_id, sort_order);

create trigger page_sections_set_updated_at
  before update on public.page_sections
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- services
-- ----------------------------------------------------------------------------
create table public.services (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title                    text not null check (char_length(title) between 2 and 160),
  short_description        text not null default '',
  description              text not null default '',
  price_paise              integer check (price_paise is null or price_paise >= 0),  -- null = "price on request"
  currency                 text not null default 'INR' check (currency in ('INR')),
  duration_minutes         integer not null default 30 check (duration_minutes between 10 and 480),
  features                 jsonb not null default '[]'::jsonb,
  deliverables             jsonb not null default '[]'::jsonb,
  image_asset_id           uuid references public.media_assets (id) on delete set null,
  status                   text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured              boolean not null default false,
  requires_birth_details   boolean not null default true,
  is_draft                 boolean not null default false,  -- copy/price/duration still need owner review
  sort_order               integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index services_listing_idx on public.services (status, sort_order);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- faqs (optionally attached to one service = "service FAQs")
-- ----------------------------------------------------------------------------
create table public.faqs (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid references public.services (id) on delete cascade,
  question      text not null check (char_length(question) between 3 and 300),
  answer        text not null check (char_length(answer) >= 1),
  sort_order    integer not null default 0,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index faqs_listing_idx on public.faqs (is_published, sort_order);

create trigger faqs_set_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- testimonials — can only be published once marked verified (DB-enforced)
-- ----------------------------------------------------------------------------
create table public.testimonials (
  id             uuid primary key default gen_random_uuid(),
  author_name    text not null check (char_length(author_name) between 1 and 120),
  author_detail  text,
  quote          text not null check (char_length(quote) >= 3),
  rating         smallint check (rating is null or rating between 1 and 5),
  source         text,                              -- where the owner verified it (e.g. "Instagram DM")
  is_verified    boolean not null default false,
  is_published   boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint testimonials_publish_requires_verified check (not is_published or is_verified)
);

create index testimonials_listing_idx on public.testimonials (is_published, sort_order);

create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- availability
-- weekday: 0 = Sunday … 6 = Saturday (IST wall-clock times)
-- ----------------------------------------------------------------------------
create table public.availability_rules (
  id          uuid primary key default gen_random_uuid(),
  weekday     smallint not null unique check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  is_active   boolean not null default false,
  updated_at  timestamptz not null default now(),
  constraint availability_rules_order check (end_time > start_time)
);

create trigger availability_rules_set_updated_at
  before update on public.availability_rules
  for each row execute function public.set_updated_at();

-- A blocked day (start/end null) or a blocked time range on a day (IST).
create table public.blocked_dates (
  id          uuid primary key default gen_random_uuid(),
  blocked_on  date not null,
  start_time  time,
  end_time    time,
  reason      text,
  created_at  timestamptz not null default now(),
  constraint blocked_dates_range_pair check ((start_time is null) = (end_time is null)),
  constraint blocked_dates_range_order check (start_time is null or end_time > start_time)
);

create index blocked_dates_day_idx on public.blocked_dates (blocked_on);

-- ----------------------------------------------------------------------------
-- bookings
--   * service name / price / duration are SNAPSHOTS taken at booking time
--   * a booking holds [starts_at, held_until) where held_until = end + buffer
--   * the exclusion constraint makes double-booking impossible at DB level
-- ----------------------------------------------------------------------------
create table public.bookings (
  id                   uuid primary key default gen_random_uuid(),
  public_code          text not null unique,
  access_token         uuid not null default gen_random_uuid(),
  service_id           uuid references public.services (id) on delete set null,
  service_title        text not null,
  service_price_paise  integer check (service_price_paise is null or service_price_paise >= 0),
  currency             text not null default 'INR',
  duration_minutes     integer not null check (duration_minutes > 0),
  customer_name        text not null check (char_length(customer_name) between 2 and 120),
  customer_email       text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone       text not null check (char_length(customer_phone) between 7 and 20),
  birth_date           date,
  birth_time           time,
  birth_place          text,
  customer_notes       text,
  starts_at            timestamptz not null,
  ends_at              timestamptz not null,
  held_until           timestamptz not null,
  status               text not null default 'pending'
                         check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status       text not null default 'unpaid'
                         check (payment_status in ('unpaid', 'pending_verification', 'paid', 'refunded', 'waived')),
  payment_method       text not null default 'manual' check (payment_method in ('manual', 'razorpay')),
  admin_notes          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint bookings_time_order check (ends_at > starts_at and held_until >= ends_at),
  constraint bookings_no_overlap
    exclude using gist (tstzrange(starts_at, held_until, '[)') with &&)
    where (status in ('pending', 'confirmed'))
);

create index bookings_starts_idx on public.bookings (starts_at);
create index bookings_status_idx on public.bookings (status, payment_status);
create index bookings_email_idx on public.bookings (lower(customer_email));
create index bookings_service_idx on public.bookings (service_id);
create index bookings_created_idx on public.bookings (created_at desc);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- Audit trail: every status / payment / time change is recorded.
create table public.booking_events (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings (id) on delete cascade,
  event_type   text not null,
  from_value   text,
  to_value     text,
  note         text,
  actor_id     uuid,
  created_at   timestamptz not null default now()
);

create index booking_events_booking_idx on public.booking_events (booking_id, created_at desc);
create index booking_events_recent_idx on public.booking_events (created_at desc);

create or replace function public.log_booking_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    insert into public.booking_events (booking_id, event_type, to_value, actor_id)
    values (new.id, 'created', new.status, v_actor);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.booking_events (booking_id, event_type, from_value, to_value, actor_id)
    values (new.id, 'status', old.status, new.status, v_actor);
  end if;
  if new.payment_status is distinct from old.payment_status then
    insert into public.booking_events (booking_id, event_type, from_value, to_value, actor_id)
    values (new.id, 'payment', old.payment_status, new.payment_status, v_actor);
  end if;
  if new.starts_at is distinct from old.starts_at then
    insert into public.booking_events (booking_id, event_type, from_value, to_value, actor_id)
    values (new.id, 'rescheduled', old.starts_at::text, new.starts_at::text, v_actor);
  end if;
  if new.admin_notes is distinct from old.admin_notes then
    insert into public.booking_events (booking_id, event_type, note, actor_id)
    values (new.id, 'note', 'Admin note updated', v_actor);
  end if;
  return new;
end;
$$;

create trigger bookings_log_events
  after insert or update on public.bookings
  for each row execute function public.log_booking_events();

-- ----------------------------------------------------------------------------
-- payments (provider-agnostic; "manual" now, "razorpay" later)
-- ----------------------------------------------------------------------------
create table public.payments (
  id                          uuid primary key default gen_random_uuid(),
  booking_id                  uuid not null references public.bookings (id) on delete cascade,
  provider                    text not null default 'manual' check (provider in ('manual', 'razorpay')),
  amount_paise                integer not null check (amount_paise >= 0),
  currency                    text not null default 'INR',
  status                      text not null default 'created'
                                check (status in ('created', 'pending_verification', 'verified', 'failed', 'refunded')),
  provider_order_id           text,
  provider_payment_id         text,
  signature_verified          boolean not null default false,
  reference                   text,           -- e.g. UPI transaction reference entered by admin
  raw                         jsonb not null default '{}'::jsonb,
  created_by                  uuid references auth.users (id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index payments_booking_idx on public.payments (booking_id);
-- Idempotency: the same provider payment/order can only be recorded once.
create unique index payments_provider_payment_uidx
  on public.payments (provider, provider_payment_id) where provider_payment_id is not null;
create unique index payments_provider_order_uidx
  on public.payments (provider, provider_order_id) where provider_order_id is not null;

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
