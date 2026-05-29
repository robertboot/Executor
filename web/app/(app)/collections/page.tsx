import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  dashboardStats,
  listCollectionsWithSamples,
  type CollectionBucket,
  type CollectionSampleItem,
} from '@/lib/api';
import { formatMoney } from '@/lib/format';
import {
  ARCHETYPES,
  ARCHETYPE_SUBCATEGORIES,
  findArchetype,
  type ArchetypeDef,
  type SubCategory,
} from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';
import { removeSubCategory } from './add/actions';

export const dynamic = 'force-dynamic';

const ARCHETYPE_GLYPH: Record<OnboardingArchetype, string> = {
  'family-legacy': '🏛️',
  'collector': '🎴',
  'luxury': '💎',
  'historical': '📜',
  'mixed': '🏡',
};

interface CollectionRow {
  subKey: string;
  coreKey: string;
  label: string;
  description: string | null;
  heroImage: string;
  heroZoom: number;
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
  sampleItems: CollectionSampleItem[];
  isSelectedInOnboarding: boolean;
}

interface PageProps {
  searchParams: Promise<{ archetype?: string }>;
}

export default async function CollectionsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const [profileRes, stats, buckets, params] = await Promise.all([
    user
      ? supabase
          .from('profiles')
          .select('archetype, selected_collections')
          .eq('id', user.id)
          .maybeSingle()
          .then((res) => res, () => ({ data: null }))
      : Promise.resolve({ data: null }),
    dashboardStats(),
    listCollectionsWithSamples(4),
    searchParams,
  ]);

  const profileArchetypeKey =
    (profileRes?.data?.archetype as OnboardingArchetype | null) ?? null;
  const selectedSubCatKeys = new Set<string>(
    (profileRes?.data?.selected_collections as string[] | null | undefined) ??
      [],
  );

  // Active archetype: URL param > onboarding pick > Family Legacy fallback.
  const requested = params.archetype as OnboardingArchetype | undefined;
  const requestedDef = requested ? findArchetype(requested) : null;
  const defaultDef = profileArchetypeKey
    ? findArchetype(profileArchetypeKey)
    : null;
  const activeArchetype: ArchetypeDef =
    requestedDef ?? defaultDef ?? ARCHETYPES[0];

  // Bucket map keyed by Core 12 key.
  const bucketByCore = new Map<string, CollectionBucket>();
  for (const b of buckets) bucketByCore.set(b.key, b);

  // Only surface sub-categories the user actually picked during
  // onboarding — the rest of the archetype's offerings live behind
  // the "Add Collection" card at the end of the row.
  const subCats = (ARCHETYPE_SUBCATEGORIES[activeArchetype.key] ?? []).filter(
    (s) => selectedSubCatKeys.has(s.key),
  );
  const rows: CollectionRow[] = subCats.map((s) =>
    makeRow(s, bucketByCore.get(s.parent) ?? null, true),
  );
  const hasUnselected =
    (ARCHETYPE_SUBCATEGORIES[activeArchetype.key]?.length ?? 0) >
    subCats.length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-24">
      <Sidebar
        archetypes={ARCHETYPES}
        activeKey={activeArchetype.key}
      />

      <main className="flex-1 min-w-0 space-y-6">
        <MainHeader
          archetype={activeArchetype}
          itemCount={stats.itemCount}
          collectionCount={rows.length}
          isUserArchetype={profileArchetypeKey === activeArchetype.key}
        />

        {rows.length === 0 && !hasUnselected ? (
          <EmptyState />
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.subKey}>
                <CollectionRowCard
                  row={row}
                  archetypeKey={activeArchetype.key}
                />
              </li>
            ))}
            {hasUnselected && (
              <li>
                <AddCollectionCard archetypeKey={activeArchetype.key} />
              </li>
            )}
          </ul>
        )}
      </main>

      <Link
        href="/items/new"
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 pl-4 pr-5 h-14 rounded-full bg-forest text-cream shadow-xl hover:bg-forest-deep transition-colors font-medium"
        aria-label="Add a new piece"
      >
        <PlusIcon className="w-5 h-5" />
        <span className="text-sm">Add piece</span>
      </Link>
    </div>
  );
}

// =============================================================== //
//  Sidebar                                                         //
// =============================================================== //

function Sidebar({
  archetypes,
  activeKey,
}: {
  archetypes: ArchetypeDef[];
  activeKey: OnboardingArchetype;
}) {
  return (
    <aside className="lg:w-72 lg:shrink-0 space-y-3">
      <div className="hidden lg:block">
        <h1 className="font-serif text-3xl text-ink leading-tight">
          Categories
        </h1>
      </div>

      <div className="lg:hidden">
        <h1 className="font-serif text-3xl text-ink leading-tight">
          Categories
        </h1>
      </div>

      <h2 className="text-xs uppercase tracking-widest text-muted">
        My categories
      </h2>

      <div className="-mx-4 px-4 lg:m-0 lg:p-0">
        <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-2 lg:overflow-visible">
          {archetypes.map((a) => (
            <li key={a.key} className="shrink-0 lg:shrink">
              <SidebarItem
                href={`/collections?archetype=${a.key}`}
                label={a.title}
                glyph={ARCHETYPE_GLYPH[a.key]}
                active={a.key === activeKey}
              />
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/items/new"
        className="hidden lg:flex items-center justify-center gap-2 w-full px-4 h-12 rounded-xl border border-dashed border-gold text-gold-deep text-sm font-medium hover:bg-gold-soft transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add Collection
      </Link>
    </aside>
  );
}

function SidebarItem({
  href,
  label,
  glyph,
  active,
}: {
  href: string;
  label: string;
  glyph: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl whitespace-nowrap lg:whitespace-normal min-w-fit lg:min-w-0 transition-colors ${
        active
          ? 'bg-gold-soft border border-gold/40 text-ink shadow-card'
          : 'bg-paper border border-hairline text-ink-soft hover:border-ink/20 hover:text-ink'
      }`}
    >
      <span
        className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-base ${
          active ? 'bg-gold text-cream' : 'bg-cream-soft text-ink'
        }`}
      >
        {glyph}
      </span>
      <span className="flex-1 min-w-0 font-medium text-sm truncate">
        {label}
      </span>
      <ChevronRightIcon className="w-3.5 h-3.5 text-muted shrink-0" />
    </Link>
  );
}

// =============================================================== //
//  Main column                                                     //
// =============================================================== //

function MainHeader({
  archetype,
  itemCount,
  collectionCount,
  isUserArchetype,
}: {
  archetype: ArchetypeDef;
  itemCount: number;
  collectionCount: number;
  isUserArchetype: boolean;
}) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">
            {isUserArchetype ? 'Your archive' : 'Exploring'}
          </div>
          <h2 className="font-serif text-3xl text-ink leading-tight mt-1">
            {archetype.title}
          </h2>
          <div className="text-sm text-muted mt-1">
            <strong className="text-ink">{itemCount.toLocaleString()}</strong>{' '}
            {itemCount === 1 ? 'Item' : 'Items'}
            <span className="mx-2">·</span>
            <strong className="text-ink">{collectionCount}</strong>{' '}
            {collectionCount === 1 ? 'Collection' : 'Collections'}
          </div>
        </div>
        <ViewToggle />
      </div>
      <form action="/search" method="get" className="max-w-xl">
        <label className="relative block">
          <span className="sr-only">Search collections or items</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            type="search"
            name="q"
            placeholder="Search collections or items…"
            className="w-full bg-paper border border-hairline rounded-full pl-10 pr-4 h-11 text-sm placeholder:text-muted focus:outline-none focus:border-forest"
          />
        </label>
      </form>
    </header>
  );
}

function ViewToggle() {
  return (
    <div className="inline-flex items-center bg-paper border border-hairline rounded-lg overflow-hidden">
      <button
        type="button"
        className="px-3 h-9 text-gold-deep bg-gold-soft"
        aria-label="Grid view"
      >
        <GridIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="px-3 h-9 text-muted hover:text-ink"
        aria-label="List view"
      >
        <ListIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function CollectionRowCard({
  row,
  archetypeKey,
}: {
  row: CollectionRow;
  archetypeKey: OnboardingArchetype;
}) {
  return (
    <article className="bg-paper border border-hairline rounded-2xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <Link
          href={`/collections/${encodeURIComponent(row.coreKey)}`}
          className="relative w-full lg:w-56 shrink-0 aspect-square bg-cream-soft overflow-hidden group"
        >
          {/* Outer wrapper owns the hover zoom so it stacks on top
              of the per-row base zoom applied to the image itself. */}
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{ transformOrigin: '100% 50%' }}
          >
            <Image
              src={row.heroImage}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 224px"
              className="object-cover object-right"
              style={{
                transform: row.heroZoom !== 1 ? `scale(${row.heroZoom})` : undefined,
                transformOrigin: '100% 50%',
              }}
            />
          </div>
        </Link>

        <div className="p-5 lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-hairline flex flex-col justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl text-ink leading-tight">
              {row.label}
            </h3>
            <div className="text-xs text-muted mt-1">
              {row.itemCount} {row.itemCount === 1 ? 'Item' : 'Items'}
              {row.totalValue > 0 && (
                <>
                  <span className="mx-1.5">·</span>
                  {formatMoney(row.totalValue, row.totalCurrency)}
                </>
              )}
            </div>
            {row.description && (
              <p className="text-sm text-ink-soft mt-2 leading-snug">
                {row.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/collections/${encodeURIComponent(row.coreKey)}`}
              className="inline-flex items-center px-4 h-9 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors"
            >
              View Collection
            </Link>
            {row.itemCount === 0 && (
              <form action={removeSubCategory}>
                <input type="hidden" name="subCatKey" value={row.subKey} />
                <input type="hidden" name="archetype" value={archetypeKey} />
                <button
                  type="submit"
                  className="text-xs text-muted hover:text-red-700 underline"
                >
                  Remove collection
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 p-5">
          <SampleItems
            samples={row.sampleItems}
            coreKey={row.coreKey}
          />
        </div>
      </div>
    </article>
  );
}

function SampleItems({
  samples,
  coreKey,
}: {
  samples: CollectionSampleItem[];
  coreKey: string;
}) {
  if (samples.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted italic py-6">
        Nothing here yet — add a piece to start filling this collection.
      </div>
    );
  }
  return (
    <div className="flex items-stretch gap-3">
      <ul className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {samples.map((s) => (
          <li key={s.id}>
            <Link href={`/items/${s.id}`} className="group block">
              <div className="relative aspect-square bg-cream-soft border border-hairline rounded-lg overflow-hidden">
                {s.primaryPhotoUrl ? (
                  <Image
                    src={s.primaryPhotoUrl}
                    alt={s.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 140px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl text-muted/50">
                    ◇
                  </div>
                )}
              </div>
              <div className="text-xs text-ink-soft mt-1.5 truncate text-center">
                {s.name}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={`/collections/${encodeURIComponent(coreKey)}`}
        className="shrink-0 self-stretch flex flex-col items-center justify-center gap-1 px-3 text-gold-deep hover:text-gold transition-colors"
      >
        <span className="text-xs font-medium">View All</span>
        <ChevronRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
}

function AddCollectionCard({
  archetypeKey,
}: {
  archetypeKey: OnboardingArchetype;
}) {
  return (
    <Link
      href={`/collections/add/${archetypeKey}`}
      className="block bg-paper border-2 border-dashed border-gold rounded-2xl overflow-hidden hover:bg-gold-soft/40 transition-colors"
    >
      <div className="flex flex-col lg:flex-row items-stretch">
        <div className="relative w-full lg:w-56 shrink-0 aspect-square bg-gold-soft/40 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gold text-cream flex items-center justify-center">
            <PlusIcon className="w-8 h-8" />
          </div>
        </div>
        <div className="flex-1 p-5 flex flex-col justify-center gap-2">
          <h3 className="font-serif text-xl text-ink leading-tight">
            Add Collection
          </h3>
          <p className="text-sm text-ink-soft leading-snug max-w-md">
            Browse more sub-categories from this archetype and add them
            to your archive.
          </p>
          <span className="self-start inline-flex items-center gap-1 mt-2 text-sm font-medium text-gold-deep">
            Choose from the list →
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="bg-paper border border-hairline rounded-2xl p-10 text-center">
      <h2 className="font-serif text-2xl text-ink">
        Nothing here yet
      </h2>
      <p className="text-muted text-sm mt-2">
        You haven&rsquo;t added any sub-categories for this archetype. Try
        another category from the sidebar.
      </p>
    </div>
  );
}

// =============================================================== //
//  Helpers                                                         //
// =============================================================== //

function makeRow(
  sub: SubCategory,
  bucket: CollectionBucket | null,
  isSelectedInOnboarding: boolean,
): CollectionRow {
  return {
    subKey: sub.key,
    coreKey: sub.parent,
    label: sub.label,
    description: sub.description,
    heroImage: sub.bgImage,
    heroZoom: sub.thumbZoom ?? 1,
    itemCount: bucket?.itemCount ?? 0,
    totalValue: bucket?.totalValue ?? 0,
    totalCurrency: bucket?.totalCurrency ?? 'USD',
    sampleItems: bucket?.sampleItems ?? [],
    isSelectedInOnboarding,
  };
}

// =============================================================== //
//  Icons                                                           //
// =============================================================== //

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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="M14 14l4 4" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 4h10M3 8h10M3 12h10" />
    </svg>
  );
}
