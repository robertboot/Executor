import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { getInventory } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import InviteForm from './InviteForm';
import ShareList from './ShareList';
import type { InventoryShare } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function InventorySharesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const inventory = await getInventory(id);
  if (!inventory) notFound();
  if (!user || user.id !== inventory.owner_id) {
    // Only the owner manages shares.
    return (
      <Card>
        <p className="text-sm text-muted">
          Only the inventory owner can manage shares.
        </p>
      </Card>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: shares } = await supabase
    .from('inventory_shares')
    .select('*')
    .eq('inventory_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/inventories" className="text-xs text-muted hover:text-ink">
          ← Inventories
        </Link>
        <h1 className="font-serif text-3xl text-ink mt-1">
          Share &ldquo;{inventory.name}&rdquo;
        </h1>
        <p className="text-muted text-sm mt-1">
          Invite family members to view or contribute. Viewers can browse;
          contributors can add and edit items.
        </p>
      </div>

      <Card>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-3">
          Invite someone
        </h2>
        <InviteForm inventoryId={id} />
      </Card>

      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-3">
          Current people
        </h2>
        <ShareList shares={(shares ?? []) as InventoryShare[]} />
      </div>
    </div>
  );
}
