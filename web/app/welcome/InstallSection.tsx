'use client';

import { useState } from 'react';

export default function InstallSection() {
  const [open, setOpen] = useState(false);
  return (
    <section
      id="install"
      className="bg-cream-soft/50 border border-hairline rounded-2xl p-4 sm:p-5"
    >
      <div className="flex items-center gap-4">
        <span
          className="shrink-0 w-12 h-12 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/25"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
            boxShadow:
              'inset 0 1px 2px rgba(255,255,255,0.7), 0 1px 3px rgba(180,140,55,0.15)',
          }}
        >
          <PhoneIcon />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-lg text-ink leading-tight">
            Install Heirloom
          </div>
          <div className="text-xs sm:text-sm text-muted mt-0.5 leading-snug">
            Add Heirloom to your device for the best experience.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 h-10 rounded-lg border border-ink/20 text-ink text-xs sm:text-sm font-medium hover:border-ink/40 transition-colors"
          aria-expanded={open}
          aria-controls="install-steps"
        >
          {open ? 'Hide' : 'Show'} Instructions
          <Chevron open={open} />
        </button>
      </div>

      {open && (
        <div id="install-steps" className="mt-4 space-y-4 border-t border-hairline pt-4">
          <InstallStep
            platform="On iPhone or iPad (Safari)"
            steps={[
              <>
                Tap the <strong>Share</strong> button{' '}
                <ShareIcon /> at the bottom of the browser.
              </>,
              <>
                Scroll down and choose{' '}
                <strong>Add to Home Screen</strong>.
              </>,
              <>
                Tap <strong>Add</strong> in the top right — the
                Heirloom icon appears with your other apps.
              </>,
            ]}
          />
          <InstallStep
            platform="On Android (Chrome)"
            steps={[
              <>
                Tap the <strong>three-dot menu</strong> in the top right
                of Chrome.
              </>,
              <>
                Choose <strong>Install app</strong> (or{' '}
                <strong>Add to Home screen</strong> on older Chrome).
              </>,
              <>
                Tap <strong>Install</strong> to confirm.
              </>,
            ]}
          />
          <p className="text-xs text-muted leading-relaxed">
            On desktop browsers, look for the install icon in the
            address bar.
          </p>
        </div>
      )}
    </section>
  );
}

function InstallStep({
  platform,
  steps,
}: {
  platform: string;
  steps: React.ReactNode[];
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-widest text-gold-deep">
        {platform}
      </div>
      <ol className="space-y-1.5 list-decimal list-inside text-sm text-ink-soft">
        {steps.map((s, i) => (
          <li key={i} className="leading-relaxed">
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : undefined,
        transition: 'transform 0.15s',
      }}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block align-text-bottom text-gold-deep"
      aria-hidden="true"
    >
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}
