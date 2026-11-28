-- CineBlaze Supabase app data: watchlist, lists, ratings, history, admin helpers.
-- This migration extends the existing remote schema (profiles, site_settings, RLS helpers).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('movie', 'tv')),
  title_id bigint not null,
  title text not null,
  poster text not null default '',
  year text not null default '',
  rating text not null default '',
  added_at timestamptz not null default now(),
  unique (user_id, kind, title_id)
);

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  kind text not null check (kind in ('movie', 'tv')),
  title_id bigint not null,
  title text not null,
  year text not null default '',
  poster text not null default '',
  position integer not null default 0,
  added_at timestamptz not null default now(),
  unique (list_id, kind, title_id)
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('movie', 'tv')),
  title_id bigint not null,
  score integer not null check (score between 1 and 10),
  review text not null default '',
  helpful integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, title_id)
);

create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title_id text not null,
  kind text not null check (kind in ('movie', 'tv')),
  title text not null,
  poster text not null default '',
  watched_at timestamptz not null default now(),
  unique (user_id, title_id)
);

insert into public.site_settings (key, value, updated_at)
values ('maintenance', '{"enabled": false}'::jsonb, now())
on conflict (key) do nothing;

create index if not exists watchlist_user_idx on public.watchlist(user_id);
create index if not exists lists_user_idx on public.lists(user_id);
create index if not exists list_items_list_idx on public.list_items(list_id);
create index if not exists ratings_title_idx on public.ratings(kind, title_id);
create index if not exists watch_history_user_idx on public.watch_history(user_id);

alter table public.watchlist enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.ratings enable row level security;
alter table public.watch_history enable row level security;

drop policy if exists "watchlist_select_own_or_admin" on public.watchlist;
drop policy if exists "watchlist_insert_own" on public.watchlist;
drop policy if exists "watchlist_update_own" on public.watchlist;
drop policy if exists "watchlist_delete_own" on public.watchlist;
create policy "watchlist_select_own_or_admin" on public.watchlist
  for select using (user_id = auth.uid() or public.is_admin());
create policy "watchlist_insert_own" on public.watchlist
  for insert with check (user_id = auth.uid());
create policy "watchlist_update_own" on public.watchlist
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "watchlist_delete_own" on public.watchlist
  for delete using (user_id = auth.uid());

drop policy if exists "lists_select" on public.lists;
drop policy if exists "lists_insert_own" on public.lists;
drop policy if exists "lists_update_own" on public.lists;
drop policy if exists "lists_delete_own" on public.lists;
create policy "lists_select" on public.lists
  for select using (user_id = auth.uid() or is_public or public.is_admin());
create policy "lists_insert_own" on public.lists
  for insert with check (user_id = auth.uid());
create policy "lists_update_own" on public.lists
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "lists_delete_own" on public.lists
  for delete using (user_id = auth.uid());

drop policy if exists "list_items_select" on public.list_items;
drop policy if exists "list_items_insert_own" on public.list_items;
drop policy if exists "list_items_update_own" on public.list_items;
drop policy if exists "list_items_delete_own" on public.list_items;
create policy "list_items_select" on public.list_items
  for select using (
    exists (
      select 1 from public.lists l
      where l.id = list_id
        and (l.user_id = auth.uid() or l.is_public or public.is_admin())
    )
  );
create policy "list_items_insert_own" on public.list_items
  for insert with check (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  );
create policy "list_items_update_own" on public.list_items
  for update using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  );
create policy "list_items_delete_own" on public.list_items
  for delete using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and l.user_id = auth.uid()
    )
  );

drop policy if exists "ratings_select_own_or_admin" on public.ratings;
drop policy if exists "ratings_insert_own" on public.ratings;
drop policy if exists "ratings_update_own" on public.ratings;
drop policy if exists "ratings_delete_own" on public.ratings;
create policy "ratings_select_own_or_admin" on public.ratings
  for select using (user_id = auth.uid() or public.is_admin());
create policy "ratings_insert_own" on public.ratings
  for insert with check (user_id = auth.uid());
create policy "ratings_update_own" on public.ratings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ratings_delete_own" on public.ratings
  for delete using (user_id = auth.uid());

drop policy if exists "history_select_own_or_admin" on public.watch_history;
drop policy if exists "history_insert_own" on public.watch_history;
drop policy if exists "history_update_own" on public.watch_history;
drop policy if exists "history_delete_own" on public.watch_history;
create policy "history_select_own_or_admin" on public.watch_history
  for select using (user_id = auth.uid() or public.is_admin());
create policy "history_insert_own" on public.watch_history
  for insert with check (user_id = auth.uid());
create policy "history_update_own" on public.watch_history
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "history_delete_own" on public.watch_history
  for delete using (user_id = auth.uid());

-- Admin-only helpers. Client checks are repeated inside the functions.
create or replace function public.admin_delete_account(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;
  delete from auth.users where id = target;
end;
$$;

create or replace function public.admin_reset_all()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  delete from public.list_items;
  delete from public.lists where user_id <> auth.uid();
  delete from public.watchlist where user_id <> auth.uid();
  delete from public.ratings where user_id <> auth.uid();
  delete from public.watch_history where user_id <> auth.uid();
  delete from public.profiles where id <> auth.uid();
  delete from auth.users where id <> auth.uid();
  update public.site_settings
    set value = '{"enabled": false}'::jsonb, updated_at = now()
    where key = 'maintenance';
end;
$$;

revoke all on function public.admin_delete_account(uuid) from public;
revoke all on function public.admin_reset_all() from public;
grant execute on function public.admin_delete_account(uuid) to authenticated;
grant execute on function public.admin_reset_all() to authenticated;

-- Demo admin: admin@cineblaze.com / password
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@cineblaze.com',
  extensions.crypt('password', extensions.gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Demo Admin"}'::jsonb
where not exists (
  select 1 from auth.users where email = 'admin@cineblaze.com'
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email = 'admin@cineblaze.com'
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

update public.profiles
  set display_name = 'Demo Admin', role = 'admin', is_banned = false
  where email = 'admin@cineblaze.com';
