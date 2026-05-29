-- People & Provenance — first-class entity for the humans behind every
-- heirloom. Items can be associated with multiple people via roles
-- (owner, inherited from, current custodian, etc.), and people can be
-- linked to each other for future family-tree work.

-- ============================================================== --
-- 1. TABLES
-- ============================================================== --

create table if not exists public.people (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,

  first_name text not null,
  middle_name text,
  last_name text,

  relationship text,
  side_of_family text check (side_of_family in ('paternal', 'maternal', 'other')),

  birth_date date,
  death_date date,

  biography text,
  profile_photo_path text,

  confidence text check (confidence in ('confirmed', 'likely', 'unknown')) default 'confirmed',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists people_owner_idx on public.people(owner_id);

create table if not exists public.item_people (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  role text not null check (role in (
    'owner', 'inherited_from', 'current_custodian',
    'photographed', 'created_by', 'mentioned_in', 'related_to'
  )),
  notes text,
  created_at timestamptz not null default now(),

  unique (item_id, person_id, role)
);

create index if not exists item_people_item_idx on public.item_people(item_id);
create index if not exists item_people_person_idx on public.item_people(person_id);

create table if not exists public.person_relationships (
  id uuid primary key default uuid_generate_v4(),
  person_a uuid not null references public.people(id) on delete cascade,
  person_b uuid not null references public.people(id) on delete cascade,
  relationship_type text not null check (relationship_type in (
    'parent', 'child', 'spouse', 'sibling', 'grandparent', 'other'
  )),
  created_at timestamptz not null default now(),

  unique (person_a, person_b, relationship_type),
  check (person_a <> person_b)
);

-- ============================================================== --
-- 2. RLS
-- ============================================================== --

alter table public.people enable row level security;
alter table public.item_people enable row level security;
alter table public.person_relationships enable row level security;

drop policy if exists "people: owner all" on public.people;
create policy "people: owner all"
  on public.people for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- item_people: visible if you own the person on it. Lookups from the
-- item side are still safe because items RLS already filters what you
-- can see and the join is exact.
drop policy if exists "item_people: via person owner" on public.item_people;
create policy "item_people: via person owner"
  on public.item_people for all
  using (
    exists (
      select 1 from public.people p
      where p.id = person_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.people p
      where p.id = person_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "person_relationships: via person_a owner" on public.person_relationships;
create policy "person_relationships: via person_a owner"
  on public.person_relationships for all
  using (
    exists (
      select 1 from public.people p
      where p.id = person_a and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.people p
      where p.id = person_a and p.owner_id = auth.uid()
    )
  );

-- ============================================================== --
-- 3. TRIGGER: touch updated_at
-- ============================================================== --

create or replace function public.people_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists people_touch_updated_at on public.people;
create trigger people_touch_updated_at
  before update on public.people
  for each row execute function public.people_touch_updated_at();
