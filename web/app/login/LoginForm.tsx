'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    startTransition(async () => {
      const redirectTo = new URL(
        `/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`,
        window.location.origin,
      ).toString();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
      } else {
        router.replace(`/login?sent=1${next ? `&next=${encodeURIComponent(next)}` : ''}`);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full h-11 px-3 rounded-lg bg-cream-soft border border-hairline text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
          placeholder="you@example.com"
        />
      </label>
      <Button type="submit" disabled={pending || email.length < 3}>
        {pending ? 'Sending…' : 'Send magic link'}
      </Button>
    </form>
  );
}
