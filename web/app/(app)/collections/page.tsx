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
import { findCategory } from '@/lib/categories';
import {
  findSubCategory,
  type SubCategory,
} from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

interface CollectionRow {
  coreKey: string;
  label: string;
  description: string | null;
  heroImage: string | null;
  iconUrl: string | null;
  glyph: string;
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
  sampleItems: CollectionSampleItem[];
}

export default async function CollectionsPage() {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const [profileRes, stats, buckets] = await Promise.all([
    user
      ? supabase
          .from('profiles')
          .select('selected_collections')
          .eq('id', user.id)
          .maybeSingle()
          .then((res) => res, () => ({ data: null }))
      : Promise.resolve({ data: null }),
    dashboardStats(),
    listCollectionsWithSamples(4),
  ]);

  const selectedSubCatKeys: string[] =
    (profileRes?.data?.selected_collections as string[] | null | undefined) ??
    [];
  const subCatByParent = pickSubCatPerParent(selectedSubCatKeys);

  // Build the canonical row list. Start with collections that have items,
  // then add any onboarding picks the user hasn't cataloged into yet.
  const rowByKey = new Map<string, CollectionRow>();
  for (const b of buckets) {
    const sub = subCatByParent.get(b.key) ?? null;
    rowByKey.set(b.key, makeRow(b.key, b, sub));
  }
  for (const [parent, sub] of subCatByParent) {
    if (rowByKey.has(parent)) continue;
    rowByKey.set(parent, makeRow(parent, null, sub));
  }
  const rows = [...rowByKey.values()].sort(
    (a, b) => b.itemCount - a.itemCount,
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-24">
      <Sidebar rows={rows} totalItemCount={stats.itemCount} />

      <main className="flex-1 min-w-0 space-y-6">
        <MainHeader
          itemCount={stats.itemCount}
          collectionCount={rows.length}
        />

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.coreKey}>
                <CollectionRowCard row={row} />
              </li>
            ))}
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
  rows,
  totalItemCount,
}: {
  rows: CollectionRow[];
  totalItemCount: number;
}) {
  return (
    <aside className="lg:w-64 lg:shrink-0 space-y-3">
      <div className="hidden lg:block">
        <h1 className="font-serif text-3xl text-ink leading-tight">
          Collections
        </h1>
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted">
          My Collections
        </h2>
      </div>

      <div className="-mx-4 px-4 lg:m-0 lg:p-0">
        <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible">
          <li className="shrink-0 lg:shrink">
            <SidebarItem
              href="/collections"
              label="All Items"
              count={totalItemCount}
              active
              icon={
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold text-cream text-[10px] font-semibold">
                  ALL
                </span>
              }
            />
          </li>
          {rows.map((row) => (
            <li key={row.coreKey} className="shrink-0 lg:shrink">
              <SidebarItem
                href={`/collections/${encodeURIComponent(row.coreKey)}`}
                label={row.label}
                count={row.itemCount}
                icon={
                  row.iconUrl ? (
                    <div className="relative w-6 h-6">
                      <Image
                        src={row.iconUrl}
                        alt=""
                        fill
                        sizes="24px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-base">{row.glyph}</span>
                  )
                }
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2">
        <Link
          href="/items/new"
          className="hidden lg:flex items-center justify-center gap-2 w-full px-4 h-10 rounded-lg border border-dashed border-gold text-gold-deep text-sm font-medium hover:bg-gold-soft transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Collection
        </Link>
      </div>
    </aside>
  );
}

function SidebarItem({
  href,
  label,
  count,
  active,
  icon,
}: {
  href: string;
  label: string;
  count: number;
  active?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg whitespace-nowrap lg:whitespace-normal min-w-fit lg:min-w-0 transition-colors ${
        active
          ? 'bg-gold-soft border border-gold/40 text-ink'
          : 'bg-paper border border-hairline text-ink-soft hover:border-ink/20 hover:text-ink'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 min-w-0 font-medium text-sm truncate">
        {label}
      </span>
      <span className="text-xs text-muted">{count.toLocaleString()}</span>
      <ChevronRightIcon className="w-3.5 h-3.5 text-muted shrink-0" />
    </Link>
  );
}

// =============================================================== //
//  Main column                                                     //
// =============================================================== //

function MainHeader({
  itemCount,
  collectionCount,
}: {
  itemCount: number;
  collectionCount: number;
}) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="lg:hidden font-serif text-3xl text-ink leading-tight">
            Collections
          </h1>
          <h2 className="hidden lg:block font-serif text-3xl text-ink leading-tight">
            Collections
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

// Visual-only for now — both icons present so the design reads right;
// list mode renders the same layout (we already use stacked rows).
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

function CollectionRowCard({ row }: { row: CollectionRow }) {
  return (
    <article className="bg-paper border border-hairline rounded-2xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Hero image */}
        <Link
          href={`/collections/${encodeURIComponent(row.coreKey)}`}
          className="relative lg:w-56 shrink-0 aspect-[5/3] lg:aspect-auto lg:h-auto bg-cream-soft overflow-hidden group"
        >
          {row.heroImage ? (
            <Image
              src={row.heroImage}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 224px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : row.iconUrl ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <Image
                src={row.iconUrl}
                alt=""
                width={180}
                height={180}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl text-muted/50">
              {row.glyph}
            </div>
          )}
        </Link>

        {/* Meta column */}
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
          <Link
            href={`/collections/${encodeURIComponent(row.coreKey)}`}
            className="self-start inline-flex items-center px-4 h-9 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors"
          >
            View Collection
          </Link>
        </div>

        {/* Sample items */}
        <div className="flex-1 min-w-0 p-5">
          <SampleItems
            samples={row.sampleItems}
            coreKey={row.coreKey}
            glyph={row.glyph}
          />
        </div>
      </div>
    </article>
  );
}

function SampleItems({
  samples,
  coreKey,
  glyph,
}: {
  samples: CollectionSampleItem[];
  coreKey: string;
  glyph: string;
}) {
  if (samples.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted italic">
        Nothing here yet.
      </div>
    );
  }
  return (
    <div className="flex items-stretch gap-3">
      <ul className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {samples.map((s) => (
          <li key={s.id}>
            <Link
              href={`/items/${s.id}`}
              className="group block"
            >
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
                    {glyph}
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

function EmptyState() {
  return (
    <div className="bg-paper border border-hairline rounded-2xl p-10 text-center">
      <h2 className="font-serif text-2xl text-ink">No collections yet</h2>
      <p className="text-muted text-sm mt-2 mb-4">
        Add your first piece to start a collection — Heirloom will group it
        automatically by category.
      </p>
      <Link
        href="/items/new"
        className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add your first piece
      </Link>
    </div>
  );
}

// =============================================================== //
//  Helpers                                                         //
// =============================================================== //

function makeRow(
  coreKey: string,
  bucket: CollectionBucket | null,
  sub: SubCategory | null,
): CollectionRow {
  const preset = findCategory(coreKey);
  return {
    coreKey,
    label: preset?.label ?? bucket?.label ?? coreKey,
    description: sub?.description ?? null,
    heroImage: sub?.bgImage ?? null,
    iconUrl: preset?.iconUrl ?? null,
    glyph: preset?.glyph ?? '◇',
    itemCount: bucket?.itemCount ?? 0,
    totalValue: bucket?.totalValue ?? 0,
    totalCurrency: bucket?.totalCurrency ?? 'USD',
    sampleItems: bucket?.sampleItems ?? [],
  };
}

// Pick the first onboarding-selected sub-category that maps to each Core
// 12 parent. We use that sub-cat's bgImage + description to dress up the
// row so it matches what the user saw during onboarding.
function pickSubCatPerParent(
  selectedKeys: string[],
): Map<string, SubCategory> {
  const out = new Map<string, SubCategory>();
  for (const key of selectedKeys) {
    const sub = findSubCategory(key);
    if (!sub) continue;
    if (out.has(sub.parent)) continue;
    out.set(sub.parent, sub);
  }
  return out;
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
