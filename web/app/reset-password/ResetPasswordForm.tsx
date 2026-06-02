'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ResetPasswordForm() {
  const router = useRouter();
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      router.replace('/home');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">
        New password
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
        disabled={pending || password.length < 8 || !confirm}
      >
        {pending ? 'Saving…' : 'Save and sign in'}
      </Button>
    </form>
  );
}
