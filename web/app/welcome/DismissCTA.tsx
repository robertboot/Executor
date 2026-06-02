'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LAST_SEEN_KEY } from '@/components/SplashGate';

// Records that the splash has been dismissed (in localStorage) then
// navigates to the chosen destination. Each CTA on the welcome screen
// renders one of these so they all share the same dismissal
// bookkeeping.
export default function DismissCTA({
  dest,
  className,
  children,
}: {
  dest: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    try {
      window.localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch {
      // localStorage disabled — navigate anyway; the gate will redirect
      // back here on the next load but that's the best we can do.
    }
    startTransition(() => {
      router.push(dest);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={className}
    >
      {children}
    </button>
  );
}
