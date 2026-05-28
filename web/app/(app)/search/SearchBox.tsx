'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    startTransition(() => {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search items…"
        className="flex-1 h-11 px-3 rounded-lg bg-paper border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
        autoFocus
      />
      <button
        type="submit"
        className="h-11 px-5 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep"
      >
        Search
      </button>
    </form>
  );
}
