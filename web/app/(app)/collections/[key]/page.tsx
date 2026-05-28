import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { findCategory, glyphForCategory, labelForCategory } from '@/lib/categories';
import { formatMoney } from '@/lib/format';
import { photoPublicUrl } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  const preset = findCategory(key);
  const supabase = await createSupabaseServerClient();
  const { data: items } = await supabase
    .from('items')
    .select('*, item_photos(storage_path, sort_order)')
    .eq('category', key)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {preset?.iconUrl ? (
          <Image src={preset.iconUrl} alt="" width={56} height={56} className="rounded-xl" />
        ) : (
          <div className="text-5xl">{glyphForCategory(key)}</div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-3xl text-ink truncate">{labelForCategory(key)}</h1>
          <p className="text-sm text-muted">
            {(items?.length ?? 0)} {(items?.length ?? 0) === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Link href={`/items/new?category=${encodeURIComponent(key)}`}>
          <Button>Add item</Button>
        </Link>
      </div>

      {(items?.length ?? 0) === 0 ? (
        <div className="bg-paper border border-hairline rounded-xl p-6 text-center">
          <p className="text-sm text-muted">No items in this collection yet.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items!.map((item: { id: string; name: string; category: string | null; value_amount: number | null; value_currency: string; item_photos: { storage_path: string; sort_order: number }[] }) => {
            const cover = item.item_photos
              ?.sort((a, b) => a.sort_order - b.sort_order)[0];
            return (
              <li key={item.id}>
                <Link
                  href={`/items/${item.id}`}
                  className="block bg-paper border border-hairline rounded-xl overflow-hidden hover:shadow-card transition-shadow"
                >
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPublicUrl(cover.storage_path)}
                      alt=""
                      className="w-full aspect-[4/3] object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="font-medium text-ink truncate">{item.name}</div>
                    {item.value_amount != null && (
                      <div className="text-xs text-ink-soft mt-1">
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
