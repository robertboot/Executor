'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createInventory } from './actions';

export default function CreateInventoryForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const inv = await createInventory({
          name: name.trim(),
          description: description.trim() || null,
        });
        router.push(`/home`);
        router.refresh();
        void inv;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Create failed');
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-muted font-medium">
          Name
        </span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Boot Family Collection"
          className="mt-1 w-full px-3 py-2 rounded-lg bg-paper border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-muted font-medium">
          Description (optional)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full px-3 py-2 rounded-lg bg-paper border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={pending || name.trim().length === 0}>
        {pending ? 'Creating…' : 'Create inventory'}
      </Button>
    </form>
  );
}
