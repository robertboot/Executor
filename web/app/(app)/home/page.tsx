import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  dashboardStats,
  listMyCollectionsRich,
  listRecentItemsWithPhotos,
  listItemsNeedingAttention,
  listTimelineItems,
  listInventoryPeople,
  type RecentItemWithPhoto,
  type ItemNeedingAttention,
  type CatalogingGap,
  type TimelineEntry,
  type SharedPerson,
} from '@/lib/api';
import { formatMoney, formatRelativeTime } from '@/lib/format';
import GreetingHeading from '@/components/GreetingHeading';
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
  const firstName =
    (user?.user_metadata?.display_name as string | undefined)?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  const supabase = await createSupabaseServerClient();

  const [
    profileRes,
    stats,
    recent,
    collectionsStats,
    needsAttention,
    timeline,
    people,
    pendingInviteCount,
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
    listInventoryPeople(),
    pendingInvites(user?.email),
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
    <>
      <div className="space-y-10 pb-24">
        {/* Top row: header on the left, hero card on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <Header
              firstName={firstName}
              archetypeTitle={archetype?.title ?? null}
              itemCount={stats.itemCount}
              collectionCount={stats.collectionCount}
              conservatorCount={stats.conservatorCount}
            />
          </div>
          <div className="lg:col-span-7 xl:col-span-8">
            <HeroCard
              archetype={archetype}
              itemCount={stats.itemCount}
              lastUpdatedAt={stats.lastUpdatedAt}
            />
          </div>
        </div>

        {pendingInviteCount > 0 && (
          <Link
            href="/invites"
            className="block bg-gold-soft border border-gold rounded-xl p-4 hover:shadow-card transition-shadow"
          >
            <span className="text-sm text-ink">
              <strong>
                {pendingInviteCount} pending invite
                {pendingInviteCount === 1 ? '' : 's'}
              </strong>{' '}
              — tap to review.
            </span>
          </Link>
        )}

        {needsAttention.length > 0 && (
          <ContinueCataloging items={needsAttention} />
        )}

        <YourCollections
          subCats={featuredSubCats}
          itemCountByCoreKey={itemCountByCoreKey}
          fallbackStats={collectionsStats}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentlyAdded items={recent} />
          {timeline.length > 0 ? (
            <Timeline entries={timeline} />
          ) : (
            people.length > 0 && <SharedWith people={people} />
          )}
        </div>

        {timeline.length > 0 && people.length > 0 && (
          <SharedWith people={people} />
        )}
      </div>

      <Link
        href="/items/new"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2 pl-4 pr-5 h-12 sm:h-14 rounded-full bg-forest text-cream shadow-xl hover:bg-forest-deep transition-colors font-medium"
        aria-label="Add a new piece"
      >
        <PlusIcon className="w-5 h-5" />
        <span className="text-sm">Add piece</span>
      </Link>
    </>
  );
}

// ============================================================== //
//  Sections                                                       //
// ============================================================== //

function Header({
  firstName,
  archetypeTitle,
  itemCount,
  collectionCount,
  conservatorCount,
}: {
  firstName: string;
  archetypeTitle: string | null;
  itemCount: number;
  collectionCount: number;
  conservatorCount: number;
}) {
  return (
    <section className="space-y-4">
      <div>
        <GreetingHeading
          firstName={firstName}
          className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight"
        />
        {archetypeTitle && (
          <p className="text-gold-deep text-base sm:text-lg font-medium mt-2">
            Your {archetypeTitle} Collection
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-ink-soft">
        <span>
          <strong className="text-ink">{itemCount.toLocaleString()}</strong>{' '}
          {itemCount === 1 ? 'Piece' : 'Pieces'}
        </span>
        <span className="text-muted">·</span>
        <span>
          <strong className="text-ink">{collectionCount}</strong>{' '}
          {collectionCount === 1 ? 'Collection' : 'Collections'}
        </span>
        <span className="text-muted">·</span>
        <span>
          <strong className="text-ink">{conservatorCount}</strong>{' '}
          {conservatorCount === 1 ? 'Conservator' : 'Conservators'}
        </span>
      </div>
      <form action="/search" method="get" className="max-w-md">
        <label className="relative block">
          <span className="sr-only">Search your archive</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            type="search"
            name="q"
            placeholder="Search your archive…"
            className="w-full bg-paper border border-hairline rounded-full pl-10 pr-4 h-11 text-sm placeholder:text-muted focus:outline-none focus:border-forest"
          />
        </label>
      </form>
    </section>
  );
}

function HeroCard({
  archetype,
  itemCount,
  lastUpdatedAt,
}: {
  archetype: ArchetypeDef | null;
  itemCount: number;
  lastUpdatedAt: string | null;
}) {
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
  const overlayStyle = archetype.heroOverlayStyle ?? 'fade';
  const overlayBackground =
    overlayStyle === 'none'
      ? null
      : overlayStyle === 'scrim'
        ? // Flat 33% dark wash for legibility without dimming the
          // photo too much. Tuned for cream text on a mid-bright
          // background image.
          'rgba(0,0,0,0.33)'
        : // Left-to-right forest-green fade — matches images that bake
          // a light left half into the source.
          'linear-gradient(to right, rgba(15,61,46,0.78) 0%, rgba(15,61,46,0.55) 35%, rgba(15,61,46,0.15) 65%, rgba(15,61,46,0) 100%)';
  return (
    <section className="relative overflow-hidden bg-paper border border-hairline rounded-2xl shadow-card aspect-[16/9] lg:aspect-[2/1] xl:aspect-[5/2]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroImage}')` }}
        aria-hidden="true"
      />
      {overlayBackground && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: overlayBackground }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10 h-full p-6 sm:p-8 max-w-md flex flex-col justify-between text-cream">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl leading-tight">
            {archetype.title}
          </h2>
        </div>
        <div className="space-y-3">
          <div className="text-sm space-y-0.5">
            <div>
              <strong>{itemCount.toLocaleString()}</strong>{' '}
              {itemCount === 1 ? 'Item' : 'Items'} Cataloged
            </div>
            {lastUpdatedAt && (
              <div className="text-cream/80">
                Last updated {formatRelativeTime(lastUpdatedAt)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/items/new"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[#C68A2E] text-cream text-sm font-medium hover:bg-[#A8741F] transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Item
            </Link>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-cream/10 backdrop-blur-sm border border-cream/30 text-cream text-sm font-medium hover:bg-cream/20 transition-colors"
            >
              <CameraIcon className="w-4 h-4" />
              Scan Item
            </Link>
          </div>
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
      <h2 className="font-serif text-2xl text-ink">Continue cataloging</h2>
      <div className="-mx-4 sm:mx-0">
        <ul className="flex gap-3 overflow-x-auto px-4 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 snap-x snap-mandatory pb-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="shrink-0 w-72 sm:w-auto snap-start"
            >
              <Link
                href={`/items/${item.id}`}
                className="group flex items-stretch gap-3 bg-paper border border-hairline rounded-xl overflow-hidden hover:shadow-card transition-shadow h-full"
              >
                <div className="relative w-24 shrink-0 bg-cream-soft overflow-hidden">
                  {item.primaryPhotoUrl ? (
                    <Image
                      src={item.primaryPhotoUrl}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl text-muted/50">
                      {glyphForCategory(item.category)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <div className="font-medium text-ink text-sm truncate">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-soft mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${GAP_DOT_COLOR[item.gap]}`}
                    />
                    <span>{GAP_LABEL[item.gap]}</span>
                  </div>
                </div>
                <span className="flex items-center pr-3 text-muted">
                  <ChevronRightIcon className="w-4 h-4" />
                </span>
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
        <ul className="grid grid-cols-2 gap-3">
          {fallbackStats.slice(0, 4).map((c) => {
            const preset = findCategory(c.key);
            return (
              <li key={c.key}>
                <Link
                  href={`/collections/${encodeURIComponent(c.key)}`}
                  className="flex flex-col items-center bg-paper border border-hairline rounded-xl p-3 hover:shadow-card transition-shadow"
                >
                  <div className="w-full aspect-square relative">
                    {preset?.iconUrl ? (
                      <Image
                        src={preset.iconUrl}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl">
                        {preset?.glyph ?? '◇'}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium text-ink mt-2 text-center">
                    {c.label}
                  </div>
                  <div className="text-[10px] text-muted">
                    {c.itemCount} {c.itemCount === 1 ? 'piece' : 'pieces'}
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
          Manage →
        </Link>
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {subCats.map((s) => (
          <li key={s.key}>
            <SubCatVisualCard
              subCat={s}
              itemCount={itemCountByCoreKey.get(s.parent) ?? 0}
            />
          </li>
        ))}
      </ul>
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
  // Crop the light-left gradient out of the source image: anchor to
  // the right edge and zoom aggressively so the cream half stays
  // entirely off-screen. homeZoom wins outright when set; otherwise
  // fall back to the max of thumbZoom and a 1.8 baseline.
  const baseZoom =
    subCat.homeZoom ?? Math.max(subCat.thumbZoom ?? 1, 1.8);
  return (
    <Link
      href={`/collections/${encodeURIComponent(subCat.parent)}?sub=${encodeURIComponent(subCat.key)}`}
      className="group relative block aspect-[5/3] overflow-hidden rounded-xl border border-hairline shadow-card"
    >
      <div
        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        style={{ transformOrigin: '100% 50%' }}
      >
        <Image
          src={subCat.bgImage}
          alt=""
          fill
          sizes="(max-width: 1024px) 50vw, 320px"
          className="object-cover object-right"
          style={{
            transform: `scale(${baseZoom})`,
            transformOrigin: '100% 50%',
          }}
        />
      </div>
      {/* Light bottom darkening just for text legibility. */}
      <div
        className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%)',
        }}
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 text-cream">
        {archetypeForSubCategory(subCat.key) && (
          <div className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5 drop-shadow-sm">
            {archetypeForSubCategory(subCat.key)!.title}
          </div>
        )}
        <h3 className="font-serif text-lg sm:text-xl leading-tight drop-shadow-sm">
          {subCat.label}
        </h3>
        <div className="text-xs opacity-90 mt-0.5 drop-shadow-sm">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
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
              Add your first piece
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

function SharedWith({ people }: { people: SharedPerson[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink">Shared with</h2>
        <Link
          href="/inventories"
          className="text-sm text-forest hover:underline"
        >
          Manage access →
        </Link>
      </div>
      <ul className="bg-paper border border-hairline rounded-xl divide-y divide-hairline overflow-hidden">
        {people.map((p, i) => (
          <li
            key={`${p.email}-${i}`}
            className="flex items-center gap-3 p-4"
          >
            <Avatar name={p.displayName || p.email} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-ink truncate">
                {p.displayName || p.email}
              </div>
              {p.displayName && (
                <div className="text-xs text-muted truncate">{p.email}</div>
              )}
            </div>
            <span className="text-xs uppercase tracking-wider text-gold-deep">
              {p.role}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .filter(Boolean)
    .join('');
  return (
    <div className="shrink-0 w-9 h-9 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-semibold">
      {initials || '?'}
    </div>
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

async function pendingInvites(email: string | undefined): Promise<number> {
  if (!email) return 0;
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('inventory_shares')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .ilike('invited_email', email);
  return count ?? 0;
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
