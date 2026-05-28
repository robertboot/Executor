// Server-side data access. Each function creates its own Supabase server
// client so it inherits the request's cookies + auth context. Call these
// directly from server components, server actions, or route handlers.
//
// Mirrors the surface of the Expo /lib/api.ts but tuned for SSR — no
// React state, no AsyncStorage, all queries return promises.

import { createSupabaseServerClient } from './supabase/server';
import type {
  CollectionWithStats,
  Conservator,
  Inventory,
  InventoryWithRole,
  Item,
  ItemPhoto,
  ItemRevision,
  Profile,
  Role,
} from './types';
import { labelForCategory } from './categories';

// ---------- Inventories ----------

export async function listMyInventories(): Promise<InventoryWithRole[]> {
  const supabase = await createSupabaseServerClient();
  const { data: me } = await supabase.auth.getUser();
  const myId = me.user?.id;
  if (!myId) return [];

  const { data: owned, error: oErr } = await supabase
    .from('inventories')
    .select('*')
    .eq('owner_id', myId)
    .order('created_at', { ascending: false });
  if (oErr) throw oErr;

  const { data: sharedRows, error: sErr } = await supabase
    .from('inventory_shares')
    .select('role, inventory:inventories(*)')
    .eq('user_id', myId)
    .eq('status', 'accepted');
  if (sErr) throw sErr;

  const ownerList: InventoryWithRole[] = (owned ?? []).map((inv) => ({
    ...(inv as Inventory),
    role: 'owner' as const,
  }));
  const sharedList: InventoryWithRole[] = [];
  for (const s of (sharedRows ?? []) as Array<{ role: Role; inventory: Inventory | Inventory[] | null }>) {
    const inv = Array.isArray(s.inventory) ? s.inventory[0] : s.inventory;
    if (inv) sharedList.push({ ...inv, role: s.role });
  }
  return [...ownerList, ...sharedList];
}

export async function getInventory(id: string): Promise<Inventory | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- Items ----------

export async function listItems(inventoryId: string): Promise<Item[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Item[];
}

export async function getItem(id: string): Promise<Item | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getItemByPublicId(publicId: string): Promise<Item | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('public_id', publicId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- Photos ----------

export async function listPhotos(itemId: string): Promise<ItemPhoto[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('item_photos')
    .select('*')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ItemPhoto[];
}

export const PHOTO_BUCKET = 'item-photos';

export function photoPublicUrl(storagePath: string): string {
  // Storage buckets in Heirloom are public-read. Build the URL directly so
  // we don't need a Supabase round-trip per photo. `storage_path` is stored
  // without the bucket prefix; the bucket is part of the Supabase URL.
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${storagePath}`;
}

// ---------- Conservators ----------

export async function listConservators(): Promise<Conservator[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('conservators')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Conservator[];
}

// ---------- Aggregates ----------

export async function dashboardStats(): Promise<{
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
  conservatorCount: number;
  taggedForSaleCount: number;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: me } = await supabase.auth.getUser();
  const myId = me.user?.id;
  if (!myId) {
    return { itemCount: 0, totalValue: 0, totalCurrency: 'USD', conservatorCount: 0, taggedForSaleCount: 0 };
  }

  // Items I can see (via shares + ownership) — RLS handles the filtering.
  const { data: items } = await supabase
    .from('items')
    .select('value_amount, value_currency, tagged_for_sale');

  const { count: conservatorCount } = await supabase
    .from('conservators')
    .select('id', { count: 'exact', head: true });

  let totalValue = 0;
  let totalCurrency = 'USD';
  let taggedForSaleCount = 0;
  for (const it of items ?? []) {
    if (typeof it.value_amount === 'number') {
      totalValue += it.value_amount;
      totalCurrency = it.value_currency || totalCurrency;
    }
    if (it.tagged_for_sale) taggedForSaleCount += 1;
  }
  return {
    itemCount: items?.length ?? 0,
    totalValue,
    totalCurrency,
    conservatorCount: conservatorCount ?? 0,
    taggedForSaleCount,
  };
}

export async function listMyCollectionsRich(): Promise<CollectionWithStats[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select('category, value_amount, value_currency');
  if (error) throw error;

  const byKey = new Map<string, CollectionWithStats>();
  for (const row of data ?? []) {
    const key = row.category || 'uncategorized';
    const stat = byKey.get(key) ?? {
      key,
      label: labelForCategory(row.category),
      itemCount: 0,
      totalValue: 0,
      totalCurrency: row.value_currency || 'USD',
    };
    stat.itemCount += 1;
    if (typeof row.value_amount === 'number') {
      stat.totalValue += row.value_amount;
      stat.totalCurrency = row.value_currency || stat.totalCurrency;
    }
    byKey.set(key, stat);
  }
  return [...byKey.values()].sort((a, b) => b.itemCount - a.itemCount);
}

export async function listRecentItems(limit = 6): Promise<Item[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Item[];
}

// ---------- Profile ----------

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- Revisions ----------

export async function listRevisions(itemId: string): Promise<ItemRevision[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('item_revisions')
    .select('*')
    .eq('item_id', itemId)
    .order('changed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ItemRevision[];
}
