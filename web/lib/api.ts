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
  ConservatorPermissionLevel,
  CustomCollection,
  Inheritor,
  InheritorStatus,
  Inventory,
  Item,
  ItemPerson,
  ItemPersonRole,
  ItemPhoto,
  ItemRevision,
  Person,
  Profile,
} from './types';
import { CATEGORY_PRESETS, labelForCategory, normalizeCategoryKey } from './categories';
import { findSubCategory } from './onboarding';

// ---------- Inventories ----------

// Returns the signed-in user's first owned inventory (sorted oldest
// first). Used as the "default archive" for entry points that need to
// pick an inventory id without surfacing a chooser.
export async function getMyDefaultInventory(): Promise<Inventory | null> {
  const supabase = await createSupabaseServerClient();
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return null;
  const { data, error } = await supabase
    .from('inventories')
    .select('*')
    .eq('owner_id', me.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Inventory | null) ?? null;
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

export interface ConservatorWithPhoto extends Conservator {
  primaryPhotoUrl: string | null;
}

export async function listConservators(): Promise<ConservatorWithPhoto[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('conservators')
    .select(
      '*, person:people(profile_photo_path, first_name, middle_name, last_name)',
    )
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Conservator & {
      person?: {
        profile_photo_path: string | null;
        first_name: string;
        middle_name: string | null;
        last_name: string | null;
      } | null;
    };
    const linked = r.person ?? null;
    const linkedName = linked
      ? [linked.first_name, linked.middle_name, linked.last_name]
          .filter((s) => s && s.trim().length > 0)
          .join(' ')
          .trim()
      : null;
    const out: ConservatorWithPhoto = {
      ...r,
      // Prefer the linked Legacy Person's full name when set.
      name: linkedName || r.name,
      // profile_photo_path stays as-is (pointing into the
      // conservator-photos bucket for legacy standalone uploads).
      primaryPhotoUrl: resolveConservatorPhotoUrl(
        r.profile_photo_path,
        linked?.profile_photo_path ?? null,
      ),
    };
    delete (out as { person?: unknown }).person;
    return out;
  });
}

// ---------- Aggregates ----------

export async function dashboardStats(): Promise<{
  itemCount: number;
  totalValue: number;
  totalCurrency: string;
  peopleCount: number;
  inheritorCount: number;
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
      peopleCount: 0,
      inheritorCount: 0,
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

  const [
    { count: peopleCount },
    { count: inheritorCount },
    { count: conservatorCount },
  ] = await Promise.all([
    supabase.from('people').select('id', { count: 'exact', head: true }),
    supabase.from('inheritors').select('id', { count: 'exact', head: true }),
    supabase.from('conservators').select('id', { count: 'exact', head: true }),
  ]);

  // Profile's selected sub-categories — empty collections still count.
  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_collections')
    .eq('id', myId)
    .maybeSingle();
  const selected: string[] =
    (profile?.selected_collections as string[] | null | undefined) ?? [];

  // selected_collections holds both Core 12 parent keys AND sub-cat
  // keys. The "Collections" stat means user-facing collections, so
  // count just the sub-cats (the parent core keys are groupings, not
  // collections themselves).
  const coreKeys = new Set(CATEGORY_PRESETS.map((c) => c.key));
  const selectedSubCatCount = selected.filter((k) => !coreKeys.has(k)).length;

  // Plus any custom collections the user has created.
  const { count: customCollectionCount } = await supabase
    .from('custom_collections')
    .select('id', { count: 'exact', head: true });

  let totalValue = 0;
  let totalCurrency = 'USD';
  let taggedForSaleCount = 0;
  let lastUpdatedAt: string | null = null;
  for (const it of items ?? []) {
    if (typeof it.value_amount === 'number') {
      totalValue += it.value_amount;
      totalCurrency = it.value_currency || totalCurrency;
    }
    if (it.tagged_for_sale) taggedForSaleCount += 1;
    if (it.updated_at && (!lastUpdatedAt || it.updated_at > lastUpdatedAt)) {
      lastUpdatedAt = it.updated_at;
    }
  }
  return {
    itemCount: items?.length ?? 0,
    totalValue,
    totalCurrency,
    peopleCount: peopleCount ?? 0,
    inheritorCount: inheritorCount ?? 0,
    conservatorCount: conservatorCount ?? 0,
    taggedForSaleCount,
    lastUpdatedAt,
    collectionCount: selectedSubCatCount + (customCollectionCount ?? 0),
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

// Lightweight directory for the "Link to a Legacy Person" picker on
// the Inheritor and Conservator forms.
export interface PersonPickerEntry {
  id: string;
  displayName: string;
  relationship: string | null;
  photoUrl: string | null;
}

export async function listPeoplePicker(): Promise<PersonPickerEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('people')
    .select('id, first_name, middle_name, last_name, relationship, profile_photo_path')
    .order('first_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      first_name: string;
      middle_name: string | null;
      last_name: string | null;
      relationship: string | null;
      profile_photo_path: string | null;
    };
    const name = [r.first_name, r.middle_name, r.last_name]
      .filter((s) => s && s.trim().length > 0)
      .join(' ')
      .trim();
    return {
      id: r.id,
      displayName: name || 'Unnamed',
      relationship: r.relationship,
      photoUrl: r.profile_photo_path
        ? personPhotoPublicUrl(r.profile_photo_path)
        : null,
    };
  });
}

// Ensures a Legacy Person row exists for the given contributor row.
// - If currentPersonId is set, returns it (already linked).
// - Otherwise creates a new person row using the supplied displayName
//   as first_name (callers can split it themselves if they have
//   structured fields). Returns the new id.
//
// Used by the Inheritor / Conservator actions when the user checks
// "Also save as Legacy Person" on the cross-role toggle section.
export async function ensureLinkedPerson(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  currentPersonId: string | null,
  displayName: string,
  extras?: {
    email?: string | null;
    relationship?: string | null;
    profilePhotoPath?: string | null;
  },
): Promise<string> {
  if (currentPersonId) return currentPersonId;
  const trimmed = displayName.trim();
  if (!trimmed) {
    throw new Error('Cannot create a Legacy Person without a name.');
  }
  // Split into first / last on the first whitespace so common names
  // ("Sarah Boot") land in the right columns. Single-word names go in
  // first_name only.
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] ?? trimmed;
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
  const { data, error } = await supabase
    .from('people')
    .insert({
      owner_id: userId,
      first_name: firstName,
      last_name: lastName,
      email: extras?.email ?? null,
      relationship: extras?.relationship ?? null,
      profile_photo_path: extras?.profilePhotoPath ?? null,
    })
    .select('id')
    .single();
  if (error) {
    throw new Error(`Failed to auto-create Legacy Person: ${error.message}`);
  }
  return (data as { id: string }).id;
}

// Returns which contributor roles the given person already holds.
// Used by the Person edit form so the role toggles can pre-fill.
export interface PersonRoleSummary {
  inheritor: { id: string; status: InheritorStatus } | null;
  conservator: { id: string; permission_level: ConservatorPermissionLevel } | null;
}

export async function getPersonRoles(
  personId: string,
): Promise<PersonRoleSummary> {
  const supabase = await createSupabaseServerClient();
  const [{ data: inh }, { data: con }] = await Promise.all([
    supabase
      .from('inheritors')
      .select('id, status')
      .eq('person_id', personId)
      .maybeSingle(),
    supabase
      .from('conservators')
      .select('id, permission_level')
      .eq('person_id', personId)
      .maybeSingle(),
  ]);
  return {
    inheritor: inh
      ? { id: (inh as { id: string }).id, status: (inh as { status: InheritorStatus }).status }
      : null,
    conservator: con
      ? {
          id: (con as { id: string }).id,
          permission_level: (con as { permission_level: ConservatorPermissionLevel })
            .permission_level,
        }
      : null,
  };
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

// ---------- Conservator photos ----------

export const CONSERVATOR_PHOTO_BUCKET = 'conservator-photos';

export function conservatorPhotoUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${base}/storage/v1/object/public/${CONSERVATOR_PHOTO_BUCKET}/${storagePath}`;
}

export async function getConservator(
  id: string,
): Promise<ConservatorWithPhoto | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('conservators')
    .select('*, person:people(profile_photo_path)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Conservator & {
    person?: { profile_photo_path: string | null } | null;
  };
  const linkedPhoto = row.person?.profile_photo_path ?? null;
  const out: ConservatorWithPhoto = {
    ...(row as Conservator),
    primaryPhotoUrl: resolveConservatorPhotoUrl(
      row.profile_photo_path,
      linkedPhoto,
    ),
  };
  delete (out as { person?: unknown }).person;
  return out;
}

// ---------- Inheritors ----------

export const INHERITOR_PHOTO_BUCKET = 'inheritor-photos';

export function inheritorPhotoUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${base}/storage/v1/object/public/${INHERITOR_PHOTO_BUCKET}/${storagePath}`;
}

export interface InheritorWithStats extends Inheritor {
  itemCount: number;
  collectionCount: number;
  totalValue: number;
  totalCurrency: string;
  primaryPhotoUrl: string | null;
}

export async function listInheritors(): Promise<InheritorWithStats[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inheritors')
    .select(
      '*, person:people(profile_photo_path, first_name, middle_name, last_name, email)',
    )
    .order('created_at', { ascending: false });
  if (error) throw error;

  type Row = Inheritor & {
    person?: {
      profile_photo_path: string | null;
      first_name: string;
      middle_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
  };
  const raw = (data ?? []) as Row[];
  // Keep the linked person's photo path alongside each row so we can
  // build the avatar URL with the right bucket later. The row's own
  // profile_photo_path is left intact (still pointing into the
  // inheritor-photos bucket for legacy standalone uploads).
  const linkedPhotoByRow = new Map<string, string | null>();
  const rows: Inheritor[] = raw.map((r) => {
    const linked = r.person ?? null;
    const linkedName = linked
      ? [linked.first_name, linked.middle_name, linked.last_name]
          .filter((s) => s && s.trim().length > 0)
          .join(' ')
          .trim()
      : null;
    linkedPhotoByRow.set(r.id, linked?.profile_photo_path ?? null);
    const merged: Inheritor = {
      ...(r as Inheritor),
      display_name: linkedName || r.display_name,
      email: linked?.email ?? r.email,
    };
    delete (merged as { person?: unknown }).person;
    return merged;
  });
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  // One pass to count items and sum value per inheritor.
  const { data: items } = await supabase
    .from('items')
    .select(
      'designated_inheritor_id, alternate_inheritor_id, value_amount, value_currency',
    )
    .or(
      ids
        .map(
          (id) =>
            `designated_inheritor_id.eq.${id},alternate_inheritor_id.eq.${id}`,
        )
        .join(','),
    );

  const itemCount = new Map<string, number>();
  const totalValue = new Map<string, number>();
  const currencies = new Map<string, string>();
  for (const it of items ?? []) {
    const r = it as {
      designated_inheritor_id: string | null;
      alternate_inheritor_id: string | null;
      value_amount: number | null;
      value_currency: string | null;
    };
    const ids = [r.designated_inheritor_id, r.alternate_inheritor_id].filter(
      Boolean,
    ) as string[];
    for (const inheritorId of ids) {
      itemCount.set(inheritorId, (itemCount.get(inheritorId) ?? 0) + 1);
      if (typeof r.value_amount === 'number' && r.designated_inheritor_id === inheritorId) {
        totalValue.set(
          inheritorId,
          (totalValue.get(inheritorId) ?? 0) + r.value_amount,
        );
      }
      if (r.value_currency && !currencies.has(inheritorId)) {
        currencies.set(inheritorId, r.value_currency);
      }
    }
  }

  // Custom collections assigned to each inheritor.
  const { data: coll } = await supabase
    .from('custom_collections')
    .select('designated_inheritor_id, alternate_inheritor_id')
    .or(
      ids
        .map(
          (id) =>
            `designated_inheritor_id.eq.${id},alternate_inheritor_id.eq.${id}`,
        )
        .join(','),
    );
  const collectionCount = new Map<string, number>();
  for (const c of coll ?? []) {
    const r = c as {
      designated_inheritor_id: string | null;
      alternate_inheritor_id: string | null;
    };
    for (const inheritorId of [
      r.designated_inheritor_id,
      r.alternate_inheritor_id,
    ].filter(Boolean) as string[]) {
      collectionCount.set(
        inheritorId,
        (collectionCount.get(inheritorId) ?? 0) + 1,
      );
    }
  }

  return rows.map((r) => ({
    ...r,
    itemCount: itemCount.get(r.id) ?? 0,
    collectionCount: collectionCount.get(r.id) ?? 0,
    totalValue: totalValue.get(r.id) ?? 0,
    totalCurrency: currencies.get(r.id) ?? 'USD',
    primaryPhotoUrl: resolveInheritorPhotoUrl(
      r.profile_photo_path,
      linkedPhotoByRow.get(r.id) ?? null,
    ),
  }));
}

// Resolve the right public URL for an Inheritor / Conservator row's
// avatar. Photos are stored in whichever bucket they were uploaded
// to: the role-specific bucket for standalone uploads, or the
// people-photos bucket when the linked Legacy Person has its own
// photo. We pick by whichever source actually has a non-null path
// rather than by whether person_id happens to be set, so retro-
// fitting a link onto a row with an existing role-bucket photo
// doesn't break the avatar.
export function resolveInheritorPhotoUrl(
  rowPhotoPath: string | null,
  linkedPersonPhotoPath: string | null,
): string | null {
  if (linkedPersonPhotoPath) return personPhotoPublicUrl(linkedPersonPhotoPath);
  if (rowPhotoPath) return inheritorPhotoUrl(rowPhotoPath);
  return null;
}

export function resolveConservatorPhotoUrl(
  rowPhotoPath: string | null,
  linkedPersonPhotoPath: string | null,
): string | null {
  if (linkedPersonPhotoPath) return personPhotoPublicUrl(linkedPersonPhotoPath);
  if (rowPhotoPath) return conservatorPhotoUrl(rowPhotoPath);
  return null;
}

export interface InheritorWithPhoto extends Inheritor {
  primaryPhotoUrl: string | null;
}

export async function getInheritor(id: string): Promise<InheritorWithPhoto | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inheritors')
    .select('*, person:people(profile_photo_path)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Inheritor & {
    person?: { profile_photo_path: string | null } | null;
  };
  const linkedPhoto = row.person?.profile_photo_path ?? null;
  const out: InheritorWithPhoto = {
    ...(row as Inheritor),
    primaryPhotoUrl: resolveInheritorPhotoUrl(
      row.profile_photo_path,
      linkedPhoto,
    ),
  };
  delete (out as { person?: unknown }).person;
  return out;
}

// All items assigned to a given inheritor (designated OR alternate).
export interface InheritorAssignment {
  itemId: string;
  itemName: string;
  itemCategory: string | null;
  role: 'designated' | 'alternate';
  primaryPhotoUrl: string | null;
  valueAmount: number | null;
  valueCurrency: string;
}

export async function listInheritorAssignments(
  inheritorId: string,
): Promise<InheritorAssignment[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('items')
    .select(
      'id, name, category, value_amount, value_currency, designated_inheritor_id, alternate_inheritor_id, item_photos(storage_path, sort_order)',
    )
    .or(
      `designated_inheritor_id.eq.${inheritorId},alternate_inheritor_id.eq.${inheritorId}`,
    )
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      name: string;
      category: string | null;
      value_amount: number | null;
      value_currency: string;
      designated_inheritor_id: string | null;
      alternate_inheritor_id: string | null;
      item_photos?: Array<{ storage_path: string; sort_order: number }>;
    };
    const photos = (r.item_photos ?? []).slice().sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      itemId: r.id,
      itemName: r.name,
      itemCategory: r.category,
      role:
        r.designated_inheritor_id === inheritorId
          ? ('designated' as const)
          : ('alternate' as const),
      primaryPhotoUrl: photos[0]
        ? photoPublicUrl(photos[0].storage_path)
        : null,
      valueAmount: r.value_amount,
      valueCurrency: r.value_currency,
    };
  });
}

export async function listInheritorsLight(): Promise<Inheritor[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inheritors')
    .select('*')
    .order('display_name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Inheritor[];
}

// ---------- Available collections (dropdown) ----------

export interface AvailableCollection {
  // The string we put into items.category (Core 12 key for curated
  // sub-cats, UUID for custom collections).
  key: string;
  label: string;
  itemCount: number;
  iconUrl: string | null;
  isCustom: boolean;
}

// Combines the user's selected curated sub-cats and their custom
// collections into a single flat list suitable for the "Collection"
// dropdown in the item editor. Deduped by category key.
export async function listMyAvailableCollections(): Promise<
  AvailableCollection[]
> {
  const supabase = await createSupabaseServerClient();
  const { data: me } = await supabase.auth.getUser();
  const myId = me.user?.id;
  if (!myId) return [];

  const [{ data: profile }, { data: items }, customs] = await Promise.all([
    supabase
      .from('profiles')
      .select('selected_collections')
      .eq('id', myId)
      .maybeSingle(),
    supabase.from('items').select('category'),
    listMyCustomCollections(),
  ]);

  const selected: string[] =
    (profile?.selected_collections as string[] | null | undefined) ?? [];
  const coreKeys = new Set(CATEGORY_PRESETS.map((c) => c.key));
  const subCatKeys = selected.filter((k) => !coreKeys.has(k));

  const counts = new Map<string, number>();
  for (const it of items ?? []) {
    if (!it.category) continue;
    counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
  }

  const result: AvailableCollection[] = [];
  const seen = new Set<string>();

  for (const k of subCatKeys) {
    const s = findSubCategory(k);
    if (!s) continue;
    if (seen.has(s.parent)) continue;
    seen.add(s.parent);
    result.push({
      key: s.parent,
      label: s.label,
      itemCount: counts.get(s.parent) ?? 0,
      iconUrl: s.bgImage,
      isCustom: false,
    });
  }

  for (const c of customs) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    result.push({
      key: c.id,
      label: c.name,
      itemCount: c.itemCount,
      iconUrl: c.imageUrl,
      isCustom: true,
    });
  }

  return result;
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
