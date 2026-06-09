import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  dashboardStats,
  listMyCollectionsRich,
  listRecentItemsWithPhotos,
  listItemsNeedingAttention,
  listTimelineItems,
  type RecentItemWithPhoto,
  type ItemNeedingAttention,
  type CatalogingGap,
  type TimelineEntry,
} from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import {
  findArchetype,
  findSubCategory,
  archetypeForSubCategory,
  type SubCategory,
  type ArchetypeDef,
} from '@/lib/onboarding';
import { findCategory, glyphForCategory } from '@/lib/categories';
import { redoOnboarding } from '@/app/(app)/settings/profile-actions';
import type {
  OnboardingArchetype,
  CollectionWithStats,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

interface ProfileSlim {
  archetype: OnboardingArchetype | null;
  selected_collections: string[] | null;
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Collector';

  const supabase = await createSupabaseServerClient();

  const [
    profileRes,
    stats,
    recent,
    collectionsStats,
    needsAttention,
    timeline,
  ] = await Promise.all([
    user
      ? supabase
          .from('profiles')
          .select('archetype, selected_collections')
          .eq('id', user.id)
          .maybeSingle()
          .then((res) => res, () => ({ data: null }))
      : Promise.resolve({ data: null }),
    dashboardStats(),
    listRecentItemsWithPhotos(6),
    listMyCollectionsRich(),
    listItemsNeedingAttention(4),
    listTimelineItems(6),
  ]);

  const profile = (profileRes?.data ?? null) as ProfileSlim | null;
  const archetype = findArchetype(profile?.archetype);

  const itemCountByCoreKey = new Map<string, number>();
  for (const c of collectionsStats) itemCountByCoreKey.set(c.key, c.itemCount);

  const featuredSubCats = pickFeaturedSubCategories(
    profile?.selected_collections ?? null,
    itemCountByCoreKey,
  );

  return (
    <div className="space-y-8 pb-24">
      <HeroCard
        displayName={displayName}
        archetype={archetype}
        itemCount={stats.itemCount}
        collectionCount={stats.collectionCount}
        peopleCount={stats.peopleCount}
        inheritorCount={stats.inheritorCount}
        conservatorCount={stats.conservatorCount}
      />

      {needsAttention.length > 0 && (
        <ContinueCataloging items={needsAttention} />
      )}

      <YourCollections
        subCats={featuredSubCats}
        itemCountByCoreKey={itemCountByCoreKey}
        fallbackStats={collectionsStats}
      />

      <div
        className={`grid grid-cols-1 ${
          timeline.length > 0 ? 'lg:grid-cols-2' : ''
        } gap-6`}
      >
        <RecentlyAdded items={recent} />
        {timeline.length > 0 && <Timeline entries={timeline} />}
      </div>
    </div>
  );
}

// ============================================================== //
//  Sections                                                       //
// ============================================================== //

function HeroCard({
  displayName,
  archetype,
  itemCount,
  collectionCount,
  peopleCount,
  inheritorCount,
  conservatorCount,
}: {
  displayName: string;
  archetype: ArchetypeDef | null;
  itemCount: number;
  collectionCount: number;
  peopleCount: number;
  inheritorCount: number;
  conservatorCount: number;
}) {
  // No archetype yet — show setup card.
  if (!archetype) {
    return (
      <section className="bg-paper border border-hairline rounded-2xl p-6">
        <h2 className="font-serif text-2xl text-ink">Start your archive</h2>
        <p className="text-muted text-sm mt-2 mb-4">
          Walk through setup to personalize your home view.
        </p>
        <form action={redoOnboarding}>
          <button
            type="submit"
            className="inline-flex items-center px-4 h-10 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep"
          >
            Begin setup
          </button>
        </form>
      </section>
    );
  }

  const heroImage = archetype.fullImage ?? archetype.bgImage;

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-card aspect-[4/5] sm:aspect-[16/10] lg:aspect-[2/1]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroImage}')` }}
        aria-hidden
      />
      {/* Left-side dark gradient so cream text reads on any image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 75%)',
        }}
        aria-hidden
      />
      <div className="relative z-10 h-full p-6 sm:p-8 max-w-md flex flex-col justify-center text-cream">
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight">
          The curated
          <br />
          collections of
        </h1>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mt-1">
          {displayName}
        </h2>

        <div className="flex items-center gap-2 mt-4 mb-4 w-40 text-gold">
          <div className="h-px bg-gold flex-1" />
          <div
            className="w-1.5 h-1.5 rotate-45 bg-gold"
            aria-hidden
          />
          <div className="h-px bg-gold flex-1" />
        </div>

        <ul className="space-y-1.5 text-sm mb-5">
          <li className="flex items-center gap-2.5">
            <ItemsIcon />
            <span>
              <strong>{itemCount.toLocaleString()}</strong>{' '}
              {itemCount === 1 ? 'Item' : 'Items'}
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <FolderIcon />
            <span>
              <strong>{collectionCount}</strong>{' '}
              {collectionCount === 1 ? 'Collection' : 'Collections'}
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <PeopleStatIcon />
            <span>
              <strong>{peopleCount}</strong>{' '}
              {peopleCount === 1 ? 'Legacy Person' : 'Legacy People'}
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <ScrollStatIcon />
            <span>
              <strong>{inheritorCount}</strong>{' '}
              {inheritorCount === 1 ? 'Inheritor' : 'Inheritors'}
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <ConservatorIcon />
            <span>
              <strong>{conservatorCount}</strong>{' '}
              {conservatorCount === 1 ? 'Conservator' : 'Conservators'}
            </span>
          </li>
        </ul>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/items/new"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Add Item
          </Link>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-cream text-ink text-sm font-medium hover:bg-paper transition-colors shadow-sm"
          >
            <CameraIcon className="w-4 h-4" />
            Scan Item
          </Link>
        </div>
      </div>
    </section>
  );
}

const GAP_LABEL: Record<CatalogingGap, string> = {
  'needs-photos': 'Needs photos',
  'needs-details': 'Needs details',
  'needs-provenance': 'Needs provenance',
  'needs-valuation': 'Needs valuation',
  'complete': 'Complete',
};

const GAP_DOT_COLOR: Record<CatalogingGap, string> = {
  'needs-photos': 'bg-gold',
  'needs-details': 'bg-gold',
  'needs-provenance': 'bg-gold',
  'needs-valuation': 'bg-gold',
  'complete': 'bg-forest',
};

function ContinueCataloging({ items }: { items: ItemNeedingAttention[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink">Continue cataloging</h2>
        <Link
          href="/collections"
          className="text-gold-deep text-sm font-medium inline-flex items-center gap-1 hover:text-forest"
        >
          View All <ChevronRightIcon className="w-3 h-3" />
        </Link>
      </div>
      <div className="-mx-4 sm:mx-0">
        <ul className="flex gap-3 overflow-x-auto px-4 sm:px-0 snap-x snap-mandatory pb-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="shrink-0 w-28 sm:w-32 snap-start"
            >
              <Link
                href={`/items/${item.id}`}
                className="group block"
              >
                <div className="relative aspect-square bg-cream-soft border border-hairline rounded-xl overflow-hidden">
                  {item.primaryPhotoUrl ? (
                    <Image
                      src={item.primaryPhotoUrl}
                      alt=""
                      fill
                      sizes="128px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl text-muted/50">
                      {glyphForCategory(item.category)}
                    </div>
                  )}
                </div>
                <div className="mt-1.5 px-0.5">
                  <div className="text-xs font-medium text-ink leading-tight truncate">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-ink-soft mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${GAP_DOT_COLOR[item.gap]}`}
                    />
                    <span className="truncate">{GAP_LABEL[item.gap]}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function YourCollections({
  subCats,
  itemCountByCoreKey,
  fallbackStats,
}: {
  subCats: SubCategory[];
  itemCountByCoreKey: Map<string, number>;
  fallbackStats: CollectionWithStats[];
}) {
  // If we have onboarding picks, render the rich sub-cat grid;
  // otherwise fall back to whatever the user has actually cataloged.
  if (subCats.length === 0) {
    if (fallbackStats.length === 0) {
      return (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-ink">Your collections</h2>
          <div className="bg-paper border border-hairline rounded-xl p-6 text-center">
            <p className="text-muted text-sm">
              No collections yet.{' '}
              <Link href="/collections" className="text-forest underline">
                Start one
              </Link>
              .
            </p>
          </div>
        </section>
      );
    }
    return (
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-2xl text-ink">Your collections</h2>
          <Link
            href="/collections"
            className="text-sm text-forest hover:underline"
          >
            View all →
          </Link>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {fallbackStats.slice(0, 4).map((c) => {
            const preset = findCategory(c.key);
            return (
              <li key={c.key}>
                <Link
                  href={`/collections/${encodeURIComponent(c.key)}`}
                  className="group block bg-paper border border-hairline rounded-2xl overflow-hidden hover:shadow-card transition-shadow h-full"
                >
                  <div className="relative aspect-[4/3] bg-cream-soft overflow-hidden flex items-center justify-center">
                    {preset?.iconUrl ? (
                      <Image
                        src={preset.iconUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-5xl text-gold-deep">
                        {preset?.glyph ?? '◇'}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-serif text-base text-ink leading-tight truncate">
                      {c.label}
                    </h3>
                    <div className="text-xs text-muted mt-0.5">
                      {c.itemCount} {c.itemCount === 1 ? 'Item' : 'Items'}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink">Your collections</h2>
        <Link
          href="/collections"
          className="text-sm text-forest hover:underline"
        >
          View All →
        </Link>
      </div>
      <div className="-mx-4 sm:mx-0">
        <ul className="flex gap-3 overflow-x-auto px-4 sm:px-0 snap-x snap-mandatory pb-2">
          {subCats.map((s) => (
            <li
              key={s.key}
              className="shrink-0 w-28 sm:w-32 snap-start"
            >
              <SubCatVisualCard
                subCat={s}
                itemCount={itemCountByCoreKey.get(s.parent) ?? 0}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SubCatVisualCard({
  subCat,
  itemCount,
}: {
  subCat: SubCategory;
  itemCount: number;
}) {
  // Mirror the Collections grid tile: right-anchored crop, 4:3
  // image up top, title + count beneath on a paper card. Use the
  // per-sub-cat thumbZoom (or homeZoom override) as-is so we don't
  // upscale the bitmap past native resolution and softfen the image.
  const gridScale = subCat.homeZoom ?? subCat.thumbZoom ?? 1;
  return (
    <Link
      href={`/collections/${encodeURIComponent(subCat.parent)}?sub=${encodeURIComponent(subCat.key)}`}
      className="group block bg-paper border border-hairline rounded-2xl overflow-hidden hover:shadow-card transition-shadow h-full"
    >
      <div className="relative aspect-[4/3] bg-cream-soft overflow-hidden">
        <Image
          src={subCat.bgImage}
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
      <div className="px-2 py-2">
        <h3 className="font-serif text-xs sm:text-sm text-ink leading-tight truncate">
          {subCat.label}
        </h3>
        <div className="text-[11px] text-muted mt-0.5">
          {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
        </div>
      </div>
    </Link>
  );
}

// Pick a glyph SVG for a sub-category. Falls back to the parent Core 12
// when the sub-cat key isn't specifically mapped.
function subCatIcon(subCat: SubCategory): React.ReactNode {
  // Sub-cat–specific overrides
  switch (subCat.key) {
    case 'family-keepsakes-items':
    case 'family-stories-memories':
      return <PeopleIcon />;
    case 'family-photographs':
    case 'historical-photography':
    case 'fine-photography':
    case 'art-wall-pieces':
      return <PhotoIcon />;
    case 'letters-documents':
    case 'period-correspondence':
    case 'historical-documents':
    case 'autographs-signatures':
      return <DocumentIcon />;
    case 'recipes-traditions':
      return <PotIcon />;
    case 'jewelry-personal-treasures':
    case 'jewelry-watches-fine':
    case 'jewelry-watches-mixed':
      return <DiamondIcon />;
    case 'military-service':
    case 'military-war-history':
      return <ShieldIcon />;
    case 'furniture-home-heirlooms':
    case 'furniture-antiques':
    case 'antiques-decor-fine':
    case 'estate-furnishings':
      return <LampIcon />;
    case 'holiday-special-keepsakes':
    case 'holiday-treasures':
      return <GiftIcon />;
    case 'genealogy-family-history':
    case 'genealogy-records':
      return <TreeIcon />;
    case 'sports-memorabilia-items':
      return <BallIcon />;
    case 'trading-cards':
      return <CardIcon />;
    case 'coins-currency':
      return <CoinIcon />;
    case 'comics-graphic-novels':
    case 'antique-books':
    case 'rare-books-manuscripts':
    case 'books-records':
      return <BookIcon />;
    case 'toys-action-figures':
      return <StarIcon />;
    case 'vinyl-music':
      return <DiscIcon />;
    case 'advertising-americana':
    case 'americana':
      return <SignIcon />;
    case 'hunting-fishing-gear':
    case 'outdoor-garden':
      return <CompassIcon />;
    case 'pop-culture':
    case 'hobby-collections':
    case 'collectibles-curiosities':
      return <StarIcon />;
    case 'fine-art':
    case 'sculpture-decorative-arts':
      return <FrameIcon />;
    case 'wine-spirits':
      return <GlassIcon />;
    case 'silver-crystal':
    case 'china-tableware':
      return <PlateIcon />;
    case 'luxury-accessories':
      return <BagIcon />;
    case 'maps-atlases':
    case 'political-memorabilia':
    case 'artifacts-relics':
      return <CompassIcon />;
    case 'travel-mementos':
      return <CompassIcon />;
  }
  // Parent fallback
  switch (subCat.parent) {
    case 'family-keepsakes':
      return <PeopleIcon />;
    case 'art-photography':
      return <PhotoIcon />;
    case 'books-documents':
      return <BookIcon />;
    case 'jewelry-watches':
      return <DiamondIcon />;
    case 'antiques-decor':
      return <LampIcon />;
    case 'music-instruments':
      return <DiscIcon />;
    case 'sports-memorabilia':
      return <BallIcon />;
    case 'military-historical':
      return <ShieldIcon />;
    case 'silver-china-tableware':
      return <PlateIcon />;
    case 'fashion-textiles':
      return <BagIcon />;
    case 'outdoor-sporting':
      return <CompassIcon />;
    default:
      return <StarIcon />;
  }
}

function RecentlyAdded({ items }: { items: RecentItemWithPhoto[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink">Recently added</h2>
        {items.length > 0 && (
          <Link
            href="/collections"
            className="text-sm text-forest hover:underline"
          >
            View all →
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-xl p-6 text-center">
          <p className="text-muted text-sm">
            Nothing here yet.{' '}
            <Link href="/items/new" className="text-forest underline">
              Add your first item
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="-mx-4 sm:mx-0">
          <ul className="flex gap-3 overflow-x-auto px-4 sm:px-0 sm:grid sm:grid-cols-3 snap-x snap-mandatory pb-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="shrink-0 w-44 sm:w-auto snap-start"
              >
                <RecentItemCard item={item} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RecentItemCard({ item }: { item: RecentItemWithPhoto }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="group block bg-paper border border-hairline rounded-xl overflow-hidden hover:shadow-card transition-shadow"
    >
      <div className="relative aspect-square bg-cream-soft overflow-hidden">
        {item.primaryPhotoUrl ? (
          <Image
            src={item.primaryPhotoUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 176px, 240px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl text-muted/50">
            {glyphForCategory(item.category)}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-medium text-ink text-sm truncate">{item.name}</div>
        <div className="text-xs text-muted mt-0.5">
          Added {formatRelativeTime(item.created_at)}
        </div>
      </div>
    </Link>
  );
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink">Timeline</h2>
        <Link
          href="/collections"
          className="text-sm text-forest hover:underline"
        >
          View full timeline →
        </Link>
      </div>
      <div className="-mx-4 sm:mx-0">
        <div className="overflow-x-auto px-4 sm:px-0 pb-2">
          <ol className="flex gap-6 min-w-max">
            {entries.map((e, i) => (
              <li key={e.id} className="flex flex-col items-center w-36">
                <Link href={`/items/${e.id}`} className="group block">
                  <div className="relative w-28 h-28 bg-cream-soft border border-hairline rounded-xl overflow-hidden shadow-card">
                    {e.primaryPhotoUrl ? (
                      <Image
                        src={e.primaryPhotoUrl}
                        alt={e.name}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted/50">
                        ◇
                      </div>
                    )}
                  </div>
                </Link>
                <div className="relative w-full flex items-center justify-center mt-3 h-3">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gold" />
                  {i === 0 && (
                    <div className="absolute right-1/2 top-1/2 -translate-y-1/2 w-1/2 h-px bg-cream" />
                  )}
                  {i === entries.length - 1 && (
                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-1/2 h-px bg-cream" />
                  )}
                  <span className="relative w-3 h-3 rounded-full bg-gold" />
                </div>
                <div className="font-serif text-lg text-ink mt-2">{e.year}</div>
                <div className="text-xs text-muted text-center leading-tight line-clamp-2 max-w-full">
                  {e.name}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ============================================================== //
//  Helpers                                                        //
// ============================================================== //

function pickFeaturedSubCategories(
  selectedKeys: string[] | null,
  itemCountByCoreKey: Map<string, number>,
): SubCategory[] {
  if (!selectedKeys || selectedKeys.length === 0) return [];
  const subCats: SubCategory[] = [];
  const seenLabels = new Set<string>();
  for (const key of selectedKeys) {
    const sub = findSubCategory(key);
    if (!sub) continue;
    if (seenLabels.has(sub.label)) continue;
    seenLabels.add(sub.label);
    subCats.push(sub);
  }
  subCats.sort((a, b) => {
    const ac = itemCountByCoreKey.get(a.parent) ?? 0;
    const bc = itemCountByCoreKey.get(b.parent) ?? 0;
    return bc - ac;
  });
  return subCats;
}

// ============================================================== //
//  Icons                                                          //
// ============================================================== //

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

function ItemsIcon() {
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
      className="text-gold-soft"
    >
      <path d="M6 7h12l-1 13H7z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function FolderIcon() {
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
      className="text-gold-soft"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function ConservatorIcon() {
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
      className="text-gold-soft"
    >
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  );
}

function PeopleStatIcon() {
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
      className="text-gold-soft"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15 14h2c2.2 0 4 1.8 4 4" />
    </svg>
  );
}

function ScrollStatIcon() {
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
      className="text-gold-soft"
    >
      <path d="M7 2h11a3 3 0 0 1 3 3v3h-3M7 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-3H7M7 2v18" />
      <path d="M10 7h6M10 11h6" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
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
      <path d="M4 6h2l1.5-2h5L14 6h2a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" />
      <circle cx="10" cy="11" r="3" />
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

// ----- Sub-category glyphs (24x24, line-drawn) ----------------- //

function GlyphSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function PeopleIcon() {
  return (
    <GlyphSvg>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15 14h2c2.2 0 4 1.8 4 4" />
    </GlyphSvg>
  );
}

function PhotoIcon() {
  return (
    <GlyphSvg>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.7l1.5-2h6.6l1.5 2h2.7A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-9z" />
      <circle cx="12" cy="13" r="4" />
    </GlyphSvg>
  );
}

function DocumentIcon() {
  return (
    <GlyphSvg>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v3h3" />
      <path d="M9 10h6M9 13h6M9 16h4" />
    </GlyphSvg>
  );
}

function DiamondIcon() {
  return (
    <GlyphSvg>
      <path d="M6 9l6-6 6 6-6 12z" />
      <path d="M6 9h12" />
      <path d="M10 9l2 12 2-12" />
    </GlyphSvg>
  );
}

function PotIcon() {
  return (
    <GlyphSvg>
      <path d="M4 9h16v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" />
      <path d="M3 9h18" />
      <path d="M8 6c0-1 1-2 2-2M12 6c0-1 1-2 2-2" />
    </GlyphSvg>
  );
}

function ShieldIcon() {
  return (
    <GlyphSvg>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </GlyphSvg>
  );
}

function LampIcon() {
  return (
    <GlyphSvg>
      <path d="M8 3h8l3 7H5z" />
      <path d="M12 10v8" />
      <path d="M9 21h6" />
      <path d="M9 18h6" />
    </GlyphSvg>
  );
}

function BookIcon() {
  return (
    <GlyphSvg>
      <path d="M4 4h7v16H6a2 2 0 0 1-2-2z" />
      <path d="M20 4h-7v16h5a2 2 0 0 0 2-2z" />
      <path d="M12 4v16" />
    </GlyphSvg>
  );
}

function BallIcon() {
  return (
    <GlyphSvg>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12c3 0 6-2 9-2s6 2 9 2" />
      <path d="M12 3c-2 3-2 6 0 9s2 6 0 9" />
    </GlyphSvg>
  );
}

function CardIcon() {
  return (
    <GlyphSvg>
      <rect x="5" y="3" width="11" height="16" rx="1.5" />
      <rect x="8" y="6" width="11" height="16" rx="1.5" />
    </GlyphSvg>
  );
}

function CoinIcon() {
  return (
    <GlyphSvg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 10c0-1 1.1-2 2.5-2s2.5 1 2.5 2-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 2 2.5 2 2.5-1 2.5-2" />
    </GlyphSvg>
  );
}

function StarIcon() {
  return (
    <GlyphSvg>
      <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
    </GlyphSvg>
  );
}

function DiscIcon() {
  return (
    <GlyphSvg>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </GlyphSvg>
  );
}

function SignIcon() {
  return (
    <GlyphSvg>
      <path d="M4 6h11l4 4-4 4H4z" />
      <path d="M8 14v6" />
      <path d="M6 20h4" />
    </GlyphSvg>
  );
}

function CompassIcon() {
  return (
    <GlyphSvg>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </GlyphSvg>
  );
}

function GiftIcon() {
  return (
    <GlyphSvg>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M3 9h18" />
      <path d="M12 9v11" />
      <path d="M9 6c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3z" />
    </GlyphSvg>
  );
}

function TreeIcon() {
  return (
    <GlyphSvg>
      <circle cx="12" cy="4" r="1.5" />
      <path d="M12 6v3" />
      <path d="M8 12h8" />
      <path d="M12 9v3" />
      <path d="M8 12v3" />
      <path d="M16 12v3" />
      <circle cx="6" cy="17" r="1.5" />
      <circle cx="12" cy="17" r="1.5" />
      <circle cx="18" cy="17" r="1.5" />
    </GlyphSvg>
  );
}

function FrameIcon() {
  return (
    <GlyphSvg>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M7 17l3-4 3 3 3-5 2 2" />
    </GlyphSvg>
  );
}

function GlassIcon() {
  return (
    <GlyphSvg>
      <path d="M7 3h10l-1 8a4 4 0 0 1-4 4 4 4 0 0 1-4-4z" />
      <path d="M12 15v5" />
      <path d="M9 21h6" />
    </GlyphSvg>
  );
}

function PlateIcon() {
  return (
    <GlyphSvg>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
    </GlyphSvg>
  );
}

function BagIcon() {
  return (
    <GlyphSvg>
      <path d="M5 8h14l-1 13H6z" />
      <path d="M8 8V6c0-2 1.8-3 4-3s4 1 4 3v2" />
    </GlyphSvg>
  );
}
