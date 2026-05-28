import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import InviteRow from './InviteRow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Invites — Heirloom' };

export default async function InvitesPage() {
  const user = await getCurrentUser();
  if (!user?.email) {
    return (
      <Card>
        <p className="text-sm text-muted">Sign in to see invites.</p>
      </Card>
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data: pending } = await supabase
    .from('inventory_shares')
    .select('id, inventory_id, role, status, invited_email, inventory:inventories(name, description)')
    .eq('status', 'pending')
    .ilike('invited_email', user.email);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-serif text-3xl text-ink">Invites</h1>
        <p className="text-muted text-sm mt-1">
          Pending invitations to collaborate on someone else&rsquo;s inventory.
        </p>
      </div>

      {(pending?.length ?? 0) === 0 ? (
        <Card>
          <p className="text-sm text-muted">No pending invites.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {pending!.map((p: {
            id: string;
            role: 'viewer' | 'contributor';
            inventory: { name: string; description: string | null } | { name: string; description: string | null }[] | null;
          }) => {
            const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
            return (
              <li key={p.id}>
                <InviteRow
                  id={p.id}
                  inventoryName={inv?.name ?? 'Untitled inventory'}
                  description={inv?.description ?? null}
                  role={p.role}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
