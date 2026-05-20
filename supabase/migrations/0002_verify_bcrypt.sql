-- =========================================================================
-- verify_bcrypt RPC used by the executor-unlock Edge Function.
-- Postgres-side bcrypt comparison via pgcrypto.
-- =========================================================================
create or replace function public.verify_bcrypt(plain text, hash text)
returns boolean
language sql
stable
as $$
  select crypt(plain, hash) = hash;
$$;

-- Restrict to service role only (the Edge Function uses the service key).
revoke all on function public.verify_bcrypt(text, text) from public;
revoke all on function public.verify_bcrypt(text, text) from anon;
revoke all on function public.verify_bcrypt(text, text) from authenticated;
grant execute on function public.verify_bcrypt(text, text) to service_role;
