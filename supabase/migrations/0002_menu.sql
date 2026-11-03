-- =====================================================================
-- Migration 0002: menu (categories, items, image storage)
-- Runs inside one transaction: if anything fails, nothing is applied.
-- =====================================================================
begin;

create type public.menu_kind as enum ('food', 'drink');

-- ---------- menu_categories ----------
create table public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  kind        public.menu_kind not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (club_id, name),
  unique (id, club_id)  -- lets menu_items verify category and item share a club
);

create index menu_categories_club_sort_idx on public.menu_categories (club_id, sort_order);

create trigger menu_categories_set_updated_at
  before update on public.menu_categories
  for each row execute function public.set_updated_at();

-- ---------- menu_items ----------
create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references public.clubs (id) on delete cascade,
  category_id   uuid not null,
  name          text not null check (char_length(name) between 1 and 100),
  description   text check (description is null or char_length(description) <= 500),
  price_kes     numeric(10,2) not null check (price_kes >= 0 and price_kes <= 1000000),
  image_url     text check (image_url is null or char_length(image_url) <= 500),
  is_available  boolean not null default true,
  is_featured   boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (category_id, club_id)
    references public.menu_categories (id, club_id) on delete restrict
);

create index menu_items_club_category_idx on public.menu_items (club_id, category_id, sort_order);
create index menu_items_featured_idx on public.menu_items (club_id) where is_featured;

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ---------- Privileges ----------
revoke all on public.menu_categories from anon, authenticated;
revoke all on public.menu_items      from anon, authenticated;

grant select on public.menu_categories to authenticated;
grant insert (club_id, name, kind, sort_order, is_active) on public.menu_categories to authenticated;
grant update (name, kind, sort_order, is_active)          on public.menu_categories to authenticated;
grant delete on public.menu_categories to authenticated;

grant select on public.menu_items to authenticated;
grant insert (club_id, category_id, name, description, price_kes, image_url, is_available, is_featured, sort_order)
  on public.menu_items to authenticated;
grant update (category_id, name, description, price_kes, image_url, is_available, is_featured, sort_order)
  on public.menu_items to authenticated;
grant delete on public.menu_items to authenticated;

-- ---------- RLS ----------
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;

create policy "menu_categories: anyone signed in can read"
  on public.menu_categories for select to authenticated
  using (true);

create policy "menu_categories: admins insert"
  on public.menu_categories for insert to authenticated
  with check (public.has_club_role(club_id, array['admin']::public.app_role[]));

create policy "menu_categories: admins update"
  on public.menu_categories for update to authenticated
  using      (public.has_club_role(club_id, array['admin']::public.app_role[]))
  with check (public.has_club_role(club_id, array['admin']::public.app_role[]));

create policy "menu_categories: admins delete"
  on public.menu_categories for delete to authenticated
  using (public.has_club_role(club_id, array['admin']::public.app_role[]));

create policy "menu_items: anyone signed in can read"
  on public.menu_items for select to authenticated
  using (true);

create policy "menu_items: admins insert"
  on public.menu_items for insert to authenticated
  with check (public.has_club_role(club_id, array['admin']::public.app_role[]));

create policy "menu_items: admins update"
  on public.menu_items for update to authenticated
  using      (public.has_club_role(club_id, array['admin']::public.app_role[]))
  with check (public.has_club_role(club_id, array['admin']::public.app_role[]));

create policy "menu_items: admins delete"
  on public.menu_items for delete to authenticated
  using (public.has_club_role(club_id, array['admin']::public.app_role[]));

-- ---------- Storage bucket for menu photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "menu-images: admins upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and public.get_my_role() = 'admin');

create policy "menu-images: admins update"
  on storage.objects for update to authenticated
  using      (bucket_id = 'menu-images' and public.get_my_role() = 'admin')
  with check (bucket_id = 'menu-images' and public.get_my_role() = 'admin');

create policy "menu-images: admins delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and public.get_my_role() = 'admin');

commit;