'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { inviteToInventory } from './actions';
import type { Role } from '@/lib/types';

export default function InviteForm({ inventoryId }: { inventoryId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      try {
        await inviteToInventory({
          inventoryId,
          email: email.trim(),
          role,
        });
        setEmail('');
        setMsg({ type: 'ok', text: 'Invite sent.' });
        router.refresh();
      } catch (e) {
        setMsg({
          type: 'err',
          text: e instanceof Error ? e.message : 'Invite failed',
        });
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="person@example.com"
          className="flex-1 h-10 px-3 rounded-lg bg-paper border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="h-10 px-3 rounded-lg bg-paper border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
        >
          <option value="viewer">Viewer</option>
          <option value="contributor">Contributor</option>
        </select>
      </div>
      <Button type="submit" disabled={pending || email.trim().length < 3}>
        {pending ? 'Sending…' : 'Send invite'}
      </Button>
      {msg && (
        <p
          className={`text-sm ${
            msg.type === 'ok' ? 'text-forest' : 'text-red-700'
          }`}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}
