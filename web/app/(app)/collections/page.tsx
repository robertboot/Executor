import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  dashboardStats,
  listCollectionsWithSamples,
  listMyCustomCollections,
  type CollectionBucket,
  type CollectionSampleItem,
  type CustomCollectionWithStats,
} from '@/lib/api';
import { formatMoney } from '@/lib/format';
import {
  ARCHETYPES,
  ARCHETYPE_SUBCATEGORIES,
  archetypeForSubCategory,
  findArchetype,
  type ArchetypeDef,
  type SubCategory,
} from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';
import { removeSubCategory } from './add/actions';

export const dynamic = 'force-dynamic';

// Outlined SVG glyph per archetype, drawn to match the medallion
// style used on the welcome page and Conservator Roles cards.
function archetypeGlyph(key: OnboardingArchetype): React.ReactNode {
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
      return <ArchiveBoxIcon />;
  }
}

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
  searchParams: Promise<{ archetype?: string; view?: string }>;
}

type ViewMode = 'grid' | 'list';

export default async function CollectionsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const [profileRes, stats, buckets, customCollections, params] = await Promise.all([
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
    listMyCustomCollections(),
    searchParams,
  ]);

  const profileArchetypeKey =
    (profileRes?.data?.archetype as OnboardingArchetype | null) ?? null;
  const selectedSubCatKeys = new Set<string>(
    (profileRes?.data?.selected_collections as string[] | null | undefined) ??
      [],
  );

  // Active filter:
  //   undefined or 'all' -> Your Gallery (aggregate across archetypes)
  //   one of the 5 archetype keys -> filter to that curated collection
  const requested = params.archetype;
  const requestedDef =
    requested && requested !== 'all'
      ? findArchetype(requested as OnboardingArchetype)
      : null;
  // No archetype param OR archetype=all -> show Your Gallery.
  const isYourGallery = !requested || requested === 'all';
  const activeArchetype: ArchetypeDef | null = isYourGallery
    ? null
    : requestedDef ?? null;

  // View mode: default to compact list. Only 'grid' or 'list' are valid.
  const view: ViewMode = params.view === 'grid' ? 'grid' : 'list';

  // Bucket map keyed by Core 12 key.
  const bucketByCore = new Map<string, CollectionBucket>();
  for (const b of buckets) bucketByCore.set(b.key, b);

  // Sub-cats to display:
  //   Your Gallery -> every selected sub-cat across all archetypes
  //   Archetype filter -> just that archetype's selected sub-cats
  const allArchetypeSubCats: SubCategory[] = isYourGallery
    ? ARCHETYPES.flatMap((a) => ARCHETYPE_SUBCATEGORIES[a.key] ?? [])
    : ARCHETYPE_SUBCATEGORIES[activeArchetype?.key ?? ARCHETYPES[0].key] ?? [];
  const seenSubCatKeys = new Set<string>();
  const subCats = allArchetypeSubCats.filter((s) => {
    if (!selectedSubCatKeys.has(s.key)) return false;
    if (seenSubCatKeys.has(s.key)) return false;
    seenSubCatKeys.add(s.key);
    return true;
  });
  const rows: CollectionRow[] = subCats.map((s) =>
    makeRow(s, bucketByCore.get(s.parent) ?? null, true),
  );
  // 'Add Collection' affordance only makes sense when filtered to a
  // specific archetype (so we know which add flow to open). In Your
  // Gallery mode the user picks an archetype from the sidebar first.
  const hasUnselected = isYourGallery
    ? false
    : (ARCHETYPE_SUBCATEGORIES[activeArchetype?.key ?? ARCHETYPES[0].key]
        ?.length ?? 0) > subCats.length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-24">
      <Sidebar
        archetypes={ARCHETYPES}
        activeKey={isYourGallery ? 'all' : activeArchetype?.key ?? null}
      />

      <main className="flex-1 min-w-0 space-y-6">
        <MainHeader
          archetype={activeArchetype}
          isYourGallery={isYourGallery}
          itemCount={stats.itemCount}
          collectionCount={rows.length}
          isUserArchetype={
            !!activeArchetype &&
            profileArchetypeKey === activeArchetype.key
          }
          view={view}
        />

        {rows.length === 0 && !hasUnselected && customCollections.length === 0 ? (
          <EmptyState />
        ) : view === 'grid' ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {rows.map((row) => (
              <li key={row.subKey}>
                <CollectionGridCard row={row} />
              </li>
            ))}
            {customCollections.map((c) => {
              const bucket = bucketByCore.get(c.id) ?? null;
              return (
                <li key={c.id}>
                  <CustomCollectionGridCard
                    collection={c}
                    itemCount={bucket?.itemCount ?? 0}
                    totalValue={bucket?.totalValue ?? 0}
                    totalCurrency={bucket?.totalCurrency ?? 'USD'}
                  />
                </li>
              );
            })}
            {hasUnselected && activeArchetype && (
              <li>
                <AddCollectionGridCard archetypeKey={activeArchetype.key} />
              </li>
            )}
          </ul>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => {
              // Each row's archetype key — needed for the per-row
              // 'Remove collection' form. In Your Gallery mode rows
              // come from multiple archetypes, so look it up from
              // the sub-cat itself rather than the page-level filter.
              const rowArch =
                activeArchetype?.key ??
                archetypeForSubCategory(row.subKey)?.key ??
                ARCHETYPES[0].key;
              return (
                <li key={row.subKey}>
                  <CollectionRowCard row={row} archetypeKey={rowArch} />
                </li>
              );
            })}
            {customCollections.map((c) => {
              const bucket = bucketByCore.get(c.id) ?? null;
              return (
                <li key={c.id}>
                  <CustomCollectionRowCard
                    collection={c}
                    itemCount={bucket?.itemCount ?? 0}
                    totalValue={bucket?.totalValue ?? 0}
                    totalCurrency={bucket?.totalCurrency ?? 'USD'}
                    samples={bucket?.sampleItems ?? []}
                  />
                </li>
              );
            })}
            {hasUnselected && activeArchetype && (
              <li>
                <AddCollectionCard archetypeKey={activeArchetype.key} />
              </li>
            )}
          </ul>
        )}
      </main>
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
  activeKey: 'all' | OnboardingArchetype | null;
}) {
  return (
    <aside className="lg:w-72 lg:shrink-0 space-y-3">
      <div>
        <h1 className="font-serif text-3xl text-ink leading-tight">
          Curated Collections
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1.5 leading-relaxed">
          A simple way we&rsquo;ve grouped main categories to make
          getting started easier. <span className="text-ink">Your Collections</span>{' '}
          below lists every category you&rsquo;ve actually chosen —
          regardless of which curated collection it came from.
        </p>
      </div>

      <div className="-mx-4 px-4 lg:m-0 lg:p-0">
        <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-2 lg:overflow-visible">
          {/* Your Gallery sits at the top as the user's primary
              cross-archetype view. */}
          <li className="shrink-0 lg:shrink">
            <SidebarItem
              href="/collections?archetype=all"
              label="Your Collections"
              icon={<SparkIcon />}
              active={activeKey === 'all'}
              emphasized
            />
          </li>
          {archetypes.map((a) => (
            <li key={a.key} className="shrink-0 lg:shrink">
              <SidebarItem
                href={`/collections?archetype=${a.key}`}
                label={a.title}
                icon={archetypeGlyph(a.key)}
                active={a.key === activeKey}
              />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function SidebarItem({
  href,
  label,
  icon,
  active,
  emphasized,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  emphasized?: boolean;
}) {
  const ringClass = emphasized
    ? active
      ? 'bg-forest text-cream border border-forest shadow-card'
      : 'bg-cream-soft border border-forest/30 text-ink hover:border-forest/60'
    : active
      ? 'bg-gold-soft border border-gold/40 text-ink shadow-card'
      : 'bg-paper border border-hairline text-ink-soft hover:border-ink/20 hover:text-ink';
  const medallionClass = emphasized
    ? active
      ? 'bg-cream text-forest border border-cream/50'
      : 'bg-paper text-forest border border-forest/25'
    : active
      ? 'bg-gold text-cream border border-gold-deep/30'
      : 'bg-cream-soft text-gold-deep border border-gold-deep/15';
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl whitespace-nowrap lg:whitespace-normal min-w-0 lg:min-w-0 transition-colors ${ringClass}`}
    >
      <span
        className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full ${medallionClass}`}
      >
        {icon}
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
  isYourGallery,
  itemCount,
  collectionCount,
  isUserArchetype,
  view,
}: {
  archetype: ArchetypeDef | null;
  isYourGallery: boolean;
  itemCount: number;
  collectionCount: number;
  isUserArchetype: boolean;
  view: ViewMode;
}) {
  const eyebrow = isYourGallery
    ? 'Across all curated collections'
    : isUserArchetype
      ? 'Your Collections'
      : 'Exploring';
  const title = isYourGallery
    ? 'Your Collections'
    : archetype?.title ?? 'Collections';
  // ViewToggle param: pass 'all' in Your Gallery mode so the URL
  // stays consistent across grid/list switches.
  const toggleKey: 'all' | OnboardingArchetype = isYourGallery
    ? 'all'
    : archetype?.key ?? 'all';
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">
            {eyebrow}
          </div>
          <h2 className="font-serif text-3xl text-ink leading-tight mt-1">
            {title}
          </h2>
          <div className="text-sm text-muted mt-1">
            <strong className="text-ink">{itemCount.toLocaleString()}</strong>{' '}
            {itemCount === 1 ? 'Item' : 'Items'}
            <span className="mx-2">·</span>
            <strong className="text-ink">{collectionCount}</strong>{' '}
            {collectionCount === 1 ? 'Collection' : 'Collections'}
          </div>
        </div>
        <ViewToggle archetypeKey={toggleKey} view={view} />
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

function ViewToggle({
  archetypeKey,
  view,
}: {
  archetypeKey: 'all' | OnboardingArchetype;
  view: ViewMode;
}) {
  const hrefFor = (v: ViewMode) =>
    `/collections?archetype=${encodeURIComponent(archetypeKey)}&view=${v}`;
  const cls = (active: boolean) =>
    `px-3 h-9 flex items-center justify-center transition-colors ${
      active
        ? 'text-gold-deep bg-gold-soft'
        : 'text-muted hover:text-ink hover:bg-cream-soft'
    }`;
  return (
    <div className="inline-flex items-center bg-paper border border-hairline rounded-lg overflow-hidden">
      <Link
        href={hrefFor('grid')}
        prefetch={false}
        className={cls(view === 'grid')}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
      >
        <GridIcon className="w-4 h-4" />
      </Link>
      <Link
        href={hrefFor('list')}
        prefetch={false}
        className={cls(view === 'list')}
        aria-label="List view"
        aria-pressed={view === 'list'}
      >
        <ListIcon className="w-4 h-4" />
      </Link>
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
  const href = `/collections/${encodeURIComponent(row.coreKey)}?sub=${encodeURIComponent(row.subKey)}`;
  return (
    <article className="bg-paper border border-hairline rounded-2xl overflow-hidden">
      <div className="flex items-stretch">
        {/* Rectangle thumbnail — always horizontal, fixed width per breakpoint */}
        <Link
          href={href}
          className="relative shrink-0 w-28 sm:w-36 lg:w-44 bg-cream-soft overflow-hidden group"
        >
          <Image
            src={row.heroImage}
            alt=""
            fill
            sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 176px"
            className="object-cover object-right transition-transform duration-500 group-hover:scale-105"
            style={{
              transform: row.heroZoom !== 1 ? `scale(${row.heroZoom})` : undefined,
              transformOrigin: '100% 50%',
            }}
          />
        </Link>

        {/* Meta — title + count + description + actions */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-serif text-base sm:text-lg text-ink leading-tight truncate">
              {row.label}
            </h3>
            <div className="text-xs text-muted mt-0.5">
              {row.itemCount} {row.itemCount === 1 ? 'Item' : 'Items'}
              {row.totalValue > 0 && (
                <>
                  <span className="mx-1.5">·</span>
                  {formatMoney(row.totalValue, row.totalCurrency)}
                </>
              )}
            </div>
            {row.description && (
              <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-snug line-clamp-2">
                {row.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={href}
              className="inline-flex items-center px-3 h-8 rounded-lg border border-ink/20 text-ink text-xs sm:text-sm font-medium hover:border-ink/40 transition-colors"
            >
              View Collection
            </Link>
            {row.itemCount === 0 && (
              <form action={removeSubCategory}>
                <input type="hidden" name="subCatKey" value={row.subKey} />
                <input type="hidden" name="archetype" value={archetypeKey} />
                <button
                  type="submit"
                  className="text-[11px] text-muted hover:text-red-700 underline"
                >
                  Remove
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sample items rail — lg only, otherwise the row gets too dense */}
        <div className="hidden lg:flex shrink-0 border-l border-hairline p-4 w-72 xl:w-96">
          <SampleItems samples={row.sampleItems} coreKey={row.coreKey} />
        </div>
      </div>
    </article>
  );
}

// =============================================================== //
//  Grid view cards                                                 //
// =============================================================== //

function CollectionGridCard({ row }: { row: CollectionRow }) {
  const href = `/collections/${encodeURIComponent(row.coreKey)}?sub=${encodeURIComponent(row.subKey)}`;
  // The hero compositions put the focal subject (watch / baseball /
  // comic) on the RIGHT and a soft cream gradient on the LEFT. Pin
  // the right side of the source to the right side of the tile
  // (transformOrigin 100% 50%, object-right) and scale up by 2.0x —
  // enough to clear the gradient on most heroes without softening
  // the image to a pixelated blur.
  const gridScale = (row.heroZoom || 1) * 1.5;
  return (
    <Link
      href={href}
      className="group block bg-paper border border-hairline rounded-2xl overflow-hidden hover:shadow-card transition-shadow h-full"
    >
      <div className="relative aspect-[4/3] bg-cream-soft overflow-hidden">
        <Image
          src={row.heroImage}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-right transition-transform duration-500 group-hover:scale-105"
          style={{
            transform: `scale(${gridScale})`,
            transformOrigin: '100% 50%',
          }}
        />
      </div>
      <div className="p-3">
        <h3 className="font-serif text-base text-ink leading-tight truncate">
          {row.label}
        </h3>
        <div className="text-xs text-muted mt-0.5">
          {row.itemCount} {row.itemCount === 1 ? 'Item' : 'Items'}
          {row.totalValue > 0 && (
            <>
              <span className="mx-1">·</span>
              {formatMoney(row.totalValue, row.totalCurrency)}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function CustomCollectionGridCard({
  collection,
  itemCount,
  totalValue,
  totalCurrency,
}: {
  collection: CustomCollectionWithStats;
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
}) {
  return (
    <Link
      href={`/collections/${collection.id}?custom=1`}
      className="group block bg-paper border border-hairline rounded-2xl overflow-hidden hover:shadow-card transition-shadow h-full"
    >
      <div className="relative aspect-[4/3] bg-gold-soft/40 overflow-hidden flex items-center justify-center">
        {collection.imageUrl ? (
          <Image
            src={collection.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-3xl text-gold-deep">📦</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-serif text-base text-ink leading-tight truncate">
          {collection.name}
        </h3>
        <div className="text-xs text-muted mt-0.5">
          {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
          {totalValue > 0 && (
            <>
              <span className="mx-1">·</span>
              {formatMoney(totalValue, totalCurrency)}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function AddCollectionGridCard({
  archetypeKey,
}: {
  archetypeKey: OnboardingArchetype;
}) {
  return (
    <Link
      href={`/collections/add/${archetypeKey}`}
      className="group block bg-paper border border-dashed border-hairline rounded-2xl overflow-hidden hover:border-forest/40 transition-colors h-full"
    >
      <div className="relative aspect-[4/3] bg-cream-soft flex items-center justify-center text-gold-deep">
        <PlusIcon className="w-8 h-8" />
      </div>
      <div className="p-3">
        <h3 className="font-serif text-base text-ink leading-tight">
          Add Collection
        </h3>
        <div className="text-xs text-muted mt-0.5">
          Pick more from {labelOf(archetypeKey)}
        </div>
      </div>
    </Link>
  );
}

function labelOf(key: OnboardingArchetype): string {
  return findArchetype(key)?.title ?? '';
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
        Nothing here yet — add an item to start filling this collection.
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

function CustomCollectionRowCard({
  collection,
  itemCount,
  totalValue,
  totalCurrency,
  samples,
}: {
  collection: CustomCollectionWithStats;
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
  samples: CollectionSampleItem[];
}) {
  const target = `/collections/${encodeURIComponent(collection.id)}?custom=1`;
  return (
    <article className="bg-paper border border-hairline rounded-2xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <Link
          href={target}
          className="relative w-full lg:w-56 shrink-0 aspect-square bg-cream-soft overflow-hidden group"
        >
          {collection.imageUrl ? (
            <Image
              src={collection.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 224px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl text-gold-deep bg-gold-soft/40">
              ✦
            </div>
          )}
        </Link>

        <div className="p-5 lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-hairline flex flex-col justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gold-deep">
              Custom
            </div>
            <h3 className="font-serif text-xl text-ink leading-tight mt-1">
              {collection.name}
            </h3>
            <div className="text-xs text-muted mt-1">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              {totalValue > 0 && (
                <>
                  <span className="mx-1.5">·</span>
                  {formatMoney(totalValue, totalCurrency)}
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={target}
              className="inline-flex items-center px-4 h-9 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors"
            >
              View Collection
            </Link>
            <Link
              href={`/collections/custom/${collection.id}/edit`}
              className="text-xs text-muted hover:text-ink underline"
            >
              Edit
            </Link>
          </div>
        </div>

        <div className="flex-1 min-w-0 p-5">
          <SampleItems samples={samples} coreKey={collection.id} />
        </div>
      </div>
    </article>
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

function FamilyTreeIcon() {
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
      width={16}
      height={16}
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
      width={16}
      height={16}
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
      width={16}
      height={16}
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

function ArchiveBoxIcon() {
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
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="4" y="8" width="16" height="12" rx="1" />
      <path d="M10 13h4" />
    </svg>
  );
}

function SparkIcon() {
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
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
