'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

const OPTIONS: Array<{
  href: string;
  title: string;
  description: string;
  examples: string;
  icon: React.ReactNode;
}> = [
  {
    href: '/collections/add',
    title: 'Collection',
    description: 'Pick from the curated set or start your own.',
    examples: 'Sports Memorabilia, Military Artifacts, Family Photographs',
    icon: <FolderIcon />,
  },
  {
    href: '/items/new',
    title: 'Item',
    description: 'Add an item to an existing collection.',
    examples: 'Pocket watch, Letter, Baseball card',
    icon: <TrunkIcon />,
  },
  {
    href: '/people/new',
    title: 'Legacy Person',
    description: "Add someone connected to an item's story.",
    examples: 'Grandpa Joe, Aunt Martha, Original owner',
    icon: <PortraitIcon />,
  },
  {
    href: '/inheritors/new',
    title: 'Inheritor',
    description: 'Assign someone to receive items or collections.',
    examples: 'Primary inheritor, Alternate inheritor',
    icon: <EnvelopeIcon />,
  },
  {
    href: '/conservators/new',
    title: 'Conservator',
    description: 'Invite someone to help maintain the archive.',
    examples: 'Family historian, Trusted relative, Archivist',
    icon: <ShieldIcon />,
  },
];

const ANIM_MS = 320;

const BRASS_GRADIENT =
  'linear-gradient(180deg, #F6E09B 0%, #DDBA6E 38%, #8C6C2E 52%, #C9A55C 66%, #F2DA90 100%)';

const COIN_GREEN_GRADIENT =
  'radial-gradient(circle at 32% 30%, #2F4D3E 0%, #1F3A2E 55%, #122418 100%)';

export default function CreateDrawer() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') startClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  function startOpen() {
    setActive(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpen(true));
    });
  }

  function startClose() {
    setOpen(false);
    window.setTimeout(() => setActive(false), ANIM_MS);
  }

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-30 bg-cream/95 backdrop-blur border-t border-hairline"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-3 items-center h-16 max-w-md mx-auto px-6">
          <Link
            href="/home"
            aria-label="Home"
            className="flex flex-col items-center gap-0.5 text-ink hover:text-forest transition-colors"
          >
            <HomeIcon />
            <span className="text-xs">Home</span>
          </Link>
          <div className="flex items-center justify-center">
            <button
              type="button"
              aria-label="Create new"
              aria-expanded={active}
              onClick={startOpen}
              className="-mt-7 inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest text-cream shadow-raised border-4 border-cream hover:bg-forest-deep active:scale-95 transition-transform"
            >
              <PlusIcon />
            </button>
          </div>
          <Link
            href="/collections"
            aria-label="Collections"
            className="flex flex-col items-center gap-0.5 text-ink hover:text-forest transition-colors"
          >
            <GalleriesIcon />
            <span className="text-xs">Collections</span>
          </Link>
        </div>
      </nav>

      {mounted &&
        active &&
        createPortal(
          <Sheet open={open} onClose={startClose} />,
          document.body,
        )}
    </>
  );
}

function Sheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/55 transition-opacity ease-out"
        style={{
          opacity: open ? 1 : 0,
          transitionDuration: `${ANIM_MS}ms`,
        }}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label="Create new"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] flex flex-col rounded-t-3xl bg-cream transition-transform ease-out overflow-hidden"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transitionDuration: `${ANIM_MS}ms`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -16px 40px rgba(40,25,10,0.35)',
        }}
      >
        <div className="relative shrink-0 pt-7 pb-4 px-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full border border-hairline flex items-center justify-center text-muted hover:bg-cream-soft transition-colors"
          >
            <CloseIcon />
          </button>
          <div className="flex flex-col items-center text-center">
            <Ornament />
            <h2 className="font-serif text-3xl text-ink mt-2 leading-tight">
              Create New
            </h2>
            <p className="text-sm text-muted mt-1">
              Choose what you want to add to your archive.
            </p>
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-6">
          <ul className="space-y-2.5">
            {OPTIONS.map((opt) => (
              <li key={opt.href}>
                <OptionCard option={opt} onClose={onClose} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function OptionCard({
  option,
  onClose,
}: {
  option: (typeof OPTIONS)[number];
  onClose: () => void;
}) {
  return (
    <Link
      href={option.href}
      onClick={onClose}
      className="group flex items-center gap-3.5 rounded-2xl bg-paper border border-hairline pl-3 pr-3.5 py-3 hover:shadow-card active:translate-y-px transition-all"
    >
      <CoinMedallion>{option.icon}</CoinMedallion>
      <div className="flex-1 min-w-0">
        <h3 className="font-serif text-lg text-ink leading-tight">
          {option.title}
        </h3>
        <p className="text-sm text-muted mt-0.5 leading-snug">
          {option.description}
        </p>
        <p className="text-xs text-muted mt-0.5 truncate">
          <span className="font-medium">Examples:</span> {option.examples}
        </p>
      </div>
      <BrassChevron />
    </Link>
  );
}

function CoinMedallion({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="shrink-0 relative flex items-center justify-center"
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: BRASS_GRADIENT,
        boxShadow: [
          'inset 0 1px 1px rgba(255,255,255,0.55)',
          'inset 0 0 0 0.5px rgba(45,25,5,0.7)',
          '0 2px 4px rgba(60,40,15,0.25)',
        ].join(', '),
      }}
    >
      <span
        className="flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
        style={{
          position: 'absolute',
          inset: 4,
          borderRadius: '50%',
          background: COIN_GREEN_GRADIENT,
          boxShadow: [
            'inset 0 1px 2px rgba(255,255,255,0.10)',
            'inset 0 0 0 1px rgba(0,0,0,0.5)',
            'inset 0 -2px 4px rgba(0,0,0,0.45)',
          ].join(', '),
          color: '#F0D78A',
        }}
      >
        {children}
      </span>
    </span>
  );
}

function BrassChevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 18"
      width={12}
      height={18}
      className="shrink-0"
    >
      <defs>
        <linearGradient id="brass-chev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6E09B" />
          <stop offset="0.4" stopColor="#DDBA6E" />
          <stop offset="0.55" stopColor="#8C6C2E" />
          <stop offset="1" stopColor="#F2DA90" />
        </linearGradient>
      </defs>
      <path
        d="M 2 1.5 L 10 9 L 2 16.5"
        fill="none"
        stroke="url(#brass-chev)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Ornament() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 80 12"
      width={64}
      height={10}
      style={{ color: '#A8852E' }}
    >
      <path
        d="M 5 6 Q 18 0 30 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M 50 6 Q 62 0 75 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M 40 1 L 44 6 L 40 11 L 36 6 Z" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3l9 8h-2v9h-5v-6h-4v6H5v-9H3z" />
    </svg>
  );
}

function GalleriesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 10h18" />
    </svg>
  );
}

function TrunkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="9" width="18" height="11" rx="1.5" />
      <path d="M3 9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4" />
      <path d="M3 13h18" />
      <rect x="10.5" y="11" width="3" height="4" rx="0.5" />
    </svg>
  );
}

function PortraitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 19c0-3 2.5-5 5-5s5 2 5 5" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 6l9 7 9-7" />
      <circle cx="12" cy="14" r="2.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
