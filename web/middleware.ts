// Refreshes the Supabase session cookie on every request and gates the
// `/(app)` routes. Anything under /login, /signup, /auth, and the public
// /i/<publicId> item landing page is open; everything else needs a user.

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PUBLIC_PATHS = ['/login', '/signup', '/auth', '/i', '/favicon.ico'];
const PUBLIC_FILE_REGEX = /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and public routes outright.
  if (PUBLIC_FILE_REGEX.test(pathname)) return NextResponse.next();
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch the session — refreshes cookies if expired.
  const { data } = await supabase.auth.getUser();

  if (!data.user && !isPublic && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // If signed in and at the root or /login, send to /home.
  if (data.user && (pathname === '/' || pathname === '/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Onboarding gate. Single DB query covers both directions:
  // - Not done + not on /onboarding  → redirect to /onboarding
  // - Done + on /onboarding          → redirect to /home
  if (data.user && !isPublic) {
    const onOnboarding =
      pathname === '/onboarding' || pathname.startsWith('/onboarding/');
    const onLogout = pathname === '/logout' || pathname.startsWith('/logout/');

    if (!onLogout) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('id', data.user.id)
        .maybeSingle();

      // If the column doesn't exist yet (migration not run), skip both
      // redirects — the app stays functional, wizard just won't gate.
      if (!error && profile) {
        const isDone = !!profile.onboarding_completed_at;

        if (!isDone && !onOnboarding) {
          const url = request.nextUrl.clone();
          url.pathname = '/onboarding';
          url.search = '';
          return NextResponse.redirect(url);
        }
        if (isDone && onOnboarding) {
          const url = request.nextUrl.clone();
          url.pathname = '/home';
          url.search = '';
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|categories|.*\\.png$).*)'],
};
