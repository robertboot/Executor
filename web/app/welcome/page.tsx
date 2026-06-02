import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { APP_VERSION } from '@/lib/version';
import { ARCHETYPES } from '@/lib/onboarding';
import { dismissWelcome } from './actions';
import InstallSection from './InstallSection';

export const metadata = { title: 'Welcome — Heirloom' };
export const dynamic = 'force-dynamic';

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Hero image — full-bleed up top */}
      <section className="relative w-full overflow-hidden">
        <div
          className="relative w-full aspect-[16/10] sm:aspect-[16/7] lg:aspect-[16/6]"
          style={{
            background:
              'linear-gradient(135deg, #E8D9B8 0%, #D4B97D 45%, #C19A56 100%)',
          }}
        >
          <Image
            src="/welcome-hero.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          {/* Subtle vignette so the bottom curve reads as a vintage card */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, transparent 70%, rgba(248,243,229,0.45) 100%)',
            }}
            aria-hidden
          />
        </div>

        {/* Curved bottom — cream fan over the hero to suggest a keepsake card */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-cream"
          aria-hidden
          style={{
            borderTopLeftRadius: '50% 100%',
            borderTopRightRadius: '50% 100%',
          }}
        />

        {/* Keepsake-box medallion overlapping the curve */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 sm:bottom-10">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-paper border border-hairline shadow-card flex items-center justify-center text-gold-deep"
            style={{
              boxShadow:
                'inset 0 1px 2px rgba(255,255,255,0.7), 0 6px 18px rgba(180,140,55,0.18)',
            }}
          >
            <KeepsakeBoxIcon />
          </div>
        </div>
      </section>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 -mt-2">
        {/* Branded title + decorative rule */}
        <div className="text-center space-y-2 pt-2">
          <h2 className="font-serif text-2xl sm:text-3xl text-forest leading-none">
            Heirloom
          </h2>
          <DecorativeRule />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
            Welcome to Heirloom
          </h1>
          <p className="text-muted text-sm sm:text-base max-w-md mx-auto leading-relaxed pt-2">
            Preserve the stories, people, and treasures that matter
            most to your family.
          </p>
        </div>

        {/* Primary CTA + secondary link */}
        <div className="mt-7 flex flex-col items-center gap-4">
          <form action={dismissWelcome} className="w-full max-w-sm">
            <input type="hidden" name="dest" value="/home" />
            <button
              type="submit"
              className="w-full h-14 rounded-xl bg-forest text-cream text-base font-medium hover:bg-forest-deep transition-colors shadow-card"
            >
              Begin Your Archive
            </button>
          </form>
          <a
            href="#install"
            className="text-sm font-medium text-forest hover:text-forest-deep inline-flex items-center gap-1"
          >
            Learn How Heirloom Works
            <ChevronRightIcon />
          </a>
        </div>

        {/* "What Type of Collector Are You?" */}
        <section className="mt-12 space-y-5">
          <header className="flex items-center justify-center gap-3">
            <LeafFlourish flip />
            <h2 className="font-serif text-xl sm:text-2xl text-ink text-center">
              What Type of Collector Are You?
            </h2>
            <LeafFlourish />
          </header>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ARCHETYPES.map((a) => (
              <li key={a.key}>
                <ArchetypeCard
                  title={a.title}
                  tagline={a.tagline}
                  imageSrc={`/archetypes/${a.key}-full.png`}
                  icon={iconFor(a.key)}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Install (collapsible) */}
        <section className="mt-10">
          <InstallSection />
        </section>

        {/* Your Archive Is Waiting */}
        <section className="mt-6 bg-paper border border-hairline rounded-2xl p-5 shadow-card">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="shrink-0 hidden sm:block text-gold-deep">
              <KeepsakeBoxIcon size={64} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-xl sm:text-2xl text-ink leading-tight">
                Your Archive Is Waiting
              </h3>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                Start by creating your first collection or scanning
                your first item.
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
              <form action={dismissWelcome}>
                <input
                  type="hidden"
                  name="dest"
                  value="/collections"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
                >
                  Create Collection
                </button>
              </form>
              <form action={dismissWelcome}>
                <input type="hidden" name="dest" value="/scan" />
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 h-11 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors"
                >
                  <ScanIcon />
                  Scan Item
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Decorative footer leaf */}
        <div className="mt-10 mb-4 flex items-center justify-center gap-2 text-gold-deep/60">
          <LeafFlourish flip />
          <LeafFlourish />
        </div>
      </main>

      <footer className="text-center text-[10px] uppercase tracking-widest text-muted py-6">
        Heirloom · v{APP_VERSION} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// ============================================================== //
//  Archetype card                                                 //
// ============================================================== //

function ArchetypeCard({
  title,
  tagline,
  imageSrc,
  icon,
}: {
  title: string;
  tagline: string;
  imageSrc: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="relative bg-paper border border-hairline rounded-2xl overflow-hidden shadow-card h-full flex flex-col">
      <div className="relative aspect-[4/3] bg-cream-soft">
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover"
        />
      </div>
      {/* Gold medallion overlapping bottom of image */}
      <div className="relative -mt-6 mb-2 flex justify-center">
        <span
          className="w-12 h-12 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/25"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
            boxShadow:
              'inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 5px rgba(180,140,55,0.15)',
          }}
        >
          {icon}
        </span>
      </div>
      <div className="px-3 pb-4 text-center space-y-1.5 flex-1 flex flex-col">
        <h4 className="font-serif text-base text-ink leading-tight">
          {title}
        </h4>
        <p className="text-[11px] text-muted leading-snug flex-1">
          {tagline}
        </p>
      </div>
    </article>
  );
}

// Pick a glyph for each archetype card.
function iconFor(
  key: string,
): React.ReactNode {
  switch (key) {
    case 'family-legacy':
      return <FamilyTreeIcon />;
    case 'collector':
      return <TrophyIcon />;
    case 'luxury':
      return <DiamondIcon />;
    case 'historical':
      return <ColumnIcon />;
    case 'mixed':
    default:
      return <ArchiveIcon />;
  }
}

// ============================================================== //
//  Decorative pieces                                              //
// ============================================================== //

function DecorativeRule() {
  return (
    <div
      className="flex items-center justify-center gap-3 text-forest/40"
      aria-hidden
    >
      <span className="h-px w-12 sm:w-16 bg-current" />
      <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </svg>
      <span className="h-px w-12 sm:w-16 bg-current" />
    </div>
  );
}

function LeafFlourish({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 16"
      width={48}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gold-deep/60"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <path d="M2 8h22" />
      <path d="M26 8c4-4 8-4 12 0" />
      <path d="M28 8c-1 2 0 4 2 4" />
      <path d="M34 8c1 2 0 4-2 4" />
      <path d="M38 8c2 0 4 1 6 0" />
    </svg>
  );
}

// ============================================================== //
//  Glyphs                                                         //
// ============================================================== //

function KeepsakeBoxIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Box body */}
      <rect x="10" y="24" width="44" height="28" rx="3" />
      {/* Lid (slightly open) */}
      <path d="M10 24l4-8a3 3 0 0 1 2.7-1.7h30.6A3 3 0 0 1 50 16l4 8" />
      <path d="M10 24h44" />
      {/* Heart on the front */}
      <path d="M32 46l-5-5a3 3 0 0 1 5-4 3 3 0 0 1 5 4z" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 12h10" />
    </svg>
  );
}

// Archetype glyphs
function FamilyTreeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v4M6 14v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <circle cx="6" cy="17" r="2" />
      <circle cx="12" cy="17" r="2" />
      <circle cx="18" cy="17" r="2" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4h10v6a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
      <path d="M10 16h4l-1 4h-2z" />
      <path d="M8 20h8" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20M9 3l3 6 3-6M9 9l3 12 3-12" />
    </svg>
  );
}

function ColumnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9L12 4l9 5" />
      <path d="M3 9h18M3 20h18" />
      <path d="M7 9v11M12 9v11M17 9v11" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="4" y="8" width="16" height="12" rx="1" />
      <path d="M10 13h4" />
    </svg>
  );
}
