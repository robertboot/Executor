'use client';

import { useEffect } from 'react';

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Onboarding error:', error);
  }, [error]);

  return (
    <div className="space-y-6 text-center py-8">
      <h1 className="font-serif text-2xl text-ink">
        Something went wrong loading the setup wizard.
      </h1>
      <div className="bg-paper border border-hairline rounded-xl p-4 text-left">
        <div className="text-xs uppercase tracking-wider text-muted mb-2">
          Error
        </div>
        <pre className="text-xs text-ink-soft whitespace-pre-wrap break-words">
          {error.message || 'Unknown error'}
        </pre>
        {error.digest && (
          <div className="text-[10px] text-muted mt-2">
            Digest: {error.digest}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center px-5 h-11 rounded-full bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
        >
          Try again
        </button>
        <a
          href="/home"
          className="text-sm text-muted underline hover:text-ink"
        >
          Skip to home
        </a>
      </div>
    </div>
  );
}
