// Server-side Supabase client — runs in server components, server actions,
// route handlers, and middleware. Reads/writes the auth cookie so RLS sees
// the signed-in user.

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // In some contexts (e.g. server components without an active
          // response) cookie writes throw. The middleware will refresh
          // the session on the next request.
        }
      },
    },
  });
}

/**
 * Returns the signed-in user, or null. Use at the top of server pages.
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
