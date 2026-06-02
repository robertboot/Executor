'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ForgotPasswordForm({
  initialEmail,
}: {
  initialEmail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    startTransition(async () => {
      const redirectTo = new URL(
        '/auth/callback?next=/reset-password',
        window.location.origin,
      ).toString();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) {
        setError(error.message);
        return;
      }
      router.replace('/forgot-password?sent=1');
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
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={pending || email.length < 3}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
