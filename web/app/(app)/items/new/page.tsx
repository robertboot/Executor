import { redirect } from 'next/navigation';
import { getMyDefaultInventory, listMyCollectionsRich } from '@/lib/api';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { findArchetype, findSubCategory, type SubCategory } from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';
import ItemEditor from '../[id]/edit/ItemEditor';
import PickerView from './PickerView';

export const dynamic = 'force-dynamic';

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; inventory?: string }>;
}) {
  const params = await searchParams;
  const inventory = await getMyDefaultInventory();
  if (!inventory) {
    redirect('/home');
  }
  const targetInventory = params.inventory || inventory.id;

  // Category already chosen — go straight to the form.
  if (params.category) {
    return (
      <ItemEditor
        mode="new"
        initial={{
          name: '',
          category: params.category,
          inventory_id: targetInventory,
        }}
      />
    );
  }

  // Otherwise, gate behind a collection picker so the user lands on
  // one of their own collections before filling out fields.
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const [profileRes, collectionsStats] = await Promise.all([
    user
      ? supabase
          .from('profiles')
          .select('archetype, selected_collections')
          .eq('id', user.id)
          .maybeSingle()
          .then((res) => res, () => ({ data: null }))
      : Promise.resolve({ data: null }),
    listMyCollectionsRich(),
  ]);

  const profile = (profileRes?.data ?? null) as {
    archetype: OnboardingArchetype | null;
    selected_collections: string[] | null;
  } | null;

  const archetype = findArchetype(profile?.archetype);

  // Pull the user's selected sub-categories (any archetype), dedupe by
  // label so the same sub-cat doesn't render twice if it appears under
  // two archetypes.
  const selectedKeys = profile?.selected_collections ?? [];
  const subCats: SubCategory[] = [];
  const seen = new Set<string>();
  for (const k of selectedKeys) {
    const sub = findSubCategory(k);
    if (!sub) continue;
    if (seen.has(sub.key)) continue;
    seen.add(sub.key);
    subCats.push(sub);
  }

  const itemCountByCoreKey = new Map<string, number>();
  for (const c of collectionsStats) itemCountByCoreKey.set(c.key, c.itemCount);

  return (
    <PickerView
      subCats={subCats}
      archetype={archetype}
      inventoryId={targetInventory}
      itemCountByCoreKey={itemCountByCoreKey}
    />
  );
}
