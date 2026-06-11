import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { APP_VERSION } from '@/lib/version';
import DismissCTA from './DismissCTA';
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
            src="/legacy-people-hero.png"
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

        {/* Logo icon (no wordmark) overlapping the curve */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-8">
          <Image
            src="/icon-192.png"
            alt="Heirloom"
            width={96}
            height={96}
            priority
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-card"
          />
        </div>
      </section>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 -mt-2">
        {/* Welcome title */}
        <div className="text-center space-y-2 pt-2">
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
          <DismissCTA
            dest="/tutorial"
            className="w-full max-w-sm h-14 rounded-xl bg-forest text-cream text-base font-medium hover:bg-forest-deep transition-colors shadow-card disabled:opacity-60"
          >
            Begin Your Archive
          </DismissCTA>
          <a
            href="#install"
            className="text-sm font-medium text-forest hover:text-forest-deep inline-flex items-center gap-1"
          >
            Learn How Heirloom Works
            <ChevronRightIcon />
          </a>
        </div>

        {/* "Meet Your Contributors" — explains the three roles */}
        <section className="mt-12 space-y-5">
          <header className="flex items-center justify-center gap-3">
            <LeafFlourish flip />
            <h2 className="font-serif text-xl sm:text-2xl text-ink text-center">
              Meet Your Contributors
            </h2>
            <LeafFlourish />
          </header>
          <p className="text-sm text-muted text-center max-w-xl mx-auto leading-relaxed">
            Every heirloom has a human chain — past, present, and future.
            Three role types let you capture each side.
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <li>
              <RoleCard
                kicker="The Past"
                title="Originator"
                body="People who owned, made, or appear in an item's story."
                example="Grandpa Joe · Aunt Martha · Original owner"
                icon={<PeopleRoleIcon />}
              />
            </li>
            <li>
              <RoleCard
                kicker="The Future"
                title="Inheritor"
                body="People you want each item to reach next."
                example="Daughter Sarah · Alternate recipient"
                icon={<ScrollRoleIcon />}
              />
            </li>
            <li>
              <RoleCard
                kicker="The Present"
                title="Conservator"
                body="People who help you keep the archive accurate today."
                example="Spouse · Family historian · Archivist"
                icon={<ShieldRoleIcon />}
              />
            </li>
          </ul>

          <p className="text-xs italic text-muted text-center max-w-md mx-auto">
            A single person can hold more than one of these roles —
            an inheritor today could be a legacy person tomorrow.
          </p>
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
              <DismissCTA
                dest="/collections"
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors disabled:opacity-60"
              >
                Create Collection
              </DismissCTA>
              <DismissCTA
                dest="/scan"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 h-11 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors disabled:opacity-60"
              >
                <ScanIcon />
                Scan Item
              </DismissCTA>
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
//  Contributor role card                                          //
// ============================================================== //

function RoleCard({
  kicker,
  title,
  body,
  example,
  icon,
}: {
  kicker: string;
  title: string;
  body: string;
  example: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="h-full bg-paper border border-hairline rounded-2xl p-5 shadow-card flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          className="shrink-0 w-11 h-11 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/25"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
            boxShadow:
              'inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 5px rgba(180,140,55,0.15)',
          }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted">
            {kicker}
          </div>
          <h3 className="font-serif text-lg text-ink leading-tight">
            {title}
          </h3>
        </div>
      </div>
      <p className="text-sm text-ink-soft leading-relaxed">{body}</p>
      <p className="text-[11px] italic text-muted leading-snug mt-auto">
        {example}
      </p>
    </article>
  );
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

// Contributor role glyphs
function PeopleRoleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15 14h2c2.2 0 4 1.8 4 4" />
    </svg>
  );
}

function ScrollRoleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 2h11a3 3 0 0 1 3 3v3h-3M7 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-3H7M7 2v18" />
      <path d="M10 7h6M10 11h6" />
    </svg>
  );
}

function ShieldRoleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
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
