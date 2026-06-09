import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata = { title: 'Quick tour — Heirloom' };
export const dynamic = 'force-dynamic';

// Three-step "how Heirloom works" tour shown right after Begin Your
// Archive on the welcome screen. Pure server component — no client
// state — so first paint stays fast on mobile.
export default async function TutorialPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">
        <header className="text-center space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-gold-deep">
            Quick tour
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            How Heirloom is organized
          </h1>
          <p className="text-sm text-muted max-w-xl mx-auto pt-2">
            Three things to know before you add your first item. Takes about
            a minute.
          </p>
        </header>

        <ol className="mt-10 space-y-6">
          <TourStep
            number={1}
            title="Curated Galleries"
            body="Five hand-picked groupings of common collection categories — Family Legacy, The Collector, Luxury & Fine Art, Historical Archive, and Mixed Household. Each gallery contains a checklist of sub-categories you can add as collections."
            example="Example: Family Legacy includes Heirlooms, Photos, Letters, Recipes, Keepsakes."
            illustration={<GalleriesIllustration />}
          />
          <TourStep
            number={2}
            title="Your Collections"
            body="Sub-categories you've actually added. Live under each Curated Gallery you picked them from, and also show up together as Your Collections — your personal cross-archive view."
            example="Add or remove sub-categories any time from the Collections page."
            illustration={<MyCollectionsIllustration />}
          />
          <TourStep
            number={3}
            title="Adding an Item"
            body="Tap the + button in the footer and choose Item. Pick which collection it belongs to, then fill in the details — name, photos, who it's connected to, who inherits it. Scan Item is faster if it's a barcoded or labeled object."
            example="Each item can link back to Legacy People, Inheritors, and Conservators."
            illustration={<AddItemIllustration />}
          />
        </ol>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors shadow-card"
          >
            Continue to your archive
            <ArrowIcon />
          </Link>
          <Link
            href="/home"
            className="text-xs text-muted hover:text-ink underline"
          >
            Skip tour
          </Link>
        </div>
      </main>
    </div>
  );
}

function TourStep({
  number,
  title,
  body,
  example,
  illustration,
}: {
  number: number;
  title: string;
  body: string;
  example: string;
  illustration: React.ReactNode;
}) {
  return (
    <li className="bg-paper border border-hairline rounded-2xl p-5 sm:p-6 shadow-card flex flex-col sm:flex-row gap-5">
      <div className="shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-4 sm:w-32">
        <span
          className="shrink-0 w-10 h-10 rounded-full text-gold-deep flex items-center justify-center font-serif text-base border border-gold-deep/25"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
            boxShadow:
              'inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 5px rgba(180,140,55,0.15)',
          }}
          aria-hidden
        >
          {number}
        </span>
        <div className="hidden sm:block w-full">{illustration}</div>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <h2 className="font-serif text-xl text-ink leading-tight">{title}</h2>
        <p className="text-sm text-ink-soft leading-relaxed">{body}</p>
        <p className="text-xs italic text-muted leading-snug pt-1">
          {example}
        </p>
        <div className="sm:hidden pt-3">{illustration}</div>
      </div>
    </li>
  );
}

// --- Inline illustrations (no raster assets) -------------------- //

function GalleriesIllustration() {
  return (
    <div className="space-y-1.5" aria-hidden>
      {['family-legacy', 'collector', 'luxury'].map((k) => (
        <div
          key={k}
          className="h-5 rounded-md bg-cream-soft border border-hairline flex items-center px-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-gold-deep mr-2" />
          <div className="flex-1 h-1.5 rounded-full bg-ink-soft/30" />
        </div>
      ))}
      <div className="h-5 rounded-md bg-cream-soft border border-hairline flex items-center px-2 opacity-60">
        <div className="w-1.5 h-1.5 rounded-full bg-gold-deep mr-2" />
        <div className="flex-1 h-1.5 rounded-full bg-ink-soft/20" />
      </div>
    </div>
  );
}

function MyCollectionsIllustration() {
  return (
    <div className="grid grid-cols-3 gap-1.5" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-md bg-cream-soft border border-hairline"
        />
      ))}
    </div>
  );
}

function AddItemIllustration() {
  return (
    <div className="relative h-20 bg-cream-soft border border-hairline rounded-md flex items-center justify-center" aria-hidden>
      <div className="absolute inset-x-3 top-3 flex gap-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-ink-soft/30" />
        <div className="flex-1 h-1.5 rounded-full bg-ink-soft/30" />
      </div>
      <span className="w-10 h-10 rounded-full bg-forest text-cream flex items-center justify-center font-serif text-lg leading-none">
        +
      </span>
    </div>
  );
}

function ArrowIcon() {
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
      aria-hidden="true"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
