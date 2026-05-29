import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { findCategory, labelForCategory } from '@/lib/categories';
import { findSubCategory } from '@/lib/onboarding';
import { formatMoney } from '@/lib/format';
import {
  photoPublicUrl,
  getCustomCollection,
  customCollectionImageUrl,
} from '@/lib/api';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ sub?: string; custom?: string }>;
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ key: rawKey }, search] = await Promise.all([params, searchParams]);
  const coreKey = decodeURIComponent(rawKey);

  // Custom collections use a UUID for their key. When the URL looks
  // like one (or ?custom=1 is set), try to load it and short-circuit
  // to the custom view.
  const couldBeCustom = search?.custom === '1' || UUID_RE.test(coreKey);
  const custom = couldBeCustom ? await getCustomCollection(coreKey) : null;

  const preset = !custom ? findCategory(coreKey) : null;
  const sub = !custom && search?.sub ? findSubCategory(search.sub) : null;

  // The display layer is sub-cat-aware, but item storage is still core-
  // keyed — so we always filter by the parent core key (or by the
  // custom collection's UUID).
  const filterKey = custom ? custom.id : sub?.parent ?? coreKey;

  const supabase = await createSupabaseServerClient();
  const { data: items } = await supabase
    .from('items')
    .select('*, item_photos(storage_path, sort_order)')
    .eq('category', filterKey)
    .order('created_at', { ascending: false });

  const title =
    custom?.name ??
    sub?.label ??
    preset?.label ??
    labelForCategory(coreKey);
  const description = sub?.description ?? null;
  const heroImage = custom?.image_path
    ? customCollectionImageUrl(custom.image_path)
    : sub?.bgImage ?? null;
  const heroZoom = custom ? 1 : sub?.thumbZoom ?? 1;
  const editHref = custom ? `/collections/custom/${custom.id}/edit` : null;
  const count = items?.length ?? 0;
  const itemList =
    (items ?? []) as Array<{
      id: string;
      name: string;
      category: string | null;
      value_amount: number | null;
      value_currency: string;
      item_photos: Array<{ storage_path: string; sort_order: number }>;
    }>;

  return (
    <div className="space-y-6 pb-24">
      <Hero
        title={title}
        description={description}
        heroImage={heroImage}
        heroZoom={heroZoom}
        count={count}
        addItemHref={`/items/new?category=${encodeURIComponent(filterKey)}`}
        editHref={editHref}
      />

      {count === 0 ? (
        <div className="bg-paper border border-hairline rounded-2xl p-10 text-center">
          <p className="text-muted text-sm">
            No items in this collection yet.{' '}
            <Link
              href={`/items/new?category=${encodeURIComponent(filterKey)}`}
              className="text-forest underline"
            >
              Add the first one
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {itemList.map((item) => {
            const cover = (item.item_photos ?? [])
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)[0];
            return (
              <li key={item.id}>
                <Link
                  href={`/items/${item.id}`}
                  className="group block bg-paper border border-hairline rounded-xl overflow-hidden hover:shadow-card transition-shadow"
                >
                  <div className="relative aspect-square bg-cream-soft overflow-hidden">
                    {cover ? (
                      <Image
                        src={photoPublicUrl(cover.storage_path)}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted/50">
                        ◇
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-0.5">
                    <div className="font-medium text-ink text-sm truncate">
                      {item.name}
                    </div>
                    {item.value_amount != null && (
                      <div className="text-xs text-muted">
                        {formatMoney(item.value_amount, item.value_currency)}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Hero({
  title,
  description,
  heroImage,
  heroZoom,
  count,
  addItemHref,
  editHref,
}: {
  title: string;
  description: string | null;
  heroImage: string | null;
  heroZoom: number;
  count: number;
  addItemHref: string;
  editHref: string | null;
}) {
  if (heroImage) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-hairline shadow-card aspect-[16/9] sm:aspect-[5/2] lg:aspect-[3/1]">
        <div
          className="absolute inset-0"
          style={{ transformOrigin: '100% 50%' }}
        >
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-right"
            style={{
              transform: heroZoom !== 1 ? `scale(${heroZoom})` : undefined,
              transformOrigin: '100% 50%',
            }}
            priority
          />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 h-full p-6 sm:p-8 max-w-md flex flex-col justify-end text-cream">
          <h1 className="font-serif text-3xl sm:text-4xl leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base mt-2 text-cream/90 max-w-xs">
              {description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-sm">
              <strong>{count}</strong> {count === 1 ? 'item' : 'items'}
            </span>
            <Link
              href={addItemHref}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[#C68A2E] text-cream text-sm font-medium hover:bg-[#A8741F] transition-colors"
            >
              + Add item
            </Link>
            {editHref && (
              <Link
                href={editHref}
                className="text-sm text-cream/90 underline hover:text-cream"
              >
                Edit
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Fallback hero when no sub-category context — plain header.
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-3xl text-ink truncate">{title}</h1>
        <p className="text-sm text-muted mt-1">
          {count} {count === 1 ? 'item' : 'items'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {editHref && (
          <Link
            href={editHref}
            className="text-sm text-muted hover:text-ink underline"
          >
            Edit
          </Link>
        )}
        <Link
          href={addItemHref}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
        >
          + Add item
        </Link>
      </div>
    </header>
  );
}
