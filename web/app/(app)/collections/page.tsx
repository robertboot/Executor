import Link from 'next/link';
import Image from 'next/image';
import { listMyCollectionsRich } from '@/lib/api';
import { CATEGORY_PRESETS, findCategory, type CategoryPreset } from '@/lib/categories';

export const dynamic = 'force-dynamic';

type CardData = {
  key: string;
  label: string;
  itemCount: number;
  preset: CategoryPreset | null;
};

export default async function CollectionsPage() {
  const inUse = await listMyCollectionsRich();
  const usedKeys = new Set(inUse.map((c) => c.key));

  const usedCards: CardData[] = inUse.map((c) => ({
    key: c.key,
    label: c.label,
    itemCount: c.itemCount,
    preset: findCategory(c.key),
  }));

  const emptyCards: CardData[] = CATEGORY_PRESETS
    .filter((p) => !usedKeys.has(p.key) && p.iconUrl)
    .map((p) => ({
      key: p.key,
      label: p.label,
      itemCount: 0,
      preset: p,
    }));

  const cards = [...usedCards, ...emptyCards];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-ink">Collections</h1>
        <p className="text-muted text-base mt-2">
          Organize your items by what matters most.
        </p>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {cards.map((c) => (
          <li key={c.key}>
            <CollectionCard data={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CollectionCard({ data }: { data: CardData }) {
  const { key, label, itemCount, preset } = data;
  return (
    <Link
      href={`/collections/${encodeURIComponent(key)}`}
      className="flex flex-col bg-paper border border-hairline rounded-2xl p-3 hover:shadow-card transition-shadow h-full"
    >
      {preset?.iconUrl ? (
        <Image
          src={preset.iconUrl}
          alt={label}
          width={320}
          height={320}
          className="w-full aspect-square object-contain"
        />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center text-7xl">
          {preset?.glyph ?? '◇'}
        </div>
      )}

      <h3 className="font-serif text-lg text-ink font-semibold mt-3 leading-tight">
        {label}
      </h3>

      <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-soft">
        <BookmarkIcon className="w-3.5 h-3.5 text-gold" />
        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="border-t border-hairline mt-3 pt-2">
        <div className="text-[10px] uppercase tracking-wide text-muted">Shared with</div>
        <div className="text-sm italic text-ink-soft mt-0.5">Just you</div>
      </div>
    </Link>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="2" width="10" height="12" rx="1" />
      <path d="M3 6h10" />
    </svg>
  );
}
