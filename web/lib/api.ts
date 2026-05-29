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
  CustomCollection,
  Inventory,
  InventoryWithRole,
  Item,
  ItemPerson,
  ItemPersonRole,
  ItemPhoto,
  ItemRevision,
  Person,
  Profile,
  Role,
} from './types';
import { labelForCategory, normalizeCategoryKey } from './categories';

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
  lastUpdatedAt: string | null;
  collectionCount: number;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: me } = await supabase.auth.getUser();
  const myId = me.user?.id;
  if (!myId) {
    return {
      itemCount: 0,
      totalValue: 0,
      totalCurrency: 'USD',
      conservatorCount: 0,
      taggedForSaleCount: 0,
      lastUpdatedAt: null,
      collectionCount: 0,
    };
  }

  // Items I can see (via shares + ownership) — RLS handles the filtering.
  const { data: items } = await supabase
    .from('items')
    .select('value_amount, value_currency, tagged_for_sale, updated_at, category');

  const { count: conservatorCount } = await supabase
    .from('conservators')
    .select('id', { count: 'exact', head: true });

  let totalValue = 0;
  let totalCurrency = 'USD';
  let taggedForSaleCount = 0;
  let lastUpdatedAt: string | null = null;
  const seenCategories = new Set<string>();
  for (const it of items ?? []) {
    if (typeof it.value_amount === 'number') {
      totalValue += it.value_amount;
      totalCurrency = it.value_currency || totalCurrency;
    }
    if (it.tagged_for_sale) taggedForSaleCount += 1;
    if (it.updated_at && (!lastUpdatedAt || it.updated_at > lastUpdatedAt)) {
      lastUpdatedAt = it.updated_at;
    }
    if (it.category) {
      const normalized = normalizeCategoryKey(it.category);
      if (normalized) seenCategories.add(normalized);
    }
  }
  return {
    itemCount: items?.length ?? 0,
    totalValue,
    totalCurrency,
    conservatorCount: conservatorCount ?? 0,
    taggedForSaleCount,
    lastUpdatedAt,
    collectionCount: seenCategories.size,
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
    const key = normalizeCategoryKey(row.category) || 'uncategorized';
    const stat = byKey.get(key) ?? {
      key,
      label: labelForCategory(key),
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

export interface RecentItemWithPhoto extends Item {
  primaryPhotoUrl: string | null;
}

// One query that joins each recent item with its first photo (lowest
// sort_order). Returns the public storage URL so the caller can drop
// it straight into an <img> or next/image.
export async function listRecentItemsWithPhotos(
  limit = 6,
): Promise<RecentItemWithPhoto[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select('*, item_photos(storage_path, sort_order)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const item = row as Item & {
      item_photos?: Array<{ storage_path: string; sort_order: number }>;
    };
    const photos = (item.item_photos ?? []).slice().sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const { item_photos: _drop, ...rest } = item;
    void _drop;
    return {
      ...rest,
      primaryPhotoUrl: photos[0]
        ? photoPublicUrl(photos[0].storage_path)
        : null,
    } as RecentItemWithPhoto;
  });
}

// ---------- Items grouped by collection ----------

export interface CollectionSampleItem {
  id: string;
  name: string;
  primaryPhotoUrl: string | null;
}

export interface CollectionBucket {
  key: string;
  label: string;
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
  sampleItems: CollectionSampleItem[];
}

// One query that pulls every item I can see, normalizes the category
// to a Core 12 key, and buckets them with their primary photo. Used by
// the Collections page so every collection row can render four sample
// thumbnails without firing N queries.
export async function listCollectionsWithSamples(
  samplesPerCollection = 4,
): Promise<CollectionBucket[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select(
      'id, name, category, value_amount, value_currency, created_at, item_photos(storage_path, sort_order)',
    )
    .order('created_at', { ascending: false });
  if (error) throw error;

  const buckets = new Map<string, CollectionBucket>();
  for (const row of data ?? []) {
    const r = row as {
      id: string;
      name: string;
      category: string | null;
      value_amount: number | null;
      value_currency: string | null;
      item_photos?: Array<{ storage_path: string; sort_order: number }>;
    };
    const key = normalizeCategoryKey(r.category) || 'uncategorized';
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        key,
        label: labelForCategory(key),
        itemCount: 0,
        totalValue: 0,
        totalCurrency: r.value_currency || 'USD',
        sampleItems: [],
      };
      buckets.set(key, bucket);
    }
    bucket.itemCount += 1;
    if (typeof r.value_amount === 'number') {
      bucket.totalValue += r.value_amount;
      bucket.totalCurrency = r.value_currency || bucket.totalCurrency;
    }
    if (bucket.sampleItems.length < samplesPerCollection) {
      const photos = (r.item_photos ?? []).slice().sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      bucket.sampleItems.push({
        id: r.id,
        name: r.name,
        primaryPhotoUrl: photos[0]
          ? photoPublicUrl(photos[0].storage_path)
          : null,
      });
    }
  }
  return [...buckets.values()].sort((a, b) => b.itemCount - a.itemCount);
}

// ---------- Cataloging status ----------

export type CatalogingGap =
  | 'needs-photos'
  | 'needs-details'
  | 'needs-provenance'
  | 'needs-valuation'
  | 'complete';

export interface ItemNeedingAttention {
  id: string;
  name: string;
  category: string | null;
  primaryPhotoUrl: string | null;
  gap: CatalogingGap;
}

// Returns the most recent items that still have something to fill in.
// Priority order: photos → details → provenance → valuation. If every
// field is filled, the item is "complete" and never appears here.
export async function listItemsNeedingAttention(
  limit = 4,
): Promise<ItemNeedingAttention[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select(
      'id, name, category, description, notes, provenance, value_amount, updated_at, item_photos(storage_path, sort_order)',
    )
    .order('updated_at', { ascending: false })
    .limit(40);
  if (error) throw error;

  const flagged: ItemNeedingAttention[] = [];
  for (const row of data ?? []) {
    const r = row as {
      id: string;
      name: string;
      category: string | null;
      description: string | null;
      notes: string | null;
      provenance: string | null;
      value_amount: number | null;
      item_photos?: Array<{ storage_path: string; sort_order: number }>;
    };
    const photos = (r.item_photos ?? []).slice().sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const gap = firstGap(r, photos.length);
    if (gap === 'complete') continue;
    flagged.push({
      id: r.id,
      name: r.name,
      category: r.category,
      primaryPhotoUrl: photos[0] ? photoPublicUrl(photos[0].storage_path) : null,
      gap,
    });
    if (flagged.length >= limit) break;
  }
  return flagged;
}

function firstGap(
  item: {
    description: string | null;
    notes: string | null;
    provenance: string | null;
    value_amount: number | null;
  },
  photoCount: number,
): CatalogingGap {
  if (photoCount === 0) return 'needs-photos';
  const hasDetails =
    (item.description && item.description.trim().length > 0) ||
    (item.notes && item.notes.trim().length > 0);
  if (!hasDetails) return 'needs-details';
  if (!item.provenance || item.provenance.trim().length === 0) {
    return 'needs-provenance';
  }
  if (item.value_amount == null) return 'needs-valuation';
  return 'complete';
}

// ---------- Timeline ----------

export interface TimelineEntry {
  id: string;
  name: string;
  year: number;
  acquiredDate: string;
  primaryPhotoUrl: string | null;
}

// Items that have an acquired_date set, ordered oldest → newest, with
// their primary photo joined. Powers the home page's Timeline strip.
export async function listTimelineItems(limit = 6): Promise<TimelineEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select('id, name, acquired_date, item_photos(storage_path, sort_order)')
    .not('acquired_date', 'is', null)
    .order('acquired_date', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      name: string;
      acquired_date: string;
      item_photos?: Array<{ storage_path: string; sort_order: number }>;
    };
    const photos = (r.item_photos ?? []).slice().sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const year = new Date(r.acquired_date).getFullYear();
    return {
      id: r.id,
      name: r.name,
      year,
      acquiredDate: r.acquired_date,
      primaryPhotoUrl: photos[0] ? photoPublicUrl(photos[0].storage_path) : null,
    };
  });
}

// ---------- Shared With ----------

export interface SharedPerson {
  email: string;
  displayName: string | null;
  role: 'owner' | 'contributor' | 'viewer';
}

// People with access to inventories I own — owners (just me), accepted
// shares with their role. Used in the home page "Shared with" card.
export async function listInventoryPeople(): Promise<SharedPerson[]> {
  const supabase = await createSupabaseServerClient();
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return [];

  const myEmail = me.user.email ?? '';
  const myName =
    (me.user.user_metadata?.display_name as string | undefined) ?? null;

  const { data: ownedInv } = await supabase
    .from('inventories')
    .select('id')
    .eq('owner_id', me.user.id);
  const ownedIds = (ownedInv ?? []).map((r) => r.id);
  if (ownedIds.length === 0) {
    return [{ email: myEmail, displayName: myName, role: 'owner' }];
  }

  const { data: shares } = await supabase
    .from('inventory_shares')
    .select('invited_email, role, status, user_id')
    .in('inventory_id', ownedIds)
    .eq('status', 'accepted');

  const sharedUserIds = Array.from(
    new Set(
      (shares ?? [])
        .map((s) => s.user_id)
        .filter((id): id is string => !!id),
    ),
  );
  const namesByEmail = new Map<string, string | null>();
  if (sharedUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name');
    const namesById = new Map<string, string | null>(
      (profiles ?? []).map((p) => [p.id, p.display_name]),
    );
    for (const s of shares ?? []) {
      if (s.user_id) {
        namesByEmail.set(s.invited_email, namesById.get(s.user_id) ?? null);
      }
    }
  }

  const result: SharedPerson[] = [
    { email: myEmail, displayName: myName, role: 'owner' },
  ];
  for (const s of shares ?? []) {
    const r = s as { invited_email: string; role: 'contributor' | 'viewer' };
    if (r.invited_email.toLowerCase() === myEmail.toLowerCase()) continue;
    result.push({
      email: r.invited_email,
      displayName: namesByEmail.get(r.invited_email) ?? null,
      role: r.role,
    });
  }
  return result;
}

// ---------- People & Provenance ----------

export const PEOPLE_PHOTO_BUCKET = 'people-photos';

export function personPhotoPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${base}/storage/v1/object/public/${PEOPLE_PHOTO_BUCKET}/${storagePath}`;
}

export interface PersonWithStats extends Person {
  itemCount: number;
  primaryPhotoUrl: string | null;
}

export async function listPeople(): Promise<PersonWithStats[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('people')
    .select('*, item_people(id)')
    .order('first_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Person & { item_people?: Array<{ id: string }> };
    const { item_people: links, ...person } = r;
    return {
      ...person,
      itemCount: links?.length ?? 0,
      primaryPhotoUrl: person.profile_photo_path
        ? personPhotoPublicUrl(person.profile_photo_path)
        : null,
    } as PersonWithStats;
  });
}

export async function getPerson(id: string): Promise<Person | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Person | null;
}

export interface PersonItemSummary {
  id: string;
  name: string;
  category: string | null;
  role: ItemPersonRole;
  primaryPhotoUrl: string | null;
}

// All items associated with a person, with their role and first photo.
export async function listPersonItems(personId: string): Promise<PersonItemSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('item_people')
    .select(
      'role, items!inner(id, name, category, item_photos(storage_path, sort_order))',
    )
    .eq('person_id', personId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as unknown as {
      role: ItemPersonRole;
      items:
        | {
            id: string;
            name: string;
            category: string | null;
            item_photos?: Array<{ storage_path: string; sort_order: number }>;
          }
        | {
            id: string;
            name: string;
            category: string | null;
            item_photos?: Array<{ storage_path: string; sort_order: number }>;
          }[];
    };
    // Supabase types !inner joins as array even though our FK is N-to-1.
    const item = Array.isArray(r.items) ? r.items[0] : r.items;
    const photos = (item.item_photos ?? []).slice().sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      role: r.role,
      primaryPhotoUrl: photos[0]
        ? photoPublicUrl(photos[0].storage_path)
        : null,
    };
  });
}

// People associated with a given item.
export interface ItemPersonRow {
  link: ItemPerson;
  person: Person;
}

export async function listItemPeople(itemId: string): Promise<ItemPersonRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('item_people')
    .select('*, people!inner(*)')
    .eq('item_id', itemId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as ItemPerson & { people: Person };
    const { people: person, ...link } = r;
    return { link, person };
  });
}

// ---------- Custom Collections ----------

export const CUSTOM_COLLECTION_PHOTO_BUCKET = 'custom-collection-photos';

export function customCollectionImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${base}/storage/v1/object/public/${CUSTOM_COLLECTION_PHOTO_BUCKET}/${storagePath}`;
}

export interface CustomCollectionWithStats extends CustomCollection {
  itemCount: number;
  imageUrl: string | null;
}

export async function listMyCustomCollections(): Promise<
  CustomCollectionWithStats[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('custom_collections')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as CustomCollection[];
  if (rows.length === 0) return [];

  // Count items per custom collection in a single query.
  const ids = rows.map((r) => r.id);
  const { data: itemRows } = await supabase
    .from('items')
    .select('category')
    .in('category', ids);
  const counts = new Map<string, number>();
  for (const r of itemRows ?? []) {
    if (!r.category) continue;
    counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  }

  return rows.map((r) => ({
    ...r,
    itemCount: counts.get(r.id) ?? 0,
    imageUrl: r.image_path ? customCollectionImageUrl(r.image_path) : null,
  }));
}

export async function getCustomCollection(
  id: string,
): Promise<CustomCollection | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('custom_collections')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as CustomCollection | null) ?? null;
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
