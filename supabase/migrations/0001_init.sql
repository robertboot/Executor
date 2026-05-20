-- =========================================================================
-- Keepsake — personal inventory app
-- Initial schema, Row-Level Security policies, and revision trigger.
--
-- Run this once in the Supabase SQL Editor:
--   Project -> SQL -> New query -> paste this file -> Run.
-- Safe to re-run: policies and triggers are dropped first.
-- =========================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. TABLES (in dependency order)
-- =========================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventories (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists inventories_owner_idx on public.inventories(owner_id);

create table if not exists public.inventory_shares (
  id uuid primary key default uuid_generate_v4(),
  inventory_id uuid not null references public.inventories(id) on delete cascade,
  invited_email text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('viewer', 'contributor')),
  invited_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (inventory_id, invited_email)
);
create index if not exists inventory_shares_user_idx on public.inventory_shares(user_id);
create index if not exists inventory_shares_inv_idx on public.inventory_shares(inventory_id);

create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  inventory_id uuid not null references public.inventories(id) on delete cascade,
  name text not null,
  category text,
  description text,
  condition text,
  location text,
  value_amount numeric(14, 2),
  value_currency text not null default 'USD',
  notes text,
  provenance text,
  acquired_date date,
  intended_recipient_name text,
  intended_recipient_contact text,
  bequest_notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  public_id uuid not null unique default uuid_generate_v4(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_inventory_idx on public.items(inventory_id);
create index if not exists items_public_id_idx on public.items(public_id);
create index if not exists items_category_idx on public.items(category);

create table if not exists public.item_photos (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists item_photos_item_idx on public.item_photos(item_id);

create table if not exists public.item_revisions (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now(),
  snapshot jsonb not null,
  change_note text
);
create index if not exists item_revisions_item_idx on public.item_revisions(item_id, changed_at desc);

create table if not exists public.executor_codes (
  id uuid primary key default uuid_generate_v4(),
  inventory_id uuid not null references public.inventories(id) on delete cascade,
  label text,
  code_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked boolean not null default false
);
create index if not exists executor_codes_inv_idx on public.executor_codes(inventory_id);

create table if not exists public.executor_access_log (
  id uuid primary key default uuid_generate_v4(),
  executor_code_id uuid not null references public.executor_codes(id) on delete cascade,
  item_public_id uuid,
  accessed_at timestamptz not null default now(),
  user_agent text
);
create index if not exists executor_log_code_idx on public.executor_access_log(executor_code_id, accessed_at desc);

-- =========================================================================
-- 2. HELPER FUNCTIONS
-- =========================================================================

create or replace function public.has_inventory_access(inv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.inventories where id = inv_id and owner_id = auth.uid())
    or exists (
      select 1 from public.inventory_shares
      where inventory_id = inv_id and user_id = auth.uid() and status = 'accepted'
    );
$$;

create or replace function public.can_write_inventory(inv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.inventories where id = inv_id and owner_id = auth.uid())
    or exists (
      select 1 from public.inventory_shares
      where inventory_id = inv_id
        and user_id = auth.uid()
        and status = 'accepted'
        and role = 'contributor'
    );
$$;

create or replace function public.is_inventory_owner(inv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.inventories where id = inv_id and owner_id = auth.uid());
$$;

-- Current user's email (bypasses auth.users RLS via SECURITY DEFINER).
create or replace function public.my_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from auth.users where id = auth.uid();
$$;

-- Auto-create profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.record_item_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.item_revisions (item_id, changed_by, snapshot)
  values (new.id, auth.uid(), to_jsonb(new));
  return new;
end;
$$;

-- =========================================================================
-- 3. RLS — enable on all tables
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.inventories enable row level security;
alter table public.inventory_shares enable row level security;
alter table public.items enable row level security;
alter table public.item_photos enable row level security;
alter table public.item_revisions enable row level security;
alter table public.executor_codes enable row level security;
alter table public.executor_access_log enable row level security;

-- profiles
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: read profiles I share inventories with" on public.profiles;
create policy "profiles: read profiles I share inventories with"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.inventory_shares s
      join public.inventories i on i.id = s.inventory_id
      where s.user_id = public.profiles.id
        and (i.owner_id = auth.uid()
             or exists (
               select 1 from public.inventory_shares mine
               where mine.inventory_id = s.inventory_id
                 and mine.user_id = auth.uid()
                 and mine.status = 'accepted'
             ))
    )
  );

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- inventories
drop policy if exists "inventories: select if I have access" on public.inventories;
create policy "inventories: select if I have access"
  on public.inventories for select
  using (public.has_inventory_access(id));

drop policy if exists "inventories: insert if owner is me" on public.inventories;
create policy "inventories: insert if owner is me"
  on public.inventories for insert
  with check (owner_id = auth.uid());

drop policy if exists "inventories: update if owner" on public.inventories;
create policy "inventories: update if owner"
  on public.inventories for update
  using (owner_id = auth.uid());

drop policy if exists "inventories: delete if owner" on public.inventories;
create policy "inventories: delete if owner"
  on public.inventories for delete
  using (owner_id = auth.uid());

-- items
drop policy if exists "items: select if inventory accessible" on public.items;
create policy "items: select if inventory accessible"
  on public.items for select
  using (public.has_inventory_access(inventory_id));

drop policy if exists "items: insert if writer" on public.items;
create policy "items: insert if writer"
  on public.items for insert
  with check (public.can_write_inventory(inventory_id));

drop policy if exists "items: update if writer" on public.items;
create policy "items: update if writer"
  on public.items for update
  using (public.can_write_inventory(inventory_id));

drop policy if exists "items: delete if owner" on public.items;
create policy "items: delete if owner"
  on public.items for delete
  using (public.is_inventory_owner(inventory_id));

-- item_photos
drop policy if exists "item_photos: select if inventory accessible" on public.item_photos;
create policy "item_photos: select if inventory accessible"
  on public.item_photos for select
  using (
    exists (
      select 1 from public.items i
      where i.id = item_photos.item_id
        and public.has_inventory_access(i.inventory_id)
    )
  );

drop policy if exists "item_photos: insert if writer" on public.item_photos;
create policy "item_photos: insert if writer"
  on public.item_photos for insert
  with check (
    exists (
      select 1 from public.items i
      where i.id = item_photos.item_id
        and public.can_write_inventory(i.inventory_id)
    )
  );

drop policy if exists "item_photos: update if writer" on public.item_photos;
create policy "item_photos: update if writer"
  on public.item_photos for update
  using (
    exists (
      select 1 from public.items i
      where i.id = item_photos.item_id
        and public.can_write_inventory(i.inventory_id)
    )
  );

drop policy if exists "item_photos: delete if writer" on public.item_photos;
create policy "item_photos: delete if writer"
  on public.item_photos for delete
  using (
    exists (
      select 1 from public.items i
      where i.id = item_photos.item_id
        and public.can_write_inventory(i.inventory_id)
    )
  );

-- item_revisions
drop policy if exists "item_revisions: select if inventory accessible" on public.item_revisions;
create policy "item_revisions: select if inventory accessible"
  on public.item_revisions for select
  using (
    exists (
      select 1 from public.items i
      where i.id = item_revisions.item_id
        and public.has_inventory_access(i.inventory_id)
    )
  );

drop policy if exists "item_revisions: insert if writer" on public.item_revisions;
create policy "item_revisions: insert if writer"
  on public.item_revisions for insert
  with check (
    exists (
      select 1 from public.items i
      where i.id = item_revisions.item_id
        and public.can_write_inventory(i.inventory_id)
    )
  );

-- inventory_shares
drop policy if exists "inventory_shares: owner sees all" on public.inventory_shares;
create policy "inventory_shares: owner sees all"
  on public.inventory_shares for select
  using (public.is_inventory_owner(inventory_id));

drop policy if exists "inventory_shares: invitee sees own" on public.inventory_shares;
create policy "inventory_shares: invitee sees own"
  on public.inventory_shares for select
  using (
    user_id = auth.uid()
    or lower(invited_email) = lower(public.my_email())
  );

drop policy if exists "inventory_shares: owner inserts" on public.inventory_shares;
create policy "inventory_shares: owner inserts"
  on public.inventory_shares for insert
  with check (public.is_inventory_owner(inventory_id));

drop policy if exists "inventory_shares: owner updates" on public.inventory_shares;
create policy "inventory_shares: owner updates"
  on public.inventory_shares for update
  using (public.is_inventory_owner(inventory_id));

drop policy if exists "inventory_shares: invitee accepts" on public.inventory_shares;
create policy "inventory_shares: invitee accepts"
  on public.inventory_shares for update
  using (
    status = 'pending'
    and lower(invited_email) = lower(public.my_email())
  )
  with check (
    user_id = auth.uid()
    and status = 'accepted'
  );

drop policy if exists "inventory_shares: owner deletes" on public.inventory_shares;
create policy "inventory_shares: owner deletes"
  on public.inventory_shares for delete
  using (public.is_inventory_owner(inventory_id));

-- executor_codes
drop policy if exists "executor_codes: owner reads" on public.executor_codes;
create policy "executor_codes: owner reads"
  on public.executor_codes for select
  using (public.is_inventory_owner(inventory_id));

drop policy if exists "executor_codes: owner writes" on public.executor_codes;
create policy "executor_codes: owner writes"
  on public.executor_codes for all
  using (public.is_inventory_owner(inventory_id))
  with check (public.is_inventory_owner(inventory_id));

-- executor_access_log
drop policy if exists "executor_access_log: owner reads" on public.executor_access_log;
create policy "executor_access_log: owner reads"
  on public.executor_access_log for select
  using (
    exists (
      select 1
      from public.executor_codes c
      where c.id = executor_access_log.executor_code_id
        and public.is_inventory_owner(c.inventory_id)
    )
  );

-- =========================================================================
-- 4. TRIGGERS
-- =========================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

drop trigger if exists items_record_revision_insert on public.items;
create trigger items_record_revision_insert
  after insert on public.items
  for each row execute function public.record_item_revision();

drop trigger if exists items_record_revision_update on public.items;
create trigger items_record_revision_update
  after update on public.items
  for each row execute function public.record_item_revision();

-- =========================================================================
-- 5. RPC functions used by the app
-- =========================================================================

create or replace function public.accept_share_invite(share_id uuid)
returns public.inventory_shares
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share public.inventory_shares;
  v_email text;
begin
  v_email := public.my_email();
  update public.inventory_shares
     set user_id = auth.uid(),
         status = 'accepted',
         accepted_at = now()
   where id = share_id
     and status = 'pending'
     and lower(invited_email) = lower(v_email)
  returning * into v_share;
  if v_share.id is null then
    raise exception 'No matching pending invite for this user';
  end if;
  return v_share;
end;
$$;

create or replace function public.create_executor_code(
  p_inventory_id uuid,
  p_label text,
  p_plain_code text
)
returns public.executor_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.executor_codes;
begin
  if not public.is_inventory_owner(p_inventory_id) then
    raise exception 'Only the inventory owner can create executor codes';
  end if;
  insert into public.executor_codes (inventory_id, label, code_hash)
  values (p_inventory_id, p_label, crypt(p_plain_code, gen_salt('bf', 10)))
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.restore_item_revision(p_revision_id uuid)
returns public.items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot jsonb;
  v_item_id uuid;
  v_inv_id uuid;
  v_item public.items;
begin
  select snapshot, item_id into v_snapshot, v_item_id
  from public.item_revisions
  where id = p_revision_id;
  if v_item_id is null then
    raise exception 'Revision not found';
  end if;
  select inventory_id into v_inv_id from public.items where id = v_item_id;
  if not public.can_write_inventory(v_inv_id) then
    raise exception 'Not allowed to restore this item';
  end if;

  update public.items set
    name                       = coalesce(v_snapshot->>'name', name),
    category                   = v_snapshot->>'category',
    description                = v_snapshot->>'description',
    condition                  = v_snapshot->>'condition',
    location                   = v_snapshot->>'location',
    value_amount               = nullif(v_snapshot->>'value_amount', '')::numeric,
    value_currency             = coalesce(v_snapshot->>'value_currency', 'USD'),
    notes                      = v_snapshot->>'notes',
    provenance                 = v_snapshot->>'provenance',
    acquired_date              = nullif(v_snapshot->>'acquired_date', '')::date,
    intended_recipient_name    = v_snapshot->>'intended_recipient_name',
    intended_recipient_contact = v_snapshot->>'intended_recipient_contact',
    bequest_notes              = v_snapshot->>'bequest_notes',
    custom_fields              = coalesce(v_snapshot->'custom_fields', '{}'::jsonb)
  where id = v_item_id
  returning * into v_item;
  return v_item;
end;
$$;

-- =========================================================================
-- 6. Storage bucket for item photos.
-- =========================================================================
insert into storage.buckets (id, name, public)
  values ('item-photos', 'item-photos', true)
  on conflict (id) do nothing;

-- Path convention: <inventory_id>/<item_id>/<filename>
drop policy if exists "item-photos: authenticated upload" on storage.objects;
create policy "item-photos: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'item-photos'
    and public.can_write_inventory((split_part(name, '/', 1))::uuid)
  );

drop policy if exists "item-photos: authenticated delete" on storage.objects;
create policy "item-photos: authenticated delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'item-photos'
    and public.can_write_inventory((split_part(name, '/', 1))::uuid)
  );

-- Public reads (bucket is public). Paths are unguessable UUIDs.

-- =========================================================================
-- 7. Executor unlock RPC (callable by anon for the QR landing page).
--
-- A QR scanner is anonymous — they have no Supabase session. Rather than
-- run a separate Edge Function, this RPC does the same job: verifies the
-- bcrypt-hashed code via pgcrypto, logs the access, and returns the
-- sanitized item + inventory + photos + sibling list.
--
-- SECURITY DEFINER lets it bypass RLS. The function itself enforces the
-- authorization: only valid, non-revoked codes return data.
-- =========================================================================
create or replace function public.unlock_item_for_executor(
  p_public_id uuid,
  p_code text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.items;
  v_inv public.inventories;
  v_code_id uuid;
  v_photos jsonb;
  v_siblings jsonb;
begin
  select * into v_item from public.items where public_id = p_public_id;
  if v_item.id is null then
    return jsonb_build_object('error', 'Item not found');
  end if;

  select c.id into v_code_id
  from public.executor_codes c
  where c.inventory_id = v_item.inventory_id
    and c.revoked = false
    and crypt(p_code, c.code_hash) = c.code_hash
  limit 1;

  if v_code_id is null then
    return jsonb_build_object('error', 'Invalid or revoked code');
  end if;

  insert into public.executor_access_log (executor_code_id, item_public_id, user_agent)
  values (v_code_id, p_public_id, p_user_agent);

  update public.executor_codes set last_used_at = now() where id = v_code_id;

  select * into v_inv from public.inventories where id = v_item.inventory_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('caption', caption, 'storage_path', storage_path)
      order by sort_order
    ),
    '[]'::jsonb
  )
  into v_photos
  from public.item_photos
  where item_id = v_item.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'category', category,
        'value_amount', value_amount,
        'value_currency', value_currency,
        'public_id', public_id,
        'intended_recipient_name', intended_recipient_name
      )
      order by name
    ),
    '[]'::jsonb
  )
  into v_siblings
  from public.items
  where inventory_id = v_item.inventory_id;

  return jsonb_build_object(
    'item', to_jsonb(v_item),
    'inventory', to_jsonb(v_inv),
    'photos', v_photos,
    'sibling_items', v_siblings
  );
end;
$$;

revoke all on function public.unlock_item_for_executor(uuid, text, text) from public;
grant execute on function public.unlock_item_for_executor(uuid, text, text) to anon;
grant execute on function public.unlock_item_for_executor(uuid, text, text) to authenticated;
