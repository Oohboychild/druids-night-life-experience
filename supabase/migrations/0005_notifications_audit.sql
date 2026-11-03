-- =====================================================================
-- Migration 0005: notifications (trigger-driven) and audit logs
-- Runs inside one transaction: if anything fails, nothing is applied.
-- Requires migrations 0001 to 0004 (needs public.song_requests).
-- =====================================================================
begin;

-- =====================================================================
-- NOTIFICATIONS
-- =====================================================================
create type public.notification_type as enum (
  'order_received', 'order_accepted', 'order_preparing', 'order_ready',
  'order_delivered', 'order_cancelled',
  'song_received', 'song_accepted', 'song_rejected', 'song_played'
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  club_id     uuid not null references public.clubs (id) on delete cascade,
  type        public.notification_type not null,
  title       text not null,
  body        text,
  ref_type    text not null check (ref_type in ('order', 'song_request')),
  ref_id      uuid not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx  on public.notifications (user_id) where read_at is null;

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;   -- nothing else is editable

alter table public.notifications enable row level security;

create policy "notifications: read own"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications: mark own as read"
  on public.notifications for update to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------- Trigger function: orders ----------
create or replace function public.notify_order_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type   public.notification_type;
  v_title  text;
  v_body   text;
begin
  if new.customer_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_type  := 'order_received';
    v_title := 'Order received';
    v_body  := format('We have received order #%s for %s.', new.order_number, new.table_label);
  else
    case new.status
      when 'accepted' then
        v_type := 'order_accepted';  v_title := 'Order accepted';
        v_body := format('Order #%s has been accepted by our team.', new.order_number);
      when 'preparing' then
        v_type := 'order_preparing'; v_title := 'Order being prepared';
        v_body := format('Order #%s is being prepared.', new.order_number);
      when 'ready' then
        v_type := 'order_ready';     v_title := 'Order ready';
        v_body := format('Order #%s is ready.', new.order_number);
      when 'delivered' then
        v_type := 'order_delivered'; v_title := 'Order delivered';
        v_body := format('Order #%s has been delivered. Enjoy!', new.order_number);
      when 'cancelled' then
        v_type := 'order_cancelled'; v_title := 'Order cancelled';
        v_body := format('Order #%s was cancelled by our staff.%s', new.order_number,
                         case when new.cancel_reason is not null
                              then ' Reason: ' || new.cancel_reason else '' end);
      else
        return new;
    end case;
  end if;

  insert into public.notifications (user_id, club_id, type, title, body, ref_type, ref_id)
  values (new.customer_id, new.club_id, v_type, v_title, v_body, 'order', new.id);

  return new;
end;
$$;

create trigger orders_notify_insert
  after insert on public.orders
  for each row execute function public.notify_order_change();

create trigger orders_notify_status
  after update of status on public.orders
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_order_change();

-- ---------- Trigger function: song requests ----------
create or replace function public.notify_song_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type   public.notification_type;
  v_title  text;
  v_body   text;
begin
  if new.customer_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_type  := 'song_received';
    v_title := 'Request received';
    v_body  := format('"%s" by %s is waiting for the DJ.', new.title, new.artist);
  else
    case new.status
      when 'accepted' then
        v_type := 'song_accepted'; v_title := 'Request accepted';
        v_body := format('The DJ accepted "%s" by %s.', new.title, new.artist);
      when 'rejected' then
        v_type := 'song_rejected'; v_title := 'Request declined';
        v_body := format('The DJ could not play "%s" by %s.', new.title, new.artist);
      when 'played' then
        v_type := 'song_played';   v_title := 'Your song was played';
        v_body := format('"%s" by %s has been played.', new.title, new.artist);
      else
        return new;
    end case;
  end if;

  insert into public.notifications (user_id, club_id, type, title, body, ref_type, ref_id)
  values (new.customer_id, new.club_id, v_type, v_title, v_body, 'song_request', new.id);

  return new;
end;
$$;

create trigger song_requests_notify_insert
  after insert on public.song_requests
  for each row execute function public.notify_song_change();

create trigger song_requests_notify_status
  after update of status on public.song_requests
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_song_change();

revoke execute on function public.notify_order_change() from public, anon, authenticated;
revoke execute on function public.notify_song_change()  from public, anon, authenticated;

alter publication supabase_realtime add table public.notifications;

-- =====================================================================
-- AUDIT LOGS (append-only; no foreign keys so history survives deletions)
-- =====================================================================
create table public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid,
  actor_id     uuid,
  action       text not null check (char_length(action) between 1 and 80),
  entity_type  text not null,
  entity_id    uuid,
  before_data  jsonb,
  after_data   jsonb,
  created_at   timestamptz not null default now()
);

create index audit_logs_club_created_idx on public.audit_logs (club_id, created_at desc);
create index audit_logs_entity_idx       on public.audit_logs (entity_type, entity_id);

create or replace function public.prevent_audit_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs_are_append_only';
end;
$$;

create trigger audit_logs_no_update_delete
  before update or delete on public.audit_logs
  for each row execute function public.prevent_audit_changes();

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

alter table public.audit_logs enable row level security;

create policy "audit_logs: admins read club entries"
  on public.audit_logs for select to authenticated
  using (club_id is not null and public.has_club_role(club_id, array['admin']::public.app_role[]));

create policy "audit_logs: admins read global entries"
  on public.audit_logs for select to authenticated
  using (club_id is null and public.get_my_role() = 'admin');

-- Internal helper: not callable by clients (triggers call it as the function owner)
create or replace function public.write_audit(
  p_club         uuid,
  p_action       text,
  p_entity_type  text,
  p_entity_id    uuid,
  p_before       jsonb,
  p_after        jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (club_id, actor_id, action, entity_type, entity_id, before_data, after_data)
  values (p_club, (select auth.uid()), p_action, p_entity_type, p_entity_id, p_before, p_after)
$$;

revoke execute on function public.write_audit(uuid, text, text, uuid, jsonb, jsonb)
  from public, anon, authenticated;

-- ---------- Audit: order cancellations ----------
create or replace function public.audit_order_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.write_audit(
    new.club_id, 'order.cancelled', 'order', new.id,
    jsonb_build_object('status', old.status, 'total_kes', old.total_kes),
    jsonb_build_object('status', new.status, 'cancel_reason', new.cancel_reason,
                       'cancelled_by', new.cancelled_by)
  );
  return new;
end;
$$;

create trigger orders_audit_cancel
  after update of status on public.orders
  for each row
  when (old.status is distinct from new.status and new.status = 'cancelled')
  execute function public.audit_order_cancel();

-- ---------- Audit: menu price changes ----------
create or replace function public.audit_menu_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.write_audit(
    new.club_id, 'menu_item.price_changed', 'menu_item', new.id,
    jsonb_build_object('name', old.name, 'price_kes', old.price_kes),
    jsonb_build_object('name', new.name, 'price_kes', new.price_kes)
  );
  return new;
end;
$$;

create trigger menu_items_audit_price
  after update of price_kes on public.menu_items
  for each row
  when (old.price_kes is distinct from new.price_kes)
  execute function public.audit_menu_price();

-- ---------- Audit: role / account status changes ----------
create or replace function public.audit_profile_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.write_audit(
    null, 'profile.access_changed', 'profile', new.id,
    jsonb_build_object('role', old.role, 'is_active', old.is_active),
    jsonb_build_object('role', new.role, 'is_active', new.is_active)
  );
  return new;
end;
$$;

create trigger profiles_audit_access
  after update of role, is_active on public.profiles
  for each row
  when (old.role is distinct from new.role or old.is_active is distinct from new.is_active)
  execute function public.audit_profile_access();

-- ---------- Audit: staff assignment changes ----------
create or replace function public.audit_staff_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit(new.club_id, 'staff_assignment.created', 'staff_assignment',
                               new.id, null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.write_audit(new.club_id, 'staff_assignment.updated', 'staff_assignment',
                               new.id, to_jsonb(old), to_jsonb(new));
    return new;
  else
    perform public.write_audit(old.club_id, 'staff_assignment.deleted', 'staff_assignment',
                               old.id, to_jsonb(old), null);
    return old;
  end if;
end;
$$;

create trigger staff_assignments_audit
  after insert or update or delete on public.staff_assignments
  for each row execute function public.audit_staff_assignment();

revoke execute on function public.audit_order_cancel()      from public, anon, authenticated;
revoke execute on function public.audit_menu_price()        from public, anon, authenticated;
revoke execute on function public.audit_profile_access()    from public, anon, authenticated;
revoke execute on function public.audit_staff_assignment()  from public, anon, authenticated;

commit;