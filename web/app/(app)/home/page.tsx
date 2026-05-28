import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  dashboardStats,
  listMyInventories,
  listRecentItems,
} from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { glyphForCategory, labelForCategory } from '@/lib/categories';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const firstName =
    (user?.user_metadata?.display_name as string | undefined)?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  const [stats, inventories, recent, pendingInviteCount] = await Promise.all([
    dashboardStats(),
    listMyInventories(),
    listRecentItems(6),
    pendingInvites(user?.email),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-ink">Welcome back, {firstName}.</h1>
          <p className="text-muted text-sm mt-1">Here&rsquo;s what&rsquo;s happening.</p>
        </div>
        {inventories.length > 0 && (
          <Link
            href="/items/new"
            className="inline-flex items-center gap-1 px-4 h-10 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep whitespace-nowrap"
          >
            + Add item
          </Link>
        )}
      </div>

      {pendingInviteCount > 0 && (
        <Link
          href="/invites"
          className="block bg-gold-soft border border-gold rounded-xl p-4 hover:shadow-card transition-shadow"
        >
          <span className="text-sm text-ink">
            <strong>{pendingInviteCount} pending invite{pendingInviteCount === 1 ? '' : 's'}</strong>
            {' '}— tap to review.
          </span>
        </Link>
      )}

      {inventories.length === 0 && (
        <Card>
          <p className="text-sm text-ink-soft">
            You don&rsquo;t have an inventory yet.{' '}
            <Link href="/inventories" className="text-forest underline">
              Create one
            </Link>{' '}
            to start cataloging items.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Items cataloged"
          value={String(stats.itemCount)}
          tone="sage"
          href="/collections"
        />
        <StatCard
          label="Total estimated value"
          value={formatMoney(stats.totalValue, stats.totalCurrency)}
          tone="gold"
          href="/collections"
        />
        <StatCard
          label="Conservators assigned"
          value={String(stats.conservatorCount)}
          tone="lilac"
          href="/conservators"
        />
        <StatCard
          label="Tagged for sale"
          value={String(stats.taggedForSaleCount)}
          tone="periwinkle"
          href="/collections"
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl text-ink">Recent items</h2>
          {inventories[0] && (
            <Link
              href="/collections"
              className="text-sm text-forest hover:underline"
            >
              View all →
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <Card>
            <p className="text-muted text-sm">
              No items yet.{' '}
              <Link href="/items/new" className="text-forest underline">
                Add your first
              </Link>
              .
            </p>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/items/${item.id}`}
                  className="block bg-paper border border-hairline rounded-xl p-4 hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{glyphForCategory(item.category)}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{item.name}</div>
                      <div className="text-xs text-muted">
                        {labelForCategory(item.category)}
                      </div>
                      {item.value_amount != null && (
                        <div className="text-xs text-ink-soft mt-1">
                          {formatMoney(item.value_amount, item.value_currency)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
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

function StatCard({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: string;
  tone: 'sage' | 'gold' | 'lilac' | 'periwinkle';
  href?: string;
}) {
  const toneClass = {
    sage: 'bg-forest text-cream',
    gold: 'bg-gold text-cream',
    lilac: 'bg-[#9F8AA8] text-cream',
    periwinkle: 'bg-[#6F87B0] text-cream',
  }[tone];

  const inner = (
    <div className={`rounded-xl p-5 ${toneClass} shadow-card`}>
      <div className="text-3xl font-serif">{value}</div>
      <div className="text-xs uppercase tracking-wide mt-1 opacity-90">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
