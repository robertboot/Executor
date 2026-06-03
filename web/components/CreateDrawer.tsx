'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

// Each "card" inside the drawer. The drawer reads as a curator's
// cabinet drawer pulled open from the bottom of the screen — wood
// frame, brass nameplate, ivory paper records. Tapping a card both
// closes the drawer and navigates to the matching create flow.
const OPTIONS: Array<{
  href: string;
  title: string;
  description: string;
  examples: string;
  icon: React.ReactNode;
}> = [
  {
    href: '/collections/custom/new',
    title: 'Collection',
    description: 'Create a new collection.',
    examples: 'Sports Memorabilia · Military Artifacts · Family Photographs',
    icon: <FolderIcon />,
  },
  {
    href: '/items/new',
    title: 'Item',
    description: 'Add an item to an existing collection.',
    examples: 'Pocket watch · Letter · Baseball card',
    icon: <TrunkIcon />,
  },
  {
    href: '/people/new',
    title: 'Legacy Person',
    description: "Add someone connected to an item's story.",
    examples: 'Grandpa Joe · Aunt Martha · Original owner',
    icon: <PortraitIcon />,
  },
  {
    href: '/inheritors/new',
    title: 'Inheritor',
    description: 'Assign someone to receive items or collections.',
    examples: 'Primary inheritor · Alternate inheritor',
    icon: <EnvelopeIcon />,
  },
  {
    href: '/conservators/new',
    title: 'Conservator',
    description: 'Invite someone to help maintain the archive.',
    examples: 'Family historian · Trusted relative · Archivist',
    icon: <ShieldIcon />,
  },
];

const ANIM_MS = 320;

export default function CreateDrawer() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false); // controls portal mount
  const [open, setOpen] = useState(false); // controls slide-in transform

  useEffect(() => setMounted(true), []);

  // Esc closes.
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') startClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

  // Lock body scroll while the drawer is open so the page behind
  // doesn't bounce under the user's finger.
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
    // Wait a frame so the initial transform=translateY(100%) renders
    // before we flip to translateY(0); otherwise the slide-in is lost.
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
      {/* Footer dock — lg:hidden so desktop still uses the header
          for navigation and never sees the dock. */}
      <nav
        aria-label="Create"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper/95 backdrop-blur border-t border-hairline"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center items-center h-16">
          <button
            type="button"
            aria-label="Open archive drawer"
            aria-expanded={active}
            onClick={startOpen}
            className="-mt-7 inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest text-cream shadow-raised border-4 border-paper hover:bg-forest-deep active:scale-95 transition-transform"
          >
            <PlusIcon />
          </button>
        </div>
      </nav>

      {mounted && active &&
        createPortal(
          <DrawerSurface open={open} onClose={startClose} />,
          document.body,
        )}
    </>
  );
}

// ============================================================== //
//  Drawer surface — backdrop + walnut/brass cabinet               //
// ============================================================== //

function DrawerSurface({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/45 transition-opacity ease-out"
        style={{
          opacity: open ? 1 : 0,
          transitionDuration: `${ANIM_MS}ms`,
        }}
      />

      {/* Drawer body */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Create new"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] flex flex-col rounded-t-2xl shadow-raised transition-transform ease-out"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transitionDuration: `${ANIM_MS}ms`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: '#EAE2D2',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.25)',
        }}
      >
        {/* Walnut wood top frame */}
        <div
          className="relative shrink-0"
          style={{
            height: 26,
            background:
              'linear-gradient(180deg, #3D2417 0%, #58371F 45%, #3A2114 100%)',
            boxShadow:
              'inset 0 -1px 0 rgba(255,255,255,0.05), 0 1px 4px rgba(0,0,0,0.18)',
          }}
        >
          {/* Brass corner studs */}
          <BrassStud className="absolute top-1/2 left-3 -translate-y-1/2" />
          <BrassStud className="absolute top-1/2 right-3 -translate-y-1/2" />
        </div>

        {/* Brass nameplate overlapping the wood band */}
        <div className="flex justify-center -mt-4 pb-2 shrink-0">
          <div
            className="px-6 py-1.5 rounded-md flex items-center gap-3"
            style={{
              background:
                'linear-gradient(180deg, #E8C97A 0%, #C2A35E 48%, #A1813F 50%, #E8C97A 100%)',
              border: '1px solid rgba(70, 45, 25, 0.55)',
              boxShadow:
                'inset 0 1px 2px rgba(255,255,255,0.55), 0 2px 5px rgba(0,0,0,0.22)',
            }}
          >
            <BrassPinDot />
            <span
              className="font-serif text-xs sm:text-sm tracking-[0.28em] uppercase"
              style={{ color: '#3D2417' }}
            >
              Create New
            </span>
            <BrassPinDot />
          </div>
        </div>

        {/* Drawer "rail" — subtle separator beneath the plaque */}
        <div
          className="mx-4 mb-3 shrink-0"
          style={{
            height: 1,
            background:
              'linear-gradient(to right, transparent, rgba(70,45,25,0.25), transparent)',
          }}
          aria-hidden
        />

        {/* Cards */}
        <ul className="px-4 pb-6 space-y-2.5 overflow-y-auto">
          {OPTIONS.map((opt) => (
            <li key={opt.href}>
              <Link
                href={opt.href}
                onClick={onClose}
                className="group flex items-center gap-4 bg-paper border border-hairline rounded-xl p-3.5 hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all"
              >
                <span
                  className="shrink-0 w-12 h-12 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/25 [&_svg]:w-5 [&_svg]:h-5"
                  style={{
                    background:
                      'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
                    boxShadow:
                      'inset 0 1px 2px rgba(255,255,255,0.7), 0 1px 3px rgba(180,140,55,0.15)',
                  }}
                >
                  {opt.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-base sm:text-lg text-ink leading-tight">
                    {opt.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted mt-0.5 leading-snug">
                    {opt.description}
                  </p>
                  <p className="text-[11px] text-gold-deep italic mt-1 truncate">
                    {opt.examples}
                  </p>
                </div>
                <ChevronRight className="shrink-0 text-muted group-hover:text-ink transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function BrassStud({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block w-3 h-3 rounded-full ${className ?? ''}`}
      style={{
        background:
          'radial-gradient(circle at 30% 30%, #F1D78A 0%, #C2A35E 55%, #8C6F38 100%)',
        boxShadow:
          'inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 1px rgba(0,0,0,0.25)',
      }}
    />
  );
}

function BrassPinDot() {
  return (
    <span
      aria-hidden
      className="block w-1 h-1 rounded-full"
      style={{ background: '#3D2417', opacity: 0.7 }}
    />
  );
}

// ============================================================== //
//  Icons                                                          //
// ============================================================== //

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

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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
  // Stylized treasure / artifact case — lid + lock plate + handle.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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
  // Person bust in a soft frame (portrait silhouette).
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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
  // Wax-sealed envelope: flap lines + a round seal in the center.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
