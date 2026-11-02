-- =====================================================================
-- Migration 0001: foundation (clubs, profiles, staff_assignments, tables)
-- Runs inside one transaction: if anything fails, nothing is applied.
-- =====================================================================
begin;

-- ---------- Enum ----------
create type public.app_role as enum ('customer', 'waiter', 'dj', 'admin');

-- ---------- Shared trigger: keep updated_at fresh ----------
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

-- ---------- clubs ----------
create table public.clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 100),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  timezone    text not null default 'Africa/Nairobi',
  currency    text not null default 'KES' check (currency = 'KES'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger clubs_set_updated_at
  before update on public.clubs
  for each row execute function public.set_updated_at();

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          public.app_role not null default 'customer',
  display_name  text check (display_name is null or char_length(display_name) <= 80),
  phone         text check (phone is null or phone ~ '^(\+254|0)[17][0-9]{8}$'),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user (including anonymous) gets a profile.
-- The role is ALWAYS 'customer' here, never read from user-supplied metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- staff_assignments ----------
create table public.staff_assignments (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  club_id     uuid not null references public.clubs (id) on delete cascade,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (profile_id, club_id)
);

create index staff_assignments_profile_idx on public.staff_assignments (profile_id);
create index staff_assignments_club_idx    on public.staff_assignments (club_id);

create trigger staff_assignments_set_updated_at
  before update on public.staff_assignments
  for each row execute function public.set_updated_at();

-- ---------- tables (physical tables in the club) ----------
create table public.tables (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs (id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 40),
  qr_token    text not null unique
              default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (club_id, label)
);

create index tables_club_idx on public.tables (club_id);

create trigger tables_set_updated_at
  before update on public.tables
  for each row execute function public.set_updated_at();

-- ---------- RLS helper functions ----------
-- SECURITY DEFINER lets them read profiles/staff_assignments without
-- recursing into those tables' own RLS policies.

create or replace function public.get_my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
$$;

create or replace function public.has_club_role(p_club uuid, p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_assignments sa
    join public.profiles p on p.id = sa.profile_id
    where sa.profile_id = (select auth.uid())
      and sa.club_id    = p_club
      and sa.is_active
      and p.is_active
      and p.role = any (p_roles)
  )
$$;

revoke execute on function public.get_my_role()                           from public, anon;
revoke execute on function public.has_club_role(uuid, public.app_role[])  from public, anon;
grant  execute on function public.get_my_role()                           to authenticated;
grant  execute on function public.has_club_role(uuid, public.app_role[])  to authenticated;

-- ---------- Table privileges (column-level where it matters) ----------
revoke all on public.clubs             from anon, authenticated;
revoke all on public.profiles          from anon, authenticated;
revoke all on public.staff_assignments from anon, authenticated;
revoke all on public.tables            from anon, authenticated;

grant select on public.clubs to authenticated;
grant update (name) on public.clubs to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, phone) on public.profiles to authenticated;   -- NOT role, NOT is_active

grant select on public.staff_assignments to authenticated;

-- qr_token is deliberately excluded from every grant below
grant select (id, club_id, label, is_active, created_at, updated_at) on public.tables to authenticated;
grant insert (club_id, label, is_active) on public.tables to authenticated;
grant update (label, is_active)          on public.tables to authenticated;
grant delete on public.tables to authenticated;

-- ---------- Enable RLS ----------
alter table public.clubs             enable row level security;
alter table public.profiles          enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.tables            enable row level security;

-- ---------- Policies: clubs ----------
create policy "clubs: any signed-in user can read"
  on public.clubs for select to authenticated
  using (true);

create policy "clubs: admins of the club can update"
  on public.clubs for update to authenticated
  using      (public.has_club_role(id, array['admin']::public.app_role[]))
  with check (public.has_club_role(id, array['admin']::public.app_role[]));

-- ---------- Policies: profiles ----------
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: admins read all"
  on public.profiles for select to authenticated
  using (public.get_my_role() = 'admin');

create policy "profiles: update own (name/phone only, via column grants)"
  on public.profiles for update to authenticated
  using      (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- Policies: staff_assignments (read-only from clients) ----------
create policy "staff_assignments: read own"
  on public.staff_assignments for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "staff_assignments: admins read their club"
  on public.staff_assignments for select to authenticated
  using (public.has_club_role(club_id, array['admin']::public.app_role[]));

-- ---------- Policies: tables ----------
create policy "tables: club staff can read"
  on public.tables for select to authenticated
  using (public.has_club_role(club_id, array['waiter','dj','admin']::public.app_role[]));

create policy "tables: admins can insert"
  on public.tables for insert to authenticated
  with check (public.has_club_role(club_id, array['admin']::public.app_role[]));

create policy "tables: admins can update"
  on public.tables for update to authenticated
  using      (public.has_club_role(club_id, array['admin']::public.app_role[]))
  with check (public.has_club_role(club_id, array['admin']::public.app_role[]));

create policy "tables: admins can delete"
  on public.tables for delete to authenticated
  using (public.has_club_role(club_id, array['admin']::public.app_role[]));

-- ---------- QR scan: token -> table (the only way customers learn a table) ----------
create or replace function public.resolve_table_by_token(p_token text)
returns table (table_id uuid, table_label text, club_id uuid, club_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.label, c.id, c.name
  from public.tables t
  join public.clubs c on c.id = t.club_id
  where t.qr_token = p_token
    and t.is_active
$$;

revoke execute on function public.resolve_table_by_token(text) from public, anon;
grant  execute on function public.resolve_table_by_token(text) to authenticated;

-- ---------- Initial club row ----------
insert into public.clubs (name, slug)
values ('Druids Lounge', 'druids-lounge');

commit;