-- Make "Originator" an explicit, toggleable role (like Inheritor /
-- Conservator) instead of "exists in the people table". Existing people
-- keep their current behaviour (default true). People auto-created purely
-- to anchor an Inheritor/Conservator are inserted with is_originator =
-- false going forward, and the Person edit form can toggle it.

alter table public.people
  add column if not exists is_originator boolean not null default true;

create index if not exists people_is_originator_idx
  on public.people(owner_id, is_originator);
