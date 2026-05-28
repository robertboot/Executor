-- Onboarding state per profile. Captures what the user told us during the
-- first-run wizard so the rest of the app can tailor itself: which archetype
-- (Family Legacy, Collector, Luxury, Historical, Mixed), which focus they
-- care about (Preservation, Family Sharing, Valuation, Cataloging), and the
-- subset of the 12 Core Collections they chose to surface.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists archetype text,
  add column if not exists focus text,
  add column if not exists selected_collections text[];
