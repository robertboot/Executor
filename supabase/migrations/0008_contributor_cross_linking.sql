-- =========================================================================
--  0008  Contributor cross-linking
--
--  Lets a single Legacy Person also be designated as a Conservator
--  without duplicating their identity. (inheritors.person_id already
--  exists from 0007_inheritors.sql.)
--
--  The partial unique indexes prevent a single person from being added
--  as the same role twice within one owner's archive.
-- =========================================================================

alter table public.conservators
  add column if not exists person_id uuid references public.people(id) on delete set null;

create index if not exists conservators_person_idx
  on public.conservators (person_id)
  where person_id is not null;

create unique index if not exists conservators_owner_person_unique
  on public.conservators (owner_id, person_id)
  where person_id is not null;

create unique index if not exists inheritors_owner_person_unique
  on public.inheritors (owner_id, person_id)
  where person_id is not null;
