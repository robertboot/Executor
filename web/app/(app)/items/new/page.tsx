import { redirect } from 'next/navigation';
import { listMyInventories } from '@/lib/api';
import ItemEditor from '../[id]/edit/ItemEditor';

export const dynamic = 'force-dynamic';

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; inventory?: string }>;
}) {
  const params = await searchParams;
  const inventories = await listMyInventories();
  if (inventories.length === 0) {
    // No inventory yet — kick to a setup flow (TODO).
    redirect('/home');
  }
  const targetInventory = params.inventory || inventories[0].id;
  return (
    <ItemEditor
      mode="new"
      initial={{
        name: '',
        category: params.category ?? null,
        inventory_id: targetInventory,
      }}
    />
  );
}
