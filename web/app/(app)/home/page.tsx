import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  dashboardStats,
  listMyCollectionsRich,
  listRecentItemsWithPhotos,
  type RecentItemWithPhoto,
} from '@/lib/api';
import { formatMoney } from '@/lib/format';
import {
  findArchetype,
  findSubCategory,
  type SubCategory,
} from '@/lib/onboarding';
import { findCategory, glyphForCategory } from '@/lib/categories';
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

  const [profileRes, stats, recent, collectionsStats, pendingInviteCount] =
    await Promise.all([
      user
        ? supabase
            .from('profiles')
            .select('archetype, selected_collections')
            .eq('id', user.id)
            .maybeSingle()
            .then((res) => res, () => ({ data: null }))
        : Promise.resolve({ data: null }),
      dashboardStats(),
      listRecentItemsWithPhotos(8),
      listMyCollectionsRich(),
      pendingInvites(user?.email),
    ]);

  const profile = (profileRes?.data ?? null) as ProfileSlim | null;
  const archetype = findArchetype(profile?.archetype);

  const itemCountByCoreKey = new Map<string, number>();
  const valueByCoreKey = new Map<string, number>();
  for (const c of collectionsStats) {
    itemCountByCoreKey.set(c.key, c.itemCount);
    valueByCoreKey.set(c.key, c.totalValue);
  }

  const featuredSubCats = pickFeaturedSubCategories(
    profile?.selected_collections ?? null,
    itemCountByCoreKey,
  );

  return (
    <>
      <div className="space-y-10 pb-24">
        <Hero
          firstName={firstName}
          archetypeLabel={archetype?.title ?? null}
          itemCount={stats.itemCount}
          totalValue={stats.totalValue}
          totalCurrency={stats.totalCurrency}
        />

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

        <RecentlyAdded items={recent} />

        {featuredSubCats.length > 0 ? (
          <FeaturedCollections
            subCats={featuredSubCats}
            itemCountByCoreKey={itemCountByCoreKey}
            valueByCoreKey={valueByCoreKey}
            totalCurrency={stats.totalCurrency}
          />
        ) : (
          <FallbackCollections
            collectionsStats={collectionsStats}
          />
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

function Hero({
  firstName,
  archetypeLabel,
  itemCount,
  totalValue,
  totalCurrency,
}: {
  firstName: string;
  archetypeLabel: string | null;
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink leading-tight">
          Welcome back, {firstName}.
        </h1>
        <p className="text-muted text-base mt-2">
          {archetypeLabel
            ? `Your ${archetypeLabel} archive — preserved, organized, ready.`
            : 'Preserve what matters. Pass it on.'}
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
          <ul className="flex gap-3 overflow-x-auto px-4 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 snap-x snap-mandatory pb-2">
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
        <div className="text-xs text-muted mt-0.5 truncate">
          {labelForCategoryOrDefault(item.category)}
        </div>
      </div>
    </Link>
  );
}

function FeaturedCollections({
  subCats,
  itemCountByCoreKey,
  valueByCoreKey,
  totalCurrency,
}: {
  subCats: SubCategory[];
  itemCountByCoreKey: Map<string, number>;
  valueByCoreKey: Map<string, number>;
  totalCurrency: string;
}) {
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
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subCats.map((s) => (
          <li key={s.key}>
            <FeaturedSubCatCard
              subCat={s}
              itemCount={itemCountByCoreKey.get(s.parent) ?? 0}
              totalValue={valueByCoreKey.get(s.parent) ?? 0}
              totalCurrency={totalCurrency}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeaturedSubCatCard({
  subCat,
  itemCount,
  totalValue,
  totalCurrency,
}: {
  subCat: SubCategory;
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
}) {
  return (
    <Link
      href={`/collections/${encodeURIComponent(subCat.parent)}`}
      className="group relative flex h-40 sm:h-44 overflow-hidden bg-paper border border-hairline rounded-2xl hover:shadow-card transition-shadow"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url('${subCat.bgImage}')` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-60"
        style={{
          background:
            'linear-gradient(to right, rgba(255,253,247,0.88) 0%, rgba(255,253,247,0.75) 35%, rgba(255,253,247,0.3) 55%, rgba(255,253,247,0.03) 80%, rgba(255,253,247,0) 100%)',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex-1 min-w-0 p-5 flex flex-col justify-between max-w-[58%]">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted">
            Collection
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-ink mt-1 leading-tight">
            {subCat.label}
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
    </Link>
  );
}

function FallbackCollections({
  collectionsStats,
}: {
  collectionsStats: CollectionWithStats[];
}) {
  if (collectionsStats.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-ink">Your collections</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {collectionsStats.map((c) => {
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
                      sizes="160px"
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

// ---- helpers ----

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
  // Sort: ones with items first (by item count desc), then empty ones in
  // declared order.
  subCats.sort((a, b) => {
    const ac = itemCountByCoreKey.get(a.parent) ?? 0;
    const bc = itemCountByCoreKey.get(b.parent) ?? 0;
    return bc - ac;
  });
  return subCats.slice(0, 6);
}

function labelForCategoryOrDefault(category: string | null): string {
  if (!category) return 'No collection';
  const preset = findCategory(category);
  return preset?.label ?? category;
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
