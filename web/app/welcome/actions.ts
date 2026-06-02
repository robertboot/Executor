'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { WELCOME_COOKIE } from './cookie';

// Sets a session cookie marking the splash as dismissed (so it
// doesn't reappear on every navigation within this browser session),
// then redirects to the requested destination. The cookie is
// intentionally NOT given a max-age so the browser drops it when the
// session ends — the splash will reappear on the next cold open.
export async function dismissWelcome(formData: FormData) {
  const dest = String(formData.get('dest') ?? '/home');
  const safeDest = dest.startsWith('/') ? dest : '/home';
  const store = await cookies();
  store.set(WELCOME_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // No max-age / expires — this is a session cookie.
  });
  redirect(safeDest);
}
