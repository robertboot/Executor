import Link from 'next/link';
import Image from 'next/image';
import type { SubCategory, ArchetypeDef } from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';

interface Props {
  subCats: SubCategory[];
  archetype: ArchetypeDef | null;
  inventoryId: string;
  itemCountByCoreKey: Map<string, number>;
}

export default function PickerView({
  subCats,
  archetype,
  inventoryId,
  itemCountByCoreKey,
}: Props) {
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
          Add a piece
        </h1>
        <p className="text-muted text-sm mt-2">
          First, choose which collection it belongs to.
        </p>
      </div>

      {subCats.length === 0 ? (
        <EmptyPicker archetype={archetype} />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subCats.map((s) => (
            <li key={s.key}>
              <PickerCard
                subCat={s}
                inventoryId={inventoryId}
                itemCount={itemCountByCoreKey.get(s.parent) ?? 0}
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
  // Mirror the Collections grid tile: right-anchored crop with a
  // 1.5x bake-in on top of any per-sub-cat thumbZoom, 4:3 image up
  // top, title + count beneath on a paper card.
  const baseZoom = subCat.homeZoom ?? subCat.thumbZoom ?? 1;
  const gridScale = baseZoom * 1.5;
  return (
    <Link
      href={target}
      className="group block bg-paper border border-hairline rounded-2xl overflow-hidden hover:shadow-card transition-shadow h-full"
    >
      <div className="relative aspect-[4/3] bg-cream-soft overflow-hidden">
        <Image
          src={subCat.bgImage}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-right transition-transform duration-500 group-hover:scale-105"
          style={{
            transform: `scale(${gridScale})`,
            transformOrigin: '100% 50%',
          }}
        />
      </div>
      <div className="p-3">
        <h3 className="font-serif text-base text-ink leading-tight truncate">
          {subCat.label}
        </h3>
        <div className="text-xs text-muted mt-0.5">
          {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
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
          Pick another to add to
        </div>
      </div>
    </Link>
  );
}

function EmptyPicker({ archetype }: { archetype: ArchetypeDef | null }) {
  return (
    <div className="bg-paper border border-hairline rounded-2xl p-10 text-center space-y-4">
      <h2 className="font-serif text-2xl text-ink">No collections yet</h2>
      <p className="text-muted text-sm">
        You need at least one collection before you can add a piece.
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
