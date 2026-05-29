-- Add email to people so a relative who's still alive (or any contact
-- you'd like to reach about an item) can be reached without leaving
-- Heirloom.

alter table public.people
  add column if not exists email text;
