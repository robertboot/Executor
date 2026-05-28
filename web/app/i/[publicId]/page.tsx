// Public item landing page — anyone with the URL can view a single item.
// Mirrors the /i/<publicId> URL the Expo app generates for QR codes (kept
// for backwards compatibility with existing labels; we no longer print
// new ones).

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getItemByPublicId, listPhotos, photoPublicUrl } from '@/lib/api';
import { labelForCategory } from '@/lib/categories';
import { formatMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function PublicItemPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const item = await getItemByPublicId(publicId);
  if (!item) notFound();

  const photos = await listPhotos(item.id);

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-paper border-b border-hairline">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Image
            src="/heirloom-logo-horizontal.png"
            alt="Heirloom"
            width={160}
            height={48}
            priority
          />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">
            {labelForCategory(item.category)}
          </div>
          <h1 className="font-serif text-3xl text-ink">{item.name}</h1>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={photoPublicUrl(p.storage_path)}
                alt={p.caption ?? ''}
                className="w-full aspect-square object-cover rounded-lg border border-hairline"
              />
            ))}
          </div>
        )}

        {item.description && (
          <p className="text-ink-soft whitespace-pre-wrap">{item.description}</p>
        )}

        {item.value_amount != null && (
          <p className="text-sm text-ink-soft">
            Estimated value:{' '}
            <span className="font-medium">
              {formatMoney(item.value_amount, item.value_currency)}
            </span>
          </p>
        )}
      </main>
    </div>
  );
}
