import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { glyphForCategory, labelForCategory } from '@/lib/categories';
import { formatMoney } from '@/lib/format';
import SearchBox from './SearchBox';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Search — Heirloom' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  let items: Array<{
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    location: string | null;
    value_amount: number | null;
    value_currency: string;
  }> = [];

  if (query.length > 0) {
    const supabase = await createSupabaseServerClient();
    // Match against name + description + location + provenance for now.
    // The Supabase `.or()` filter uses comma separation with column.op.value.
    const like = `%${query.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    const { data, error } = await supabase
      .from('items')
      .select('id, name, category, description, location, value_amount, value_currency')
      .or(
        [
          `name.ilike.${like}`,
          `description.ilike.${like}`,
          `location.ilike.${like}`,
          `provenance.ilike.${like}`,
        ].join(','),
      )
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    items = data ?? [];
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-serif text-3xl text-ink">Search</h1>
        <p className="text-muted text-sm mt-1">
          Find items by name, description, location, or provenance.
        </p>
      </div>

      <SearchBox initial={query} />

      {query.length === 0 ? (
        <p className="text-sm text-muted">Type something above to start.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">
          No items match <span className="font-medium">{query}</span>.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/items/${item.id}`}
                className="flex items-center gap-4 bg-paper border border-hairline rounded-xl p-4 hover:shadow-card transition-shadow"
              >
                <div className="text-2xl">{glyphForCategory(item.category)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink truncate">{item.name}</div>
                  <div className="text-xs text-muted">
                    {labelForCategory(item.category)}
                    {item.location && ` · ${item.location}`}
                  </div>
                </div>
                {item.value_amount != null && (
                  <div className="text-sm text-ink-soft whitespace-nowrap">
                    {formatMoney(item.value_amount, item.value_currency)}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
