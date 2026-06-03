'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

// Each "drawer" inside the cabinet. The whole surface reads as a
// walnut card-catalog cabinet pulled up from the bottom of the
// screen — visible wood frame all four sides, brass nameplate on
// top, brass cabinet pull on the bottom, and each option rendered
// as a recessed drawer face with its own brass knob.
const OPTIONS: Array<{
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    href: '/collections/custom/new',
    title: 'Collection',
    description: 'Create a new collection category.',
    icon: <FolderIcon />,
  },
  {
    href: '/items/new',
    title: 'Item',
    description: 'Add an item to your archive.',
    icon: <TrunkIcon />,
  },
  {
    href: '/people/new',
    title: 'Legacy Person',
    description: 'Add a person and their story.',
    icon: <PortraitIcon />,
  },
  {
    href: '/inheritors/new',
    title: 'Inheritor',
    description: 'Add an inheritor or recipient.',
    icon: <EnvelopeIcon />,
  },
  {
    href: '/conservators/new',
    title: 'Conservator',
    description: 'Add a conservator or professional.',
    icon: <ShieldIcon />,
  },
];

const ANIM_MS = 360;

// Walnut wood gradient used on the cabinet frame and the bottom rail.
const WOOD_GRADIENT =
  'linear-gradient(180deg, #4A2D17 0%, #6A4226 35%, #4D3018 70%, #3A2114 100%)';
// Brass gradient used on the nameplate, knobs, and bottom pull.
const BRASS_GRADIENT =
  'linear-gradient(180deg, #F3D88B 0%, #D4B26A 45%, #A4823F 55%, #F0D584 100%)';

export default function CreateDrawer() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);

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

  // Body scroll lock while the drawer is open.
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
      {/* Footer dock — lg:hidden so desktop never sees it. */}
      <nav
        aria-label="Create"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper/95 backdrop-blur border-t border-hairline"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center items-center h-16">
          <button
            type="button"
            aria-label="Open archive cabinet"
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
          <CabinetSurface open={open} onClose={startClose} />,
          document.body,
        )}
    </>
  );
}

// ============================================================== //
//  Cabinet surface                                                //
// ============================================================== //

function CabinetSurface({
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
        className="fixed inset-0 z-50 bg-black/55 transition-opacity ease-out"
        style={{
          opacity: open ? 1 : 0,
          transitionDuration: `${ANIM_MS}ms`,
        }}
      />

      {/* Cabinet body — the entire thing is dark walnut so any
          padding around the inner drawer well reads as visible wood
          frame on every side. */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Create new"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] flex flex-col rounded-t-2xl transition-transform ease-out overflow-hidden"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transitionDuration: `${ANIM_MS}ms`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: WOOD_GRADIENT,
          boxShadow: '0 -12px 36px rgba(0,0,0,0.4)',
          // Inset ring + outer shadow give the walnut a soft chamfered edge.
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Top rail with corner brass studs and the nameplate */}
        <div
          className="relative shrink-0"
          style={{
            paddingTop: 26,
            paddingBottom: 14,
          }}
        >
          <BrassStud className="absolute top-3 left-3" />
          <BrassStud className="absolute top-3 right-3" />
          <div className="flex justify-center">
            <BrassNameplate label="Create New" />
          </div>
        </div>

        {/* Drawer well — inner ivory panel that holds the stack of
            drawers. The wood frame is visible on left + right because
            the well sits inside a px-3 / pb-3 inset, and on top
            because the nameplate area lives above it. */}
        <div
          className="mx-3 mb-3 rounded-md p-2 overflow-y-auto"
          style={{
            background:
              'linear-gradient(180deg, rgba(58, 33, 20, 0.92) 0%, rgba(70, 40, 24, 0.92) 100%)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.55)',
          }}
        >
          <ul className="space-y-2.5">
            {OPTIONS.map((opt) => (
              <li key={opt.href}>
                <DrawerCard option={opt} onClose={onClose} />
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom rail with brass cabinet pull */}
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{
            paddingTop: 12,
            paddingBottom: 18,
          }}
        >
          <BrassCabinetPull />
        </div>
      </section>
    </>
  );
}

// ============================================================== //
//  Drawer card — a single archive drawer face                     //
// ============================================================== //

function DrawerCard({
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
      className="group block rounded-md overflow-hidden active:translate-y-px transition-transform"
      style={{
        background:
          'linear-gradient(180deg, #F1E6CD 0%, #E8D9B6 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(70,45,25,0.35), 0 1px 0 rgba(70,45,25,0.55), 0 2px 4px rgba(0,0,0,0.25)',
      }}
    >
      <div className="flex items-center gap-3 pl-3 pr-3 py-3 relative">
        {/* Brass medallion glyph */}
        <span
          className="shrink-0 w-12 h-12 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/30 [&_svg]:w-5 [&_svg]:h-5"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
            boxShadow:
              'inset 0 1px 2px rgba(255,255,255,0.7), 0 1px 3px rgba(120,90,40,0.25)',
          }}
        >
          {option.icon}
        </span>

        {/* Text block */}
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-serif text-base sm:text-lg leading-tight"
            style={{ color: '#2C1A0E' }}>
            {option.title}
          </h3>
          <p className="text-xs sm:text-[13px] mt-0.5 leading-snug"
            style={{ color: '#5C402A' }}>
            {option.description}
          </p>
        </div>

        {/* Brass knob on the right side of the drawer */}
        <BrassKnob className="absolute right-3 top-1/2 -translate-y-1/2" />
      </div>
    </Link>
  );
}

// ============================================================== //
//  Brass hardware                                                 //
// ============================================================== //

function BrassStud({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block w-3 h-3 rounded-full ${className ?? ''}`}
      style={{
        background:
          'radial-gradient(circle at 30% 30%, #F3D88B 0%, #C4A35E 60%, #8C6F38 100%)',
        boxShadow:
          'inset 0 1px 1px rgba(255,255,255,0.5), 0 1px 1px rgba(0,0,0,0.35)',
      }}
    />
  );
}

function BrassKnob({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block w-3.5 h-3.5 rounded-full ${className ?? ''}`}
      style={{
        background:
          'radial-gradient(circle at 30% 28%, #F7DE8F 0%, #C8A862 55%, #6E5226 100%)',
        boxShadow:
          'inset 0 1px 1px rgba(255,255,255,0.55), 0 1px 2px rgba(0,0,0,0.4)',
      }}
    />
  );
}

function BrassNameplate({ label }: { label: string }) {
  return (
    <div
      className="px-6 py-1.5 rounded-md flex items-center gap-3"
      style={{
        background: BRASS_GRADIENT,
        border: '1px solid rgba(60, 40, 20, 0.55)',
        boxShadow:
          'inset 0 1px 2px rgba(255,255,255,0.55), 0 2px 5px rgba(0,0,0,0.32)',
      }}
    >
      <span
        aria-hidden
        className="block w-1 h-1 rounded-full"
        style={{ background: '#3D2417', opacity: 0.7 }}
      />
      <span
        className="font-serif text-xs sm:text-sm tracking-[0.28em] uppercase"
        style={{ color: '#3D2417' }}
      >
        {label}
      </span>
      <span
        aria-hidden
        className="block w-1 h-1 rounded-full"
        style={{ background: '#3D2417', opacity: 0.7 }}
      />
    </div>
  );
}

function BrassCabinetPull() {
  return (
    <span
      aria-hidden
      className="relative flex items-center"
      style={{ width: 96, height: 14 }}
    >
      {/* Decorative end-cap screws */}
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #F3D88B 0%, #B89758 65%, #6E5226 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5)',
        }}
      />
      <span
        className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #F3D88B 0%, #B89758 65%, #6E5226 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5)',
        }}
      />
      {/* The pull bar itself */}
      <span
        className="absolute left-2 right-2 top-1/2 -translate-y-1/2 rounded-full"
        style={{
          height: 8,
          background: BRASS_GRADIENT,
          border: '1px solid rgba(60, 40, 20, 0.6)',
          boxShadow:
            'inset 0 1px 1px rgba(255,255,255,0.55), 0 2px 3px rgba(0,0,0,0.4)',
        }}
      />
    </span>
  );
}

// ============================================================== //
//  Glyphs                                                         //
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
