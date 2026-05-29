-- Phase 1 of the Conservators upgrade: add a permission level + profile
-- photo path so the page can render role badges and avatars.

alter table public.conservators
  add column if not exists permission_level text default 'viewer' check (
    permission_level in ('viewer', 'contributor', 'curator', 'owner')
  ),
  add column if not exists profile_photo_path text,
  add column if not exists last_active_at timestamptz;
