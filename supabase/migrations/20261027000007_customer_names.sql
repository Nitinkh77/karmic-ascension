-- Keep the customer's name (Google gives one) on their profile, and fill in existing accounts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- One-off backfill for accounts created before this change (run in the SQL Editor, which has access to auth.users).
update public.profiles p
set full_name = nullif(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), '')
from auth.users u
where u.id = p.id and p.full_name is null;
