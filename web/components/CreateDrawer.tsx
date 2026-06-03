'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

// Each "drawer" inside the cabinet. The whole surface reads as a
// dark-walnut card-catalog cabinet pulled up from the bottom of the
// screen, with wood grain visible on every side, brass nameplate on
// top, drop-bail pull on the bottom, and each option rendered as a
// recessed ivory drawer face with a small brass knob.
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

// Layered CSS for the dark-walnut wood. A tight vertical-grain
// repeating-gradient sits on top of a softer wide-band gradient,
// over a base wood color. The result reads as figured walnut at a
// distance and stays believable up close.
const WOOD_BACKGROUND = [
  // Fine grain lines
  'repeating-linear-gradient(180deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 4px)',
  // Soft figured-wood bands
  'repeating-linear-gradient(180deg, rgba(255,210,150,0.04) 0px, rgba(255,210,150,0.04) 6px, transparent 6px, transparent 14px)',
  // Overall warm top-to-bottom shading
  'linear-gradient(180deg, #3F2613 0%, #553520 35%, #3E2614 70%, #2D1A0C 100%)',
].join(', ');

// Darker walnut for the recessed drawer well (the cavity that holds
// the stack of drawer faces).
const WELL_BACKGROUND = [
  'repeating-linear-gradient(180deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)',
  'linear-gradient(180deg, #2A1709 0%, #3B2212 100%)',
].join(', ');

// Brass with a deeper midtone band so the highlight doesn't look
// painted on.
const BRASS_GRADIENT =
  'linear-gradient(180deg, #F4DC93 0%, #D9B86A 40%, #9B7A36 52%, #C9A55C 68%, #F4DC93 100%)';

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
//  Cabinet                                                        //
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
        className="fixed inset-0 z-50 bg-black/60 transition-opacity ease-out"
        style={{
          opacity: open ? 1 : 0,
          transitionDuration: `${ANIM_MS}ms`,
        }}
      />

      {/* Cabinet body */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Create new"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] flex flex-col rounded-t-xl transition-transform ease-out overflow-hidden"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transitionDuration: `${ANIM_MS}ms`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: WOOD_BACKGROUND,
          boxShadow:
            '0 -16px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,210,150,0.08)',
        }}
      >
        {/* Top rail */}
        <div
          className="relative shrink-0"
          style={{
            paddingTop: 22,
            paddingBottom: 18,
            // Subtle inset shadow at the top so the lid feels grounded.
            boxShadow:
              'inset 0 1px 0 rgba(255,210,150,0.10), inset 0 -1px 0 rgba(0,0,0,0.55)',
          }}
        >
          <BrassStud className="absolute top-3 left-3" />
          <BrassStud className="absolute top-3 right-3" />
          <div className="flex justify-center">
            <BrassNameplate label="Create New" />
          </div>
        </div>

        {/* Drawer well — inset cavity holding the stack of drawers */}
        <div
          className="mx-3 mb-3 rounded-md p-2 overflow-y-auto"
          style={{
            background: WELL_BACKGROUND,
            boxShadow:
              'inset 0 2px 6px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,210,150,0.05)',
          }}
        >
          <ul className="space-y-2">
            {OPTIONS.map((opt) => (
              <li key={opt.href}>
                <DrawerCard option={opt} onClose={onClose} />
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom rail with drop-bail pull */}
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{
            paddingTop: 14,
            paddingBottom: 20,
            boxShadow:
              'inset 0 1px 0 rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,210,150,0.06)',
          }}
        >
          <DropBailPull />
        </div>
      </section>
    </>
  );
}

// ============================================================== //
//  Drawer card                                                    //
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
      className="group block rounded-[5px] overflow-hidden active:translate-y-px transition-transform"
      style={{
        // Subtle two-stop cream for an aged-paper feel.
        background:
          'linear-gradient(180deg, #F2E7CE 0%, #E6D5B0 100%)',
        // Crisp dark edges + a glossy top highlight + a soft bottom
        // inner shadow so it reads as a recessed wooden drawer face
        // rather than a flat card.
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.65)',
          'inset 0 -2px 4px rgba(80, 50, 25, 0.30)',
          '0 0 0 1px rgba(60, 35, 15, 0.65)',
          '0 1px 0 rgba(255, 220, 160, 0.06)',
          '0 2px 4px rgba(0,0,0,0.35)',
        ].join(', '),
      }}
    >
      <div className="flex items-center gap-3 pl-3 pr-4 py-2.5 relative">
        {/* Coin medallion */}
        <span
          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
          style={{
            color: '#5C4220',
            background:
              'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #E6CF95 55%, #C09950 100%)',
            // Inset highlight + an inner darker bezel ring for a struck-coin look.
            boxShadow: [
              'inset 0 1px 1px rgba(255,255,255,0.75)',
              'inset 0 0 0 1px rgba(80,55,25,0.55)',
              '0 1px 1.5px rgba(0,0,0,0.35)',
            ].join(', '),
          }}
        >
          {option.icon}
        </span>

        {/* Text block */}
        <div className="flex-1 min-w-0 pr-6">
          <h3
            className="font-serif leading-tight"
            style={{
              color: '#2B1808',
              fontSize: '16px',
              letterSpacing: '-0.005em',
            }}
          >
            {option.title}
          </h3>
          <p
            className="mt-0.5 leading-snug"
            style={{ color: '#5C4022', fontSize: '12.5px' }}
          >
            {option.description}
          </p>
        </div>

        {/* Small brass knob */}
        <BrassKnob className="absolute right-2.5 top-1/2 -translate-y-1/2" />
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
      className={`block w-2.5 h-2.5 rounded-full ${className ?? ''}`}
      style={{
        background:
          'radial-gradient(circle at 30% 28%, #F4DC93 0%, #C9A55C 55%, #6E5226 100%)',
        boxShadow: [
          'inset 0 1px 1px rgba(255,255,255,0.5)',
          'inset 0 0 0 0.5px rgba(50,30,10,0.65)',
          '0 1px 1px rgba(0,0,0,0.45)',
        ].join(', '),
      }}
    />
  );
}

function BrassKnob({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block rounded-full ${className ?? ''}`}
      style={{
        width: 11,
        height: 11,
        background:
          'radial-gradient(circle at 32% 28%, #F7DE8F 0%, #CFAA62 55%, #6E5226 100%)',
        boxShadow: [
          'inset 0 1px 1px rgba(255,255,255,0.55)',
          'inset 0 0 0 0.5px rgba(50,30,10,0.7)',
          '0 1px 2px rgba(0,0,0,0.55)',
        ].join(', '),
      }}
    />
  );
}

function BrassNameplate({ label }: { label: string }) {
  return (
    <div
      className="px-6 py-1.5 rounded-[3px] flex items-center gap-3"
      style={{
        background: BRASS_GRADIENT,
        boxShadow: [
          'inset 0 1px 1px rgba(255,255,255,0.6)',
          'inset 0 0 0 1px rgba(50,30,10,0.65)',
          '0 2px 5px rgba(0,0,0,0.5)',
        ].join(', '),
      }}
    >
      <span
        aria-hidden
        className="block w-1 h-1 rounded-full"
        style={{ background: '#2B1808', opacity: 0.7 }}
      />
      <span
        className="font-serif text-xs sm:text-sm tracking-[0.30em] uppercase"
        style={{ color: '#2B1808', textShadow: '0 1px 0 rgba(255,255,255,0.25)' }}
      >
        {label}
      </span>
      <span
        aria-hidden
        className="block w-1 h-1 rounded-full"
        style={{ background: '#2B1808', opacity: 0.7 }}
      />
    </div>
  );
}

// Drop-bail style cabinet pull at the bottom of the cabinet: a
// curved U-shaped brass bar held by two mount plates with screws.
function DropBailPull() {
  return (
    <span
      aria-hidden
      className="relative block"
      style={{ width: 120, height: 22 }}
    >
      {/* Left mount plate */}
      <span
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: 14,
          height: 14,
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          background: BRASS_GRADIENT,
          boxShadow: [
            'inset 0 1px 1px rgba(255,255,255,0.55)',
            'inset 0 0 0 0.5px rgba(50,30,10,0.7)',
            '0 1px 2px rgba(0,0,0,0.55)',
          ].join(', '),
        }}
      />
      {/* Right mount plate */}
      <span
        className="absolute"
        style={{
          right: 0,
          top: 0,
          width: 14,
          height: 14,
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          background: BRASS_GRADIENT,
          boxShadow: [
            'inset 0 1px 1px rgba(255,255,255,0.55)',
            'inset 0 0 0 0.5px rgba(50,30,10,0.7)',
            '0 1px 2px rgba(0,0,0,0.55)',
          ].join(', '),
        }}
      />
      {/* Curved bail (SVG so we can control the arc nicely) */}
      <svg
        viewBox="0 0 120 22"
        width={120}
        height={22}
        className="absolute inset-0"
        aria-hidden
      >
        <defs>
          <linearGradient id="bail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F4DC93" />
            <stop offset="0.45" stopColor="#D9B86A" />
            <stop offset="0.55" stopColor="#9B7A36" />
            <stop offset="1" stopColor="#F4DC93" />
          </linearGradient>
          <linearGradient id="bailShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(0,0,0,0.45)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.0)" />
          </linearGradient>
        </defs>
        {/* Shadow beneath the bail */}
        <path
          d="M 10 8 Q 60 28 110 8"
          fill="none"
          stroke="url(#bailShadow)"
          strokeWidth="5"
          strokeLinecap="round"
          transform="translate(0,2)"
        />
        {/* The bail itself */}
        <path
          d="M 10 8 Q 60 26 110 8"
          fill="none"
          stroke="url(#bail)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      {/* Screw heads on the mount plates */}
      <span
        className="absolute rounded-full"
        style={{
          left: 5,
          top: 5,
          width: 4,
          height: 4,
          background: '#3D2417',
          boxShadow: 'inset 0 -1px 0 rgba(255,210,150,0.3)',
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          right: 5,
          top: 5,
          width: 4,
          height: 4,
          background: '#3D2417',
          boxShadow: 'inset 0 -1px 0 rgba(255,210,150,0.3)',
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
