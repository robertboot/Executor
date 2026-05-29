-- Custom Collections — user-defined collections that don't fit any of
-- the curated archetype sub-categories. Each one has a name and an
-- optional image. Items use the collection's UUID as their category
-- string.

create table if not exists public.custom_collections (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_collections_owner_idx
  on public.custom_collections(owner_id);

alter table public.custom_collections enable row level security;

drop policy if exists "custom_collections: owner all" on public.custom_collections;
create policy "custom_collections: owner all"
  on public.custom_collections for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create or replace function public.custom_collections_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists custom_collections_touch_updated_at on public.custom_collections;
create trigger custom_collections_touch_updated_at
  before update on public.custom_collections
  for each row execute function public.custom_collections_touch_updated_at();
