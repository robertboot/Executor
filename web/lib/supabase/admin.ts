// Service-role client — bypasses RLS. ONLY import from server-only code
// (server actions, route handlers, cron). Never imported in a client
// component, never exported to the browser.

import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseAdminClient() {
  if (!SERVICE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. This call must run in a ' +
        'server environment with the service-role key configured.',
    );
  }
  return createClient(URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
