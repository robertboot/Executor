import Link from 'next/link';
import Image from 'next/image';
import type { SubCategory, ArchetypeDef } from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';
import type { CustomCollectionWithStats } from '@/lib/api';

interface Props {
  subCats: SubCategory[];
  archetype: ArchetypeDef | null;
  inventoryId: string;
  itemCountByCoreKey: Map<string, number>;
  customCollections: CustomCollectionWithStats[];
}

export default function PickerView({
  subCats,
  archetype,
  inventoryId,
  itemCountByCoreKey,
  customCollections,
}: Props) {
  const isEmpty = subCats.length === 0 && customCollections.length === 0;
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      <Link
        href="/home"
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← Home
      </Link>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Add an Item
        </h1>
        <p className="text-muted text-sm mt-2">
          First, choose which collection it belongs to.
        </p>
      </div>

      {isEmpty ? (
        <EmptyPicker archetype={archetype} />
      ) : (
        <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {subCats.map((s) => (
            <li key={s.key}>
              <PickerCard
                subCat={s}
                inventoryId={inventoryId}
                itemCount={itemCountByCoreKey.get(s.parent) ?? 0}
              />
            </li>
          ))}
          {customCollections.map((c) => (
            <li key={c.id}>
              <CustomPickerCard
                collection={c}
                inventoryId={inventoryId}
              />
            </li>
          ))}
          {archetype && (
            <li>
              <AddCollectionCard archetypeKey={archetype.key} />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function PickerCard({
  subCat,
  inventoryId,
  itemCount,
}: {
  subCat: SubCategory;
  inventoryId: string;
  itemCount: number;
}) {
  const target = `/items/new?category=${encodeURIComponent(subCat.parent)}&inventory=${encodeURIComponent(inventoryId)}`;
  // Square thumb, right-anchored crop. Light 1.3x scale so the
  // source image still reads at a glance now that the tiles are
  // smaller — too much zoom and the subject crops out of frame.
  const baseZoom = subCat.homeZoom ?? subCat.thumbZoom ?? 1;
  const gridScale = Math.max(baseZoom, 1) * 1.3;
  return (
    <Link
      href={target}
      className="group block bg-paper border border-hairline rounded-xl overflow-hidden hover:shadow-card transition-shadow h-full"
    >
      <div className="relative aspect-square bg-cream-soft overflow-hidden">
        <Image
          src={subCat.bgImage}
          alt=""
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover object-right transition-transform duration-500 group-hover:scale-105"
          style={{
            transform: `scale(${gridScale})`,
            transformOrigin: '100% 50%',
          }}
        />
      </div>
      <div className="px-2 py-1.5">
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

function CustomPickerCard({
  collection,
  inventoryId,
}: {
  collection: CustomCollectionWithStats;
  inventoryId: string;
}) {
  const target = `/items/new?category=${encodeURIComponent(collection.id)}&inventory=${encodeURIComponent(inventoryId)}`;
  return (
    <Link
      href={target}
      className="group block bg-paper border border-hairline rounded-xl overflow-hidden hover:shadow-card transition-shadow h-full"
    >
      <div className="relative aspect-square bg-cream-soft overflow-hidden">
        {collection.imageUrl ? (
          <Image
            src={collection.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl text-gold-deep bg-gold-soft/40">
            ✦
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-gold-soft/90 text-[9px] uppercase tracking-widest text-gold-deep font-medium">
          Custom
        </span>
      </div>
      <div className="px-2 py-1.5">
        <h3 className="font-serif text-xs sm:text-sm text-ink leading-tight truncate">
          {collection.name}
        </h3>
        <div className="text-[11px] text-muted mt-0.5">
          {collection.itemCount}{' '}
          {collection.itemCount === 1 ? 'Item' : 'Items'}
        </div>
      </div>
    </Link>
  );
}

function AddCollectionCard({
  archetypeKey,
}: {
  archetypeKey: OnboardingArchetype;
}) {
  return (
    <Link
      href={`/collections/add/${archetypeKey}?next=${encodeURIComponent('/items/new')}`}
      className="group block bg-paper border border-dashed border-hairline rounded-xl overflow-hidden hover:border-forest/40 transition-colors h-full"
    >
      <div className="relative aspect-square bg-cream-soft flex items-center justify-center text-gold-deep">
        <PlusIcon className="w-6 h-6" />
      </div>
      <div className="px-2 py-1.5">
        <h3 className="font-serif text-xs sm:text-sm text-ink leading-tight">
          Add Collection
        </h3>
        <div className="text-[11px] text-muted mt-0.5">Pick another</div>
      </div>
    </Link>
  );
}

function EmptyPicker({ archetype }: { archetype: ArchetypeDef | null }) {
  return (
    <div className="bg-paper border border-hairline rounded-2xl p-10 text-center space-y-4">
      <h2 className="font-serif text-2xl text-ink">No collections yet</h2>
      <p className="text-muted text-sm">
        You need at least one collection before you can add an item.
      </p>
      {archetype ? (
        <Link
          href={`/collections/add/${archetype.key}?next=${encodeURIComponent('/items/new')}`}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep"
        >
          <PlusIcon className="w-4 h-4" />
          Add a collection
        </Link>
      ) : (
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep"
        >
          Go through setup
        </Link>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
