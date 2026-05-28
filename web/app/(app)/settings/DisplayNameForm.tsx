'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { updateDisplayName } from './profile-actions';

export default function DisplayNameForm({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      try {
        await updateDisplayName(name);
        setMsg('Saved.');
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Save failed');
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 items-start">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="flex-1 w-full h-10 px-3 rounded-lg bg-paper border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
      />
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? 'Saving…' : 'Save'}
      </Button>
      {msg && <span className="text-xs text-muted self-center">{msg}</span>}
    </form>
  );
}
