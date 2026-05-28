import Link from 'next/link';
import { listMyInventories } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import CreateInventoryForm from './CreateInventoryForm';

export const dynamic = 'force-dynamic';

export default async function InventoriesPage() {
  const inventories = await listMyInventories();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl text-ink">Inventories</h1>
        <p className="text-muted text-sm mt-1">
          Top-level containers for your items. Most people only need one,
          but you might want a separate inventory for, e.g., a parent&rsquo;s
          estate.
        </p>
      </div>

      {inventories.length === 0 ? (
        <Card>
          <p className="text-sm text-muted mb-4">
            You don&rsquo;t have any inventories yet. Create one to start
            cataloging items.
          </p>
          <CreateInventoryForm />
        </Card>
      ) : (
        <>
          <ul className="space-y-2">
            {inventories.map((inv) => (
              <li key={inv.id}>
                <Link
                  href={`/inventory/${inv.id}`}
                  className="block bg-paper border border-hairline rounded-xl p-4 hover:shadow-card transition-shadow"
                >
                  <div className="flex items-baseline justify-between">
                    <div className="font-medium text-ink">{inv.name}</div>
                    <div className="text-xs text-muted uppercase tracking-wide">
                      {inv.role}
                    </div>
                  </div>
                  {inv.description && (
                    <p className="text-sm text-muted mt-1">{inv.description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <details className="bg-paper border border-hairline rounded-xl p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Add another inventory
            </summary>
            <div className="mt-4">
              <CreateInventoryForm />
            </div>
          </details>
        </>
      )}
    </div>
  );
}
