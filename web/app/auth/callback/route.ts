// Magic-link callback. Supabase appends ?code=… (PKCE) or #access_token=… —
// we exchange the code for a session and redirect to the post-login target.

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/home';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const back = new URL('/login', url.origin);
      back.searchParams.set('error', error.message);
      return NextResponse.redirect(back);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
