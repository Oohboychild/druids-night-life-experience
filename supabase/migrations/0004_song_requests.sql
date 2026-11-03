-- =====================================================================
-- Migration 0004: song requests (free-typed), DJ controls, club settings
-- Runs inside one transaction: if anything fails, nothing is applied.
-- =====================================================================
begin;

create type public.song_status as enum ('pending', 'accepted', 'rejected', 'played');

-- ---------- Club-level settings (admin-editable) ----------
alter table public.clubs
  add column song_requests_enabled   boolean not null default true,
  add column song_queue_public       boolean not null default false,
  add column song_priority_price_kes numeric(10,2)
    check (song_priority_price_kes is null or song_priority_price_kes > 0);

grant update (song_requests_enabled, song_queue_public, song_priority_price_kes)
  on public.clubs to authenticated;
-- (the existing "admins of the club can update" RLS policy still applies)

-- ---------- song_requests ----------
create table public.song_requests (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null references public.clubs (id) on delete restrict,
  table_id            uuid references public.tables (id) on delete set null,
  table_label         text not null,
  customer_id         uuid references public.profiles (id) on delete set null,
  title               text not null check (char_length(title)  between 1 and 120),
  artist              text not null check (char_length(artist) between 1 and 120),
  dedication          text check (dedication is null or char_length(dedication) <= 200),
  status              public.song_status not null default 'pending',
  priority_requested  boolean not null default false,
  priority_paid       boolean not null default false,  -- set only by server payment code (Phase 8)
  dj_priority         integer not null default 0 check (dj_priority between 0 and 100),
  handled_by          uuid references public.profiles (id) on delete set null,
  accepted_at         timestamptz,
  rejected_at         timestamptz,
  played_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index song_requests_club_status_created_idx on public.song_requests (club_id, status, created_at);
create index song_requests_customer_created_idx    on public.song_requests (customer_id, created_at desc);

create trigger song_requests_set_updated_at
  before update on public.song_requests
  for each row execute function public.set_updated_at();

-- ---------- Privileges: clients can only READ ----------
revoke all on public.song_requests from anon, authenticated;
grant select on public.song_requests to authenticated;

alter table public.song_requests enable row level security;

create policy "song_requests: customers read own"
  on public.song_requests for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "song_requests: djs read active or recent club requests"
  on public.song_requests for select to authenticated
  using (
    public.has_club_role(club_id, array['dj']::public.app_role[])
    and (status in ('pending', 'accepted') or created_at > now() - interval '24 hours')
  );

create policy "song_requests: admins read all club requests"
  on public.song_requests for select to authenticated
  using (public.has_club_role(club_id, array['admin']::public.app_role[]));

-- =====================================================================
-- FUNCTIONS
-- =====================================================================

-- ---------- create_song_request ----------
create or replace function public.create_song_request(
  p_table_token  text,
  p_title        text,
  p_artist       text,
  p_dedication   text default null,
  p_priority     boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_table   record;
  v_club    record;
  v_title   text;
  v_artist  text;
  v_ded     text;
  v_id      uuid;
begin
  if v_uid is null or public.get_my_role() is null then
    raise exception 'not_authenticated';
  end if;

  -- Strip control characters and surrounding whitespace
  v_title  := btrim(regexp_replace(coalesce(p_title,  ''), '[[:cntrl:]]', '', 'g'));
  v_artist := btrim(regexp_replace(coalesce(p_artist, ''), '[[:cntrl:]]', '', 'g'));
  v_ded    := nullif(btrim(regexp_replace(coalesce(p_dedication, ''), '[[:cntrl:]]', '', 'g')), '');

  if char_length(v_title)  not between 1 and 120
     or char_length(v_artist) not between 1 and 120 then
    raise exception 'invalid_song';
  end if;

  if v_ded is not null and char_length(v_ded) > 200 then
    raise exception 'dedication_too_long';
  end if;

  select t.id, t.label, t.club_id
    into v_table
    from public.tables t
   where t.qr_token = p_table_token
     and t.is_active;

  if not found then
    raise exception 'invalid_table';
  end if;

  select c.song_requests_enabled, c.song_priority_price_kes
    into v_club
    from public.clubs c
   where c.id = v_table.club_id;

  if not v_club.song_requests_enabled then
    raise exception 'requests_disabled';
  end if;

  if p_priority and v_club.song_priority_price_kes is null then
    raise exception 'priority_not_available';
  end if;

  if (select count(*) from public.song_requests r
       where r.customer_id = v_uid
         and r.status in ('pending', 'accepted')) >= 3 then
    raise exception 'too_many_open_requests';
  end if;

  if exists (
    select 1 from public.song_requests r
     where r.club_id = v_table.club_id
       and r.status in ('pending', 'accepted')
       and lower(r.title)  = lower(v_title)
       and lower(r.artist) = lower(v_artist)
  ) then
    raise exception 'duplicate_request';
  end if;

  insert into public.song_requests
    (club_id, table_id, table_label, customer_id, title, artist, dedication, priority_requested)
  values
    (v_table.club_id, v_table.id, v_table.label, v_uid, v_title, v_artist, v_ded, coalesce(p_priority, false))
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------- set_song_request_status (DJ / admin) ----------
-- pending -> accepted | rejected ; accepted -> played | rejected
create or replace function public.set_song_request_status(p_id uuid, p_status public.song_status)
returns public.song_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_req  public.song_requests;
begin
  select * into v_req from public.song_requests where id = p_id for update;
  if not found then
    raise exception 'request_not_found';
  end if;

  if not public.has_club_role(v_req.club_id, array['dj', 'admin']::public.app_role[]) then
    raise exception 'forbidden';
  end if;

  if not (
       (v_req.status = 'pending'  and p_status in ('accepted', 'rejected'))
    or (v_req.status = 'accepted' and p_status in ('played', 'rejected'))
  ) then
    raise exception 'invalid_transition';
  end if;

  update public.song_requests r
     set status      = p_status,
         handled_by  = v_uid,
         accepted_at = case when p_status = 'accepted' then now() else r.accepted_at end,
         rejected_at = case when p_status = 'rejected' then now() else r.rejected_at end,
         played_at   = case when p_status = 'played'   then now() else r.played_at end
   where r.id = p_id
  returning r.* into v_req;

  return v_req;
end;
$$;

-- ---------- set_song_request_priority (DJ / admin) ----------
create or replace function public.set_song_request_priority(p_id uuid, p_priority integer)
returns public.song_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req  public.song_requests;
begin
  if p_priority is null or p_priority not between 0 and 100 then
    raise exception 'invalid_priority';
  end if;

  select * into v_req from public.song_requests where id = p_id for update;
  if not found then
    raise exception 'request_not_found';
  end if;

  if not public.has_club_role(v_req.club_id, array['dj', 'admin']::public.app_role[]) then
    raise exception 'forbidden';
  end if;

  if v_req.status not in ('pending', 'accepted') then
    raise exception 'invalid_transition';
  end if;

  update public.song_requests r
     set dj_priority = p_priority
   where r.id = p_id
  returning r.* into v_req;

  return v_req;
end;
$$;

-- ---------- get_song_queue (customers; only when the club enables it) ----------
-- Exposes only position, title, artist and "is this mine": no tables, no dedications.
create or replace function public.get_song_queue(p_club_id uuid)
returns table (queue_position bigint, title text, artist text, is_mine boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select q.queue_position, q.title, q.artist, q.is_mine
    from (
      select row_number() over (
               order by r.priority_paid desc, r.dj_priority desc, r.created_at asc
             ) as queue_position,
             r.title,
             r.artist,
             (r.customer_id = (select auth.uid())) as is_mine
        from public.song_requests r
        join public.clubs c on c.id = r.club_id
       where r.club_id = p_club_id
         and r.status = 'accepted'
         and c.song_queue_public
         and public.get_my_role() is not null
    ) q
   order by q.queue_position
   limit 50
$$;

-- ---------- Function permissions ----------
revoke execute on function public.create_song_request(text, text, text, text, boolean) from public, anon;
revoke execute on function public.set_song_request_status(uuid, public.song_status)    from public, anon;
revoke execute on function public.set_song_request_priority(uuid, integer)             from public, anon;
revoke execute on function public.get_song_queue(uuid)                                 from public, anon;

grant execute on function public.create_song_request(text, text, text, text, boolean) to authenticated;
grant execute on function public.set_song_request_status(uuid, public.song_status)    to authenticated;
grant execute on function public.set_song_request_priority(uuid, integer)             to authenticated;
grant execute on function public.get_song_queue(uuid)                                 to authenticated;

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.song_requests;

commit;