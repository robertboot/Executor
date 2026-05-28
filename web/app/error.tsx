'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-paper rounded-2xl border border-hairline p-6 text-center space-y-3">
        <h1 className="font-serif text-2xl text-ink">Something went wrong.</h1>
        <p className="text-sm text-muted">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted font-mono">ref: {error.digest}</p>
        )}
        <div className="flex justify-center gap-2 pt-2">
          <Button onClick={reset} variant="secondary">
            Try again
          </Button>
          <Button onClick={() => (window.location.href = '/home')}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
