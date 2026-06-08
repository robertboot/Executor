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
    href: '/collections/custom/new',
    title: 'Collection',
    description: 'Create a new collection category.',
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

const ANIM_MS = 360;

// Layered walnut with visible vertical grain.
const WOOD_BACKGROUND = [
  // Fine grain striations
  'repeating-linear-gradient(180deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 5px)',
  // Wider figured bands
  'repeating-linear-gradient(180deg, rgba(255,210,150,0.04) 0px, rgba(255,210,150,0.04) 7px, transparent 7px, transparent 15px)',
  // Base warm-to-deep shading
  'linear-gradient(180deg, #4A2D17 0%, #5C3820 35%, #432712 70%, #2E1A0B 100%)',
].join(', ');

// Deeper walnut + inset shadow for the cavity that holds the drawers.
const WELL_BACKGROUND = [
  'repeating-linear-gradient(180deg, rgba(0,0,0,0.20) 0px, rgba(0,0,0,0.20) 1px, transparent 1px, transparent 4px)',
  'linear-gradient(180deg, #261408 0%, #371F0E 100%)',
].join(', ');

// Bright polished brass — used on the plaque, knobs, chevrons, and
// the drop-bail pull. The dark midband is the trick that makes it
// read as metal rather than yellow paint.
const BRASS_GRADIENT =
  'linear-gradient(180deg, #F6E09B 0%, #DDBA6E 38%, #8C6C2E 52%, #C9A55C 66%, #F2DA90 100%)';

// Deep antique forest green for the coin medallions.
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
        className="fixed inset-0 z-50 bg-black/65 transition-opacity ease-out"
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
        className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] flex flex-col rounded-t-lg transition-transform ease-out overflow-hidden"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transitionDuration: `${ANIM_MS}ms`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: WOOD_BACKGROUND,
          boxShadow:
            '0 -18px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,210,150,0.10)',
        }}
      >
        {/* Top rail with brass corner studs + cartouche nameplate */}
        <div
          className="relative shrink-0"
          style={{
            paddingTop: 16,
            paddingBottom: 16,
            boxShadow:
              'inset 0 1px 0 rgba(255,210,150,0.12), inset 0 -1px 0 rgba(0,0,0,0.6)',
          }}
        >
          <BrassStud className="absolute top-3 left-3" />
          <BrassStud className="absolute top-3 right-3" />
          <div className="flex justify-center">
            <BrassCartouche label="Create New" />
          </div>
        </div>

        {/* Drawer well */}
        <div
          className="mx-3 mb-3 rounded-md p-2.5 overflow-y-auto"
          style={{
            background: WELL_BACKGROUND,
            boxShadow:
              'inset 0 2px 7px rgba(0,0,0,0.75), inset 0 -1px 0 rgba(255,210,150,0.06)',
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

        {/* Bottom rail with corner studs + drop-bail pull */}
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{
            paddingTop: 14,
            paddingBottom: 18,
            boxShadow:
              'inset 0 1px 0 rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,210,150,0.06)',
          }}
        >
          <BrassStud className="absolute bottom-3 left-3" />
          <BrassStud className="absolute bottom-3 right-3" />
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
      className="group block rounded-[4px] overflow-hidden active:translate-y-px transition-transform relative"
      style={{
        // Mottled aged paper: a soft radial in the middle plus a
        // base cream gradient. Two darker corner washes give it a
        // slightly worn / vignetted edge.
        background: [
          'radial-gradient(ellipse at 28% 35%, rgba(255,255,255,0.45) 0%, transparent 55%)',
          'radial-gradient(ellipse at 85% 75%, rgba(120,80,40,0.10) 0%, transparent 60%)',
          'linear-gradient(180deg, #F2E5C8 0%, #E5D3A8 100%)',
        ].join(', '),
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.7)',
          'inset 0 -2px 5px rgba(80,50,25,0.30)',
          '0 0 0 1px rgba(60, 35, 15, 0.7)',
          '0 1px 0 rgba(255, 220, 160, 0.08)',
          '0 3px 5px rgba(0,0,0,0.4)',
        ].join(', '),
      }}
    >
      <div className="flex items-center gap-3.5 pl-3 pr-3.5 py-3 relative">
        {/* Forest-green brass-rimmed coin medallion */}
        <CoinMedallion>{option.icon}</CoinMedallion>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-5">
          <h3
            className="font-serif leading-tight"
            style={{
              color: '#241408',
              fontSize: '17px',
              letterSpacing: '-0.005em',
            }}
          >
            {option.title}
          </h3>
          <p
            className="mt-0.5 leading-snug"
            style={{ color: '#4F361F', fontSize: '12.5px' }}
          >
            {option.description}
          </p>
          <p
            className="mt-0.5 leading-snug truncate"
            style={{ color: '#6B4D2D', fontSize: '11px' }}
          >
            <span style={{ fontWeight: 600 }}>Examples:</span> {option.examples}
          </p>
        </div>

        {/* Brass chevron on the right */}
        <BrassChevron className="absolute right-2.5 top-1/2 -translate-y-1/2" />
      </div>
    </Link>
  );
}

// ============================================================== //
//  Coin medallion                                                 //
// ============================================================== //

function CoinMedallion({ children }: { children: React.ReactNode }) {
  // Two layers: the forest-green coin body, sitting inside a brass
  // outer ring. The brass ring is a separate wrapper so it can carry
  // its own metallic highlight + dark rim.
  return (
    <span
      className="shrink-0 relative flex items-center justify-center"
      style={{
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: BRASS_GRADIENT,
        boxShadow: [
          'inset 0 1px 1px rgba(255,255,255,0.55)',
          'inset 0 0 0 0.5px rgba(45,25,5,0.8)',
          '0 2px 3px rgba(0,0,0,0.4)',
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

// ============================================================== //
//  Brass hardware                                                 //
// ============================================================== //

function BrassStud({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block rounded-full ${className ?? ''}`}
      style={{
        width: 12,
        height: 12,
        background:
          'radial-gradient(circle at 32% 28%, #F6E09B 0%, #CFAA62 55%, #6E5226 100%)',
        boxShadow: [
          'inset 0 1px 1px rgba(255,255,255,0.55)',
          'inset 0 0 0 0.5px rgba(45,25,5,0.75)',
          '0 1px 2px rgba(0,0,0,0.55)',
        ].join(', '),
      }}
    />
  );
}

function BrassChevron({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 18"
      width={11}
      height={17}
      className={className}
      style={{
        filter:
          'drop-shadow(0 1px 1px rgba(0,0,0,0.45)) drop-shadow(0 0 0.5px rgba(60,40,15,0.8))',
      }}
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

// Long pill-shaped brass cartouche with small screw dots near each
// end and serif "CREATE NEW" copy centered.
function BrassCartouche({ label }: { label: string }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        // Long, slim pill — wider than tall so it reads as a label
        // holder pinned to the cabinet.
        minWidth: 220,
        height: 36,
        padding: '0 26px',
        borderRadius: 999,
        background: BRASS_GRADIENT,
        boxShadow: [
          'inset 0 1px 2px rgba(255,255,255,0.7)',
          'inset 0 -1px 1px rgba(50,30,5,0.5)',
          'inset 0 0 0 1px rgba(45,25,5,0.65)',
          '0 3px 7px rgba(0,0,0,0.55)',
        ].join(', '),
      }}
    >
      {/* Screw dots flanking the text */}
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 4.5,
          height: 4.5,
          background: '#2B1808',
          boxShadow:
            'inset 0 -1px 0 rgba(255,210,150,0.35), 0 0 0 0.5px rgba(0,0,0,0.5)',
        }}
      />
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 4.5,
          height: 4.5,
          background: '#2B1808',
          boxShadow:
            'inset 0 -1px 0 rgba(255,210,150,0.35), 0 0 0 0.5px rgba(0,0,0,0.5)',
        }}
      />
      <span
        className="font-serif uppercase"
        style={{
          color: '#2B1808',
          fontSize: '13px',
          letterSpacing: '0.32em',
          textShadow: '0 1px 0 rgba(255,255,255,0.32)',
        }}
      >
        <span style={{ marginRight: '0.5em' }}>•</span>
        {label}
        <span style={{ marginLeft: '0.5em' }}>•</span>
      </span>
    </div>
  );
}

// Drop-bail cabinet pull: a curved brass bar between two larger
// rounded mount plates with dark screw heads.
function DropBailPull() {
  return (
    <span
      aria-hidden
      className="relative block"
      style={{ width: 168, height: 26 }}
    >
      {/* Left mount plate */}
      <MountPlate style={{ left: 0 }} />
      {/* Right mount plate */}
      <MountPlate style={{ right: 0 }} />
      {/* Curved bail */}
      <svg
        viewBox="0 0 168 26"
        width={168}
        height={26}
        className="absolute inset-0"
        aria-hidden
      >
        <defs>
          <linearGradient id="bail-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F6E09B" />
            <stop offset="0.4" stopColor="#DDBA6E" />
            <stop offset="0.55" stopColor="#8C6C2E" />
            <stop offset="1" stopColor="#F2DA90" />
          </linearGradient>
          <linearGradient id="bail-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(0,0,0,0.5)" />
            <stop offset="1" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
        {/* Cast shadow under the bail */}
        <path
          d="M 14 11 Q 84 32 154 11"
          fill="none"
          stroke="url(#bail-shadow)"
          strokeWidth="6"
          strokeLinecap="round"
          transform="translate(0,3)"
        />
        {/* The brass bail */}
        <path
          d="M 14 11 Q 84 30 154 11"
          fill="none"
          stroke="url(#bail-fill)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function MountPlate({ style }: { style?: React.CSSProperties }) {
  return (
    <span
      className="absolute"
      style={{
        ...style,
        top: 0,
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: BRASS_GRADIENT,
        boxShadow: [
          'inset 0 1px 1px rgba(255,255,255,0.55)',
          'inset 0 0 0 0.5px rgba(45,25,5,0.8)',
          '0 2px 3px rgba(0,0,0,0.55)',
        ].join(', '),
      }}
    >
      {/* Dark screw head inset */}
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 6,
          height: 6,
          background: '#2B1808',
          boxShadow:
            'inset 0 -1px 0 rgba(255,210,150,0.35), 0 0 0 0.5px rgba(0,0,0,0.4)',
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
