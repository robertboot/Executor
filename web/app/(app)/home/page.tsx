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
import {
  formatMoney,
  formatRelativeTime,
  timeOfDayGreeting,
} from '@/lib/format';
import {
  findArchetype,
  findSubCategory,
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
    4,
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <YourCollections
              subCats={featuredSubCats}
              itemCountByCoreKey={itemCountByCoreKey}
              fallbackStats={collectionsStats}
            />
          </div>
          <div className="lg:col-span-4">
            <RecentlyAdded items={recent} />
          </div>
          <div className="lg:col-span-4">
            {timeline.length > 0 ? (
              <Timeline entries={timeline} />
            ) : (
              people.length > 0 && <SharedWith people={people} />
            )}
          </div>
        </div>

        {timeline.length > 0 && people.length > 0 && (
          <SharedWith people={people} />
        )}
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
        <h1 className="font-serif text-4xl sm:text-5xl text-ink leading-tight">
          {timeOfDayGreeting()}, {firstName}.
        </h1>
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
        ? // Subtle dark wash across the whole image — slightly heavier
          // in the bottom-left corner where the text + buttons sit.
          'linear-gradient(to top right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.2) 100%)'
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
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-gold text-cream text-sm font-medium hover:bg-gold-deep transition-colors"
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
      <ul className="grid grid-cols-2 gap-3">
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
  return (
    <Link
      href={`/collections/${encodeURIComponent(subCat.parent)}`}
      className="group relative block aspect-[5/3] overflow-hidden rounded-xl border border-hairline shadow-card"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url('${subCat.bgImage}')` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(15,61,46,0.85) 0%, rgba(15,61,46,0.4) 45%, rgba(15,61,46,0) 100%)',
        }}
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 text-cream">
        <h3 className="font-serif text-base sm:text-lg leading-tight">
          {subCat.label}
        </h3>
        <div className="text-xs opacity-90 mt-0.5">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </div>
      </div>
    </Link>
  );
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
  limit: number,
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
  return subCats.slice(0, limit);
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
