// Browser-side Supabase client — used inside client components for
// realtime, file uploads, and any interactive flow. Never imports cookies.

'use client';

import { createBrowserClient } from '@supabase/ssr';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createSupabaseBrowserClient() {
  return createBrowserClient(URL, ANON);
}
