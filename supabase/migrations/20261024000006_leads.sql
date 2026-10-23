-- ============================================================================
-- Lead generation: enquiries from the website, managed in the admin dashboard.
-- Idempotent (safe to re-run). RLS on; only admins can read or change leads.
-- Visitors never touch the table directly: the server calls create_lead() with
-- the service-role key after validating the form.
-- ============================================================================

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 2 and 120),
  email       text check (email is null or char_length(email) between 5 and 200),
  phone       text check (phone is null or phone ~ '^\+?[0-9()\-\s]{7,20}$'),
  message     text check (message is null or char_length(message) <= 1000),
  service_id  uuid references public.services (id) on delete set null,
  source      text not null default 'website' check (char_length(source) between 1 and 60),
  status      text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  consent     boolean not null default false,          -- agreed to be contacted
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint leads_contactable check (email is not null or phone is not null)
);

create index if not exists leads_status_created_idx on public.leads (status, created_at desc);
create index if not exists leads_created_idx on public.leads (created_at desc);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

drop policy if exists leads_admin_all on public.leads;
create policy leads_admin_all on public.leads
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Least privilege: admins (authenticated + is_admin) read/update/delete. Nobody inserts directly.
revoke all on public.leads from anon, authenticated;
grant select, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;

-- Public enquiry submission. Executable by the server (service_role) only.
create or replace function public.create_lead(
  p_name       text,
  p_email      text,
  p_phone      text,
  p_message    text,
  p_service_id uuid,
  p_source     text,
  p_consent    boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_recent int;
begin
  if p_consent is not true then
    raise exception 'consent_required';
  end if;
  if v_email is null and v_phone is null then
    raise exception 'contact_required';
  end if;

  -- Durable throttle: at most 3 enquiries per e-mail / phone per 24 hours.
  select count(*) into v_recent
  from public.leads
  where created_at > now() - interval '24 hours'
    and ((v_email is not null and email = v_email) or (v_phone is not null and phone = v_phone));
  if v_recent >= 3 then
    raise exception 'too_many_requests';
  end if;

  insert into public.leads (name, email, phone, message, service_id, source, consent)
  values (
    btrim(p_name), v_email, v_phone, nullif(btrim(coalesce(p_message, '')), ''),
    (select s.id from public.services s where s.id = p_service_id),
    coalesce(nullif(btrim(coalesce(p_source, '')), ''), 'website'),
    true
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_lead(text, text, text, text, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.create_lead(text, text, text, text, uuid, text, boolean) to service_role;
