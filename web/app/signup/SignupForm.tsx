'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function SignupForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    const supabase = createSupabaseBrowserClient();
    startTransition(async () => {
      const redirectTo = new URL(
        `/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`,
        window.location.origin,
      ).toString();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setError(error.message);
        return;
      }
      // Supabase returns a session immediately when email confirmation is
      // disabled, and a null session when confirmation is required.
      if (data.session) {
        router.replace(next || '/home');
        router.refresh();
      } else {
        router.replace(
          `/signup?sent=1${next ? `&next=${encodeURIComponent(next)}` : ''}`,
        );
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
      <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">
        Password
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full h-11 px-3 rounded-lg bg-cream-soft border border-hairline text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
          placeholder="At least 8 characters"
        />
      </label>
      <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">
        Confirm password
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full h-11 px-3 rounded-lg bg-cream-soft border border-hairline text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button
        type="submit"
        disabled={
          pending || email.length < 3 || password.length < 8 || !confirm
        }
      >
        {pending ? 'Creating…' : 'Create account'}
      </Button>
      <div className="text-xs pt-1">
        <Link href="/login" className="text-forest hover:underline">
          Already have an account? Sign in
        </Link>
      </div>
    </form>
  );
}
