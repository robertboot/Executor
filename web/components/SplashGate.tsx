'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Key used by both the gate and the welcome screen's dismiss buttons.
const LAST_SEEN_KEY = 'welcome-last-seen';

// How long the app can be backgrounded before we treat the resume as
// a "cold open" and bounce the user to /welcome again. 60s is short
// enough that a quick app-switcher hop feels seamless, and long enough
// that closing the PWA and reopening minutes later re-shows the splash.
const STALE_MS = 60 * 1000;

// Mounted once at the top of the (app) layout. Two jobs:
//   1. On every navigation, refresh a localStorage timestamp so we
//      know the session is still active.
//   2. Watch for the page being hidden + later resurfaced. If the gap
//      is longer than STALE_MS, navigate to /welcome — that's the
//      "user closed and reopened the app" signal we couldn't get from
//      a session cookie alone.
//
// Server-side rendering still works the same (the first server paint
// is fine), the gate just runs after hydration. On a fresh first
// visit the localStorage key is missing and we redirect immediately.
export default function SplashGate() {
  const router = useRouter();
  const pathname = usePathname();
  const hiddenAt = useRef<number | null>(null);

  // Mount check: if we've never seen this user, send them to /welcome.
  // /welcome itself is allowed through so its dismiss buttons can run.
  useEffect(() => {
    if (pathname === '/welcome') return;
    try {
      const last = window.localStorage.getItem(LAST_SEEN_KEY);
      if (!last) {
        router.replace('/welcome');
        return;
      }
      window.localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch {
      // localStorage disabled / private mode — fall through.
    }
  }, [pathname, router]);

  // Cold-open detection via visibilitychange. iOS Safari and Chrome
  // both fire this when the PWA is backgrounded.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
        return;
      }
      // Becoming visible again.
      const h = hiddenAt.current;
      hiddenAt.current = null;
      if (h !== null && Date.now() - h > STALE_MS) {
        try {
          window.localStorage.removeItem(LAST_SEEN_KEY);
        } catch {
          // ignore
        }
        router.replace('/welcome');
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [router]);

  // Browser navigations restored from the back/forward cache fire
  // `pageshow` with persisted=true. Treat those as resumes too.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (!e.persisted) return;
      try {
        const last = window.localStorage.getItem(LAST_SEEN_KEY);
        if (!last || Date.now() - Number(last) > STALE_MS) {
          try {
            window.localStorage.removeItem(LAST_SEEN_KEY);
          } catch {
            // ignore
          }
          router.replace('/welcome');
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [router]);

  return null;
}

export { LAST_SEEN_KEY };
