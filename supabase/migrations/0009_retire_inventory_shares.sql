-- =========================================================================
--  0009  Retire inventory_shares
--
--  Inventory-level sharing predates the Conservators system and overlaps
--  with it conceptually. The product now consolidates all archive access
--  control on the conservators table, so this migration:
--
--    1. Backfills any already-accepted inventory_shares into the
--       conservators table for the inventory's owner. Pending and revoked
--       shares are dropped (they were never active).
--    2. Drops the inventory_shares table.
--
--  The inventories table itself is left in place — items, custom
--  collections, and item_people all FK into it on delete cascade, so
--  dropping it would erase the archive.
-- =========================================================================

-- 1. Backfill accepted shares as conservators on the owner's archive.
insert into public.conservators (owner_id, name, email, permission_level)
select
  inv.owner_id,
  coalesce(nullif(trim(s.invited_email), ''), 'Invited collaborator'),
  s.invited_email,
  case s.role
    when 'contributor' then 'contributor'
    else 'viewer'
  end
from public.inventory_shares s
join public.inventories inv on inv.id = s.inventory_id
where s.status = 'accepted'
  -- Skip rows where a conservator with the same email is already on the
  -- archive — avoid creating a duplicate after retroactive cleanup.
  and not exists (
    select 1
    from public.conservators c
    where c.owner_id = inv.owner_id
      and lower(coalesce(c.email, '')) = lower(s.invited_email)
  );

-- 2. Drop the table. The unique index, FKs, and RLS policies go with it.
drop table if exists public.inventory_shares cascade;
