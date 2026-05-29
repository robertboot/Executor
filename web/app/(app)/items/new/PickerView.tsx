import Link from 'next/link';
import Image from 'next/image';
import type { SubCategory, ArchetypeDef } from '@/lib/onboarding';
import { archetypeForSubCategory } from '@/lib/onboarding';
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
  const parentArch = archetypeForSubCategory(subCat.key);
  const baseZoom = Math.max(subCat.thumbZoom ?? 1, 1.8);
  const target = `/items/new?category=${encodeURIComponent(subCat.parent)}&inventory=${encodeURIComponent(inventoryId)}`;
  return (
    <Link
      href={target}
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
          sizes="(max-width: 1024px) 50vw, 360px"
          className="object-cover object-right"
          style={{
            transform: `scale(${baseZoom})`,
            transformOrigin: '100% 50%',
          }}
        />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%)',
        }}
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 text-cream">
        {parentArch && (
          <div className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5 drop-shadow-sm">
            {parentArch.title}
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

function AddCollectionCard({
  archetypeKey,
}: {
  archetypeKey: OnboardingArchetype;
}) {
  return (
    <Link
      href={`/collections/add/${archetypeKey}?next=${encodeURIComponent('/items/new')}`}
      className="group flex items-center justify-center aspect-[5/3] rounded-xl border-2 border-dashed border-gold bg-gold-soft/30 hover:bg-gold-soft/60 transition-colors"
    >
      <div className="flex flex-col items-center text-gold-deep">
        <div className="w-14 h-14 rounded-full bg-gold text-cream flex items-center justify-center mb-2">
          <PlusIcon className="w-7 h-7" />
        </div>
        <div className="font-serif text-base">Add Collection</div>
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
