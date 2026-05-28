import Link from 'next/link';
import Image from 'next/image';
import { listMyCollectionsRich } from '@/lib/api';
import { CATEGORY_PRESETS, findCategory } from '@/lib/categories';
import { formatMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const inUse = await listMyCollectionsRich();
  const usedKeys = new Set(inUse.map((c) => c.key));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-ink">Collections</h1>
        <p className="text-muted text-sm mt-1">
          Group items by category. Tap a collection to view or filter.
        </p>
      </div>

      {inUse.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-3">
            Your collections
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inUse.map((c) => {
              const preset = findCategory(c.key);
              return (
                <li key={c.key}>
                  <Link
                    href={`/collections/${encodeURIComponent(c.key)}`}
                    className="flex items-center gap-4 bg-paper border border-hairline rounded-xl p-4 hover:shadow-card transition-shadow"
                  >
                    {preset?.iconUrl ? (
                      <Image
                        src={preset.iconUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="text-3xl">{preset?.glyph ?? '◇'}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-ink truncate">{c.label}</div>
                      <div className="text-xs text-muted">
                        {c.itemCount} {c.itemCount === 1 ? 'item' : 'items'} ·{' '}
                        {formatMoney(c.totalValue, c.totalCurrency)}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-3">
          Add a new collection
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {CATEGORY_PRESETS.filter((p) => !usedKeys.has(p.key) && !p.custom).map((p) => (
            <li key={p.key}>
              <Link
                href={`/collections/${encodeURIComponent(p.key)}`}
                className="flex flex-col items-center gap-2 bg-paper border border-hairline rounded-xl p-3 hover:shadow-card transition-shadow text-center"
              >
                {p.iconUrl ? (
                  <Image
                    src={p.iconUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="text-3xl">{p.glyph}</div>
                )}
                <div className="text-xs text-ink-soft">{p.label}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
