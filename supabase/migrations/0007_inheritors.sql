-- Inheritors — people designated to receive items or collections in
-- the future. Separate concept from People (provenance) and
-- Conservators (archive access). Optionally references a Person if
-- the inheritor is already in the family archive.

create table if not exists public.inheritors (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,

  -- Optional link to an existing Person; lets one human appear as
  -- both a People entry (provenance) and an Inheritor (succession).
  person_id uuid references public.people(id) on delete set null,

  display_name text not null,
  relationship text,
  email text,

  status text not null default 'designated_heir' check (status in (
    'designated_heir',
    'beneficiary',
    'alternate',
    'charity',
    'museum',
    'undecided'
  )),

  notes text,
  profile_photo_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inheritors_owner_idx on public.inheritors(owner_id);
create index if not exists inheritors_person_idx on public.inheritors(person_id);

-- Items: inheritance fields. Designated + alternate point at
-- inheritor rows directly so assignments survive renames.
alter table public.items
  add column if not exists designated_inheritor_id uuid
    references public.inheritors(id) on delete set null,
  add column if not exists alternate_inheritor_id uuid
    references public.inheritors(id) on delete set null,
  add column if not exists inheritance_notes text,
  add column if not exists transfer_instructions text,
  add column if not exists legal_reference text,
  add column if not exists assignment_confidence text check (
    assignment_confidence in ('confirmed', 'likely', 'undecided')
  );

create index if not exists items_designated_inheritor_idx
  on public.items(designated_inheritor_id);
create index if not exists items_alternate_inheritor_idx
  on public.items(alternate_inheritor_id);

-- Custom collections also get inheritance fields so an entire
-- collection can be bequeathed.
alter table public.custom_collections
  add column if not exists designated_inheritor_id uuid
    references public.inheritors(id) on delete set null,
  add column if not exists alternate_inheritor_id uuid
    references public.inheritors(id) on delete set null,
  add column if not exists transfer_notes text;

-- RLS
alter table public.inheritors enable row level security;

drop policy if exists "inheritors: owner all" on public.inheritors;
create policy "inheritors: owner all"
  on public.inheritors for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Touch trigger
create or replace function public.inheritors_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inheritors_touch_updated_at on public.inheritors;
create trigger inheritors_touch_updated_at
  before update on public.inheritors
  for each row execute function public.inheritors_touch_updated_at();
