import Link from 'next/link';
import Image from 'next/image';
import { dashboardStats, listMyCollectionsRich } from '@/lib/api';
import { CATEGORY_PRESETS, findCategory, type CategoryPreset } from '@/lib/categories';
import { formatMoney } from '@/lib/format';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type UsedCard = {
  key: string;
  label: string;
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
  preset: CategoryPreset | null;
};

type EmptyCard = {
  key: string;
  label: string;
  preset: CategoryPreset;
};

export default async function CollectionsPage() {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const [inUse, stats, profileRes] = await Promise.all([
    listMyCollectionsRich(),
    dashboardStats(),
    user
      ? supabase
          .from('profiles')
          .select('selected_collections')
          .eq('id', user.id)
          .maybeSingle()
          .then((res) => res, () => ({ data: null }))
      : Promise.resolve({ data: null }),
  ]);

  const selectedFromOnboarding = new Set<string>(
    (profileRes?.data?.selected_collections as string[] | null | undefined) ?? [],
  );

  const usedKeys = new Set(inUse.map((c) => c.key));

  const usedCards: UsedCard[] = inUse.map((c) => ({
    key: c.key,
    label: c.label,
    itemCount: c.itemCount,
    totalValue: c.totalValue,
    totalCurrency: c.totalCurrency,
    preset: findCategory(c.key),
  }));

  // Promote onboarding picks (that have no items yet) into the featured list
  // so the user sees the archive they curated, not just the things they've
  // already cataloged.
  const onboardingFeatured: UsedCard[] = CATEGORY_PRESETS
    .filter(
      (p) =>
        selectedFromOnboarding.has(p.key) &&
        !usedKeys.has(p.key) &&
        p.iconUrl,
    )
    .map((p) => ({
      key: p.key,
      label: p.label,
      itemCount: 0,
      totalValue: 0,
      totalCurrency: 'USD',
      preset: p,
    }));

  const featuredCards: UsedCard[] = [...usedCards, ...onboardingFeatured];
  const featuredKeys = new Set(featuredCards.map((c) => c.key));

  const emptyCards: EmptyCard[] = CATEGORY_PRESETS
    .filter((p) => !featuredKeys.has(p.key) && p.iconUrl && !p.custom)
    .map((p) => ({ key: p.key, label: p.label, preset: p }));

  return (
    <>
      <div className="space-y-10 pb-24">
        <Hero
          itemCount={stats.itemCount}
          totalValue={stats.totalValue}
          totalCurrency={stats.totalCurrency}
        />

        {featuredCards.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-ink">Your Collections</h2>
            <ul className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {featuredCards.map((c) => (
                <li key={c.key}>
                  <FeaturedCard data={c} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl text-ink">
              {featuredCards.length === 0 ? 'Start your estate' : 'Browse more collections'}
            </h2>
            <p className="text-muted text-sm mt-1">
              {featuredCards.length === 0
                ? 'Choose a category below to begin cataloging.'
                : 'Other categories you can add to your archive.'}
            </p>
          </div>
          <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {emptyCards.map((c) => (
              <li key={c.key}>
                <BrowseCard data={c} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Link
        href="/items/new"
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 pl-4 pr-5 h-14 rounded-full bg-forest text-cream shadow-xl hover:bg-forest-deep transition-colors font-medium"
        aria-label="Add a new piece"
      >
        <PlusIcon className="w-5 h-5" />
        <span className="text-sm">Add piece</span>
      </Link>
    </>
  );
}

function Hero({
  itemCount,
  totalValue,
  totalCurrency,
}: {
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink leading-tight">
          Your Collection Estate
        </h1>
        <p className="text-muted text-base mt-2">
          Preserve what matters. Pass it on.
        </p>
      </div>
      <div className="flex items-stretch gap-6">
        <div>
          <div className="font-serif text-3xl text-ink">{itemCount}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted mt-0.5">
            {itemCount === 1 ? 'Piece preserved' : 'Pieces preserved'}
          </div>
        </div>
        <div className="w-px bg-hairline" />
        <div>
          <div className="font-serif text-3xl text-ink">
            {formatMoney(totalValue, totalCurrency)}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted mt-0.5">
            Estimated value
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ data }: { data: UsedCard }) {
  const { key, label, itemCount, totalValue, totalCurrency, preset } = data;
  return (
    <Link
      href={`/collections/${encodeURIComponent(key)}`}
      className="group relative flex h-44 sm:h-52 overflow-hidden bg-paper border border-hairline rounded-2xl hover:shadow-card transition-shadow"
    >
      <div className="flex-1 min-w-0 p-6 flex flex-col justify-between z-10">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted">
            Collection
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-ink mt-1 leading-tight">
            {label}
          </h3>
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2 text-sm text-ink">
            <span className="font-semibold">{itemCount}</span>
            <span className="text-ink-soft">
              {itemCount === 1 ? 'piece' : 'pieces'}
            </span>
            {totalValue > 0 && (
              <>
                <span className="text-muted">·</span>
                <span className="font-semibold">
                  {formatMoney(totalValue, totalCurrency)}
                </span>
              </>
            )}
          </div>
          <div className="text-xs italic text-muted">Shared with: Just you</div>
        </div>
      </div>
      <div className="relative w-40 sm:w-56 shrink-0 flex items-center justify-center">
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, #FFFFFF 0%, rgba(255,255,255,0) 35%)',
          }}
        />
        {preset?.iconUrl ? (
          <Image
            src={preset.iconUrl}
            alt={label}
            width={300}
            height={300}
            className="object-contain w-full h-full p-3 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="text-7xl">{preset?.glyph ?? '◇'}</div>
        )}
      </div>
    </Link>
  );
}

function BrowseCard({ data }: { data: EmptyCard }) {
  const { key, label, preset } = data;
  return (
    <Link
      href={`/collections/${encodeURIComponent(key)}`}
      className="flex flex-col items-center bg-paper border border-hairline rounded-xl p-2 hover:shadow-sm transition-shadow"
    >
      {preset.iconUrl ? (
        <Image
          src={preset.iconUrl}
          alt={label}
          width={140}
          height={140}
          className="w-full aspect-square object-contain"
        />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center text-4xl">
          {preset.glyph}
        </div>
      )}
      <div className="text-[11px] text-center text-ink-soft mt-1 leading-tight">
        {label}
      </div>
    </Link>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
