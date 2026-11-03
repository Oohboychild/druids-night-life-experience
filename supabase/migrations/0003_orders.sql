-- =====================================================================
-- Migration 0003: orders, order_items, payments + order functions
-- Runs inside one transaction: if anything fails, nothing is applied.
-- =====================================================================
begin;

-- ---------- Enums ----------
create type public.order_status as enum
  ('pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled');
create type public.payment_method as enum ('mpesa', 'cash');
create type public.order_payment_status as enum ('unpaid', 'paid');
create type public.payment_attempt_status as enum ('pending', 'succeeded', 'failed', 'cancelled');

-- ---------- orders ----------
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    bigint generated always as identity unique,
  club_id         uuid not null references public.clubs (id) on delete restrict,
  table_id        uuid references public.tables (id) on delete set null,
  table_label     text not null,
  customer_id     uuid references public.profiles (id) on delete set null,
  status          public.order_status not null default 'pending',
  payment_method  public.payment_method not null,
  payment_status  public.order_payment_status not null default 'unpaid',
  total_kes       numeric(12,2) not null default 0 check (total_kes >= 0),
  notes           text check (notes is null or char_length(notes) <= 300),
  claimed_by      uuid references public.profiles (id) on delete set null,
  claimed_at      timestamptz,
  accepted_at     timestamptz,
  preparing_at    timestamptz,
  ready_at        timestamptz,
  delivered_at    timestamptz,
  cancelled_at    timestamptz,
  cancelled_by    uuid references public.profiles (id) on delete set null,
  cancel_reason   text check (cancel_reason is null or char_length(cancel_reason) <= 200),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index orders_club_status_created_idx on public.orders (club_id, status, created_at desc);
create index orders_customer_created_idx    on public.orders (customer_id, created_at desc);
create index orders_table_idx               on public.orders (table_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------- order_items (price snapshot) ----------
create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  menu_item_id    uuid references public.menu_items (id) on delete set null,
  name            text not null,
  unit_price_kes  numeric(10,2) not null check (unit_price_kes >= 0),
  quantity        integer not null check (quantity between 1 and 50),
  line_total_kes  numeric(12,2) generated always as (unit_price_kes * quantity) stored,
  created_at      timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------- payments (structure only; written by server code in Phase 8) ----------
create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  club_id               uuid not null references public.clubs (id) on delete restrict,
  order_id              uuid not null references public.orders (id) on delete restrict,
  method                public.payment_method not null,
  status                public.payment_attempt_status not null default 'pending',
  amount_kes            numeric(10,2) not null check (amount_kes > 0),
  phone                 text check (phone is null or phone ~ '^254[17][0-9]{8}$'),
  checkout_request_id   text unique,
  merchant_request_id   text,
  mpesa_receipt         text unique,
  result_code           integer,
  result_desc           text,
  raw_callback          jsonb,
  recorded_by           uuid references public.profiles (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);
create index payments_club_created_idx on public.payments (club_id, created_at desc);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------- Privileges: clients can only READ ----------
revoke all on public.orders      from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
revoke all on public.payments    from anon, authenticated;

grant select on public.orders      to authenticated;
grant select on public.order_items to authenticated;
-- payments: no phone numbers, raw callbacks or internal request ids
grant select (id, order_id, method, status, amount_kes, mpesa_receipt, created_at, updated_at)
  on public.payments to authenticated;

-- ---------- RLS ----------
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.payments    enable row level security;

create policy "orders: customers read own"
  on public.orders for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "orders: waiters read active or recent club orders"
  on public.orders for select to authenticated
  using (
    public.has_club_role(club_id, array['waiter']::public.app_role[])
    and (status in ('pending', 'accepted', 'preparing', 'ready')
         or created_at > now() - interval '24 hours')
  );

create policy "orders: admins read all club orders"
  on public.orders for select to authenticated
  using (public.has_club_role(club_id, array['admin']::public.app_role[]));

create policy "order_items: readable when the parent order is readable"
  on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy "payments: customers read payments of own orders"
  on public.payments for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = (select auth.uid())
  ));

create policy "payments: admins read club payments"
  on public.payments for select to authenticated
  using (public.has_club_role(club_id, array['admin']::public.app_role[]));

-- =====================================================================
-- FUNCTIONS (the only way orders are created or changed)
-- =====================================================================

-- ---------- create_order ----------
-- p_items format: [{"item_id": "<uuid>", "quantity": 2}, ...]
-- Prices and totals ALWAYS come from menu_items, never from the caller.
create or replace function public.create_order(
  p_table_token     text,
  p_items           jsonb,
  p_payment_method  public.payment_method,
  p_notes           text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_table      record;
  v_order_id   uuid;
  v_requested  integer;
  v_inserted   integer;
begin
  if v_uid is null or public.get_my_role() is null then
    raise exception 'not_authenticated';
  end if;

  if p_notes is not null and char_length(p_notes) > 300 then
    raise exception 'notes_too_long';
  end if;

  -- Validate the items payload; any malformed input becomes 'invalid_items'
  begin
    if p_items is null
       or jsonb_typeof(p_items) <> 'array'
       or jsonb_array_length(p_items) not between 1 and 30 then
      raise exception 'bad shape';
    end if;

    if exists (
      select 1 from jsonb_array_elements(p_items) e
      where jsonb_typeof(e) <> 'object'
         or (e->>'item_id')::uuid is null
         or (e->>'quantity')::integer is null
         or (e->>'quantity')::integer not between 1 and 50
    ) then
      raise exception 'bad element';
    end if;

    if exists (
      select 1 from jsonb_array_elements(p_items) e
      group by (e->>'item_id')::uuid
      having sum((e->>'quantity')::integer) > 50
    ) then
      raise exception 'quantity too high';
    end if;

    select count(distinct (e->>'item_id')::uuid)
      into v_requested
      from jsonb_array_elements(p_items) e;
  exception when others then
    raise exception 'invalid_items';
  end;

  select t.id, t.label, t.club_id
    into v_table
    from public.tables t
   where t.qr_token = p_table_token
     and t.is_active;

  if not found then
    raise exception 'invalid_table';
  end if;

  if (select count(*) from public.orders o
       where o.customer_id = v_uid
         and o.status in ('pending', 'accepted', 'preparing', 'ready')) >= 5 then
    raise exception 'too_many_open_orders';
  end if;

  insert into public.orders (club_id, table_id, table_label, customer_id, payment_method, notes)
  values (v_table.club_id, v_table.id, v_table.label, v_uid, p_payment_method,
          nullif(btrim(p_notes), ''))
  returning id into v_order_id;

  insert into public.order_items (order_id, menu_item_id, name, unit_price_kes, quantity)
  select v_order_id, mi.id, mi.name, mi.price_kes, r.qty
    from (
      select (e->>'item_id')::uuid as item_id,
             sum((e->>'quantity')::integer)::integer as qty
        from jsonb_array_elements(p_items) e
       group by 1
    ) r
    join public.menu_items mi
      on mi.id = r.item_id
     and mi.club_id = v_table.club_id
     and mi.is_available;

  get diagnostics v_inserted = row_count;
  if v_inserted <> v_requested then
    raise exception 'item_unavailable';   -- rolls back the whole order
  end if;

  update public.orders o
     set total_kes = (select coalesce(sum(oi.line_total_kes), 0)
                        from public.order_items oi
                       where oi.order_id = v_order_id)
   where o.id = v_order_id;

  return v_order_id;
end;
$$;

-- ---------- claim_order ----------
-- Atomic: if two waiters tap Accept at once, exactly one UPDATE matches.
create or replace function public.claim_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_club     uuid;
  v_order    public.orders;
  v_claimer  text;
begin
  select o.club_id into v_club from public.orders o where o.id = p_order_id;

  if v_club is null
     or not public.has_club_role(v_club, array['waiter', 'admin']::public.app_role[]) then
    raise exception 'forbidden';
  end if;

  update public.orders o
     set status      = 'accepted',
         claimed_by  = v_uid,
         claimed_at  = now(),
         accepted_at = now()
   where o.id = p_order_id
     and o.status = 'pending'
     and o.claimed_by is null
  returning o.* into v_order;

  if not found then
    select p.display_name into v_claimer
      from public.orders o
      left join public.profiles p on p.id = o.claimed_by
     where o.id = p_order_id;
    raise exception 'order_unavailable' using detail = coalesce(v_claimer, '');
  end if;

  return v_order;
end;
$$;

-- ---------- advance_order: accepted -> preparing -> ready -> delivered ----------
create or replace function public.advance_order(p_order_id uuid, p_new_status public.order_status)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_order  public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if not public.has_club_role(v_order.club_id, array['waiter', 'admin']::public.app_role[]) then
    raise exception 'forbidden';
  end if;

  if v_order.claimed_by is distinct from v_uid and public.get_my_role() <> 'admin' then
    raise exception 'not_your_order';
  end if;

  if not (
       (v_order.status = 'accepted'  and p_new_status = 'preparing')
    or (v_order.status = 'preparing' and p_new_status = 'ready')
    or (v_order.status = 'ready'     and p_new_status = 'delivered')
  ) then
    raise exception 'invalid_transition';
  end if;

  update public.orders o
     set status       = p_new_status,
         preparing_at = case when p_new_status = 'preparing' then now() else o.preparing_at end,
         ready_at     = case when p_new_status = 'ready'     then now() else o.ready_at end,
         delivered_at = case when p_new_status = 'delivered' then now() else o.delivered_at end
   where o.id = p_order_id
  returning o.* into v_order;

  return v_order;
end;
$$;

-- ---------- cancel_order (staff only; customers cannot cancel) ----------
create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_order  public.orders;
begin
  if p_reason is not null and char_length(p_reason) > 200 then
    raise exception 'reason_too_long';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if not public.has_club_role(v_order.club_id, array['waiter', 'admin']::public.app_role[]) then
    raise exception 'forbidden';
  end if;

  -- A claimed order can only be cancelled by its waiter or an admin
  if v_order.status <> 'pending'
     and v_order.claimed_by is distinct from v_uid
     and public.get_my_role() <> 'admin' then
    raise exception 'not_your_order';
  end if;

  if v_order.status not in ('pending', 'accepted', 'preparing', 'ready') then
    raise exception 'invalid_transition';
  end if;

  update public.orders o
     set status        = 'cancelled',
         cancelled_at  = now(),
         cancelled_by  = v_uid,
         cancel_reason = nullif(btrim(p_reason), '')
   where o.id = p_order_id
  returning o.* into v_order;

  return v_order;
end;
$$;

-- ---------- Function permissions ----------
revoke execute on function public.create_order(text, jsonb, public.payment_method, text) from public, anon;
revoke execute on function public.claim_order(uuid)                                      from public, anon;
revoke execute on function public.advance_order(uuid, public.order_status)              from public, anon;
revoke execute on function public.cancel_order(uuid, text)                               from public, anon;

grant execute on function public.create_order(text, jsonb, public.payment_method, text) to authenticated;
grant execute on function public.claim_order(uuid)                                      to authenticated;
grant execute on function public.advance_order(uuid, public.order_status)              to authenticated;
grant execute on function public.cancel_order(uuid, text)                               to authenticated;

-- ---------- Realtime: live order updates (still filtered by RLS) ----------
alter publication supabase_realtime add table public.orders;

commit;