import { decode as decodeBase64 } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type {
  ExecutorAccessLogEntry,
  ExecutorCode,
  Inventory,
  InventoryShare,
  InventoryWithRole,
  Item,
  ItemPhoto,
  ItemRevision,
  Profile,
  Role,
} from './types';

// =========================================================================
// Inventories
// =========================================================================

export async function listMyInventories(): Promise<InventoryWithRole[]> {
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
  // Supabase embeds may type as an array even for one-to-one; normalize.
  const sharedList: InventoryWithRole[] = [];
  for (const s of (sharedRows ?? []) as Array<{ role: Role; inventory: Inventory | Inventory[] | null }>) {
    const inv = Array.isArray(s.inventory) ? s.inventory[0] : s.inventory;
    if (inv) sharedList.push({ ...inv, role: s.role });
  }
  return [...ownerList, ...sharedList];
}

export async function getInventory(id: string): Promise<Inventory | null> {
  const { data, error } = await supabase
    .from('inventories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getInventoryRole(
  inventoryId: string,
): Promise<'owner' | Role | null> {
  const { data: me } = await supabase.auth.getUser();
  const myId = me.user?.id;
  if (!myId) return null;
  const { data: inv } = await supabase
    .from('inventories')
    .select('owner_id')
    .eq('id', inventoryId)
    .maybeSingle();
  if (inv?.owner_id === myId) return 'owner';
  const { data: share } = await supabase
    .from('inventory_shares')
    .select('role')
    .eq('inventory_id', inventoryId)
    .eq('user_id', myId)
    .eq('status', 'accepted')
    .maybeSingle();
  return (share?.role as Role | undefined) ?? null;
}

export async function createInventory(name: string, description: string | null) {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('inventories')
    .insert({ name, description, owner_id: me.user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Inventory;
}

export async function updateInventory(id: string, patch: Partial<Inventory>) {
  const { error } = await supabase.from('inventories').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteInventory(id: string) {
  const { error } = await supabase.from('inventories').delete().eq('id', id);
  if (error) throw error;
}

// =========================================================================
// Items
// =========================================================================

export type ItemSort = 'recent' | 'name' | 'value_desc' | 'value_asc';

export interface ItemListOptions {
  search?: string;
  category?: string;
  sort?: ItemSort;
}

export async function listItems(
  inventoryId: string,
  opts: ItemListOptions = {},
): Promise<Item[]> {
  let q = supabase.from('items').select('*').eq('inventory_id', inventoryId);
  switch (opts.sort ?? 'recent') {
    case 'name':
      q = q.order('name', { ascending: true });
      break;
    case 'value_desc':
      q = q.order('value_amount', { ascending: false, nullsFirst: false });
      break;
    case 'value_asc':
      q = q.order('value_amount', { ascending: true, nullsFirst: false });
      break;
    case 'recent':
    default:
      q = q.order('created_at', { ascending: false });
      break;
  }
  if (opts.category) q = q.eq('category', opts.category);
  if (opts.search && opts.search.trim()) {
    const s = `%${opts.search.trim()}%`;
    q = q.or(`name.ilike.${s},description.ilike.${s},notes.ilike.${s}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Item[];
}

export async function getItem(id: string): Promise<Item | null> {
  const { data, error } = await supabase.from('items').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Item | null;
}

export type ItemDraft = Omit<
  Partial<Item>,
  'id' | 'public_id' | 'created_at' | 'updated_at' | 'created_by'
>;

export async function createItem(
  inventoryId: string,
  draft: ItemDraft,
): Promise<Item> {
  const { data: me } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('items')
    .insert({
      ...draft,
      inventory_id: inventoryId,
      created_by: me.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Item;
}

export async function updateItem(id: string, patch: ItemDraft): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Item;
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

export async function inventoryTotalValue(inventoryId: string): Promise<{
  total: number;
  currency: string;
}> {
  const { data, error } = await supabase
    .from('items')
    .select('value_amount, value_currency')
    .eq('inventory_id', inventoryId);
  if (error) throw error;
  let total = 0;
  let currency = 'USD';
  for (const row of data ?? []) {
    if (row.value_amount != null) {
      total += Number(row.value_amount);
      currency = row.value_currency || currency;
    }
  }
  return { total, currency };
}

// =========================================================================
// Photos
// =========================================================================

export async function listPhotos(itemId: string): Promise<ItemPhoto[]> {
  const { data, error } = await supabase
    .from('item_photos')
    .select('*')
    .eq('item_id', itemId)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as ItemPhoto[];
}

export function photoPublicUrl(storagePath: string): string {
  return supabase.storage.from('item-photos').getPublicUrl(storagePath).data.publicUrl;
}

export async function uploadPhoto(args: {
  inventoryId: string;
  itemId: string;
  base64: string;
  mimeType?: string;
  caption?: string;
}): Promise<ItemPhoto> {
  const ext = (args.mimeType ?? 'image/jpeg').split('/')[1] || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${args.inventoryId}/${args.itemId}/${fileName}`;
  const bytes = decodeBase64(args.base64);
  const { error: upErr } = await supabase.storage
    .from('item-photos')
    .upload(storagePath, bytes, { contentType: args.mimeType ?? 'image/jpeg' });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from('item_photos')
    .insert({
      item_id: args.itemId,
      storage_path: storagePath,
      caption: args.caption ?? null,
      sort_order: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ItemPhoto;
}

export async function deletePhoto(photo: ItemPhoto) {
  await supabase.storage.from('item-photos').remove([photo.storage_path]);
  const { error } = await supabase.from('item_photos').delete().eq('id', photo.id);
  if (error) throw error;
}

// =========================================================================
// Revisions
// =========================================================================

export async function listRevisions(itemId: string): Promise<ItemRevision[]> {
  const { data, error } = await supabase
    .from('item_revisions')
    .select('*')
    .eq('item_id', itemId)
    .order('changed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ItemRevision[];
}

export async function restoreRevision(revisionId: string): Promise<Item> {
  const { data, error } = await supabase.rpc('restore_item_revision', {
    p_revision_id: revisionId,
  });
  if (error) throw error;
  return data as Item;
}

// =========================================================================
// Sharing
// =========================================================================

export async function listShares(inventoryId: string): Promise<InventoryShare[]> {
  const { data, error } = await supabase
    .from('inventory_shares')
    .select('*')
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as InventoryShare[];
}

export async function inviteToInventory(
  inventoryId: string,
  email: string,
  role: Role,
): Promise<InventoryShare> {
  const { data: me } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('inventory_shares')
    .insert({
      inventory_id: inventoryId,
      invited_email: email.trim().toLowerCase(),
      role,
      invited_by: me.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as InventoryShare;
}

export async function updateShareRole(shareId: string, role: Role) {
  const { error } = await supabase
    .from('inventory_shares')
    .update({ role })
    .eq('id', shareId);
  if (error) throw error;
}

export async function revokeShare(shareId: string) {
  const { error } = await supabase.from('inventory_shares').delete().eq('id', shareId);
  if (error) throw error;
}

export async function listMyPendingInvites(): Promise<InventoryShare[]> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user?.email) return [];
  const { data, error } = await supabase
    .from('inventory_shares')
    .select('*')
    .eq('status', 'pending')
    .ilike('invited_email', me.user.email);
  if (error) throw error;
  return (data ?? []) as InventoryShare[];
}

export async function acceptShareInvite(shareId: string): Promise<InventoryShare> {
  const { data, error } = await supabase.rpc('accept_share_invite', { share_id: shareId });
  if (error) throw error;
  return data as InventoryShare;
}

// =========================================================================
// Executor codes
// =========================================================================

export async function listExecutorCodes(inventoryId: string): Promise<ExecutorCode[]> {
  const { data, error } = await supabase
    .from('executor_codes')
    .select('*')
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExecutorCode[];
}

export async function createExecutorCode(
  inventoryId: string,
  label: string,
  plainCode: string,
): Promise<ExecutorCode> {
  const { data, error } = await supabase.rpc('create_executor_code', {
    p_inventory_id: inventoryId,
    p_label: label,
    p_plain_code: plainCode,
  });
  if (error) throw error;
  return data as ExecutorCode;
}

export async function revokeExecutorCode(codeId: string) {
  const { error } = await supabase
    .from('executor_codes')
    .update({ revoked: true })
    .eq('id', codeId);
  if (error) throw error;
}

export async function listExecutorAccessLog(
  inventoryId: string,
): Promise<ExecutorAccessLogEntry[]> {
  const { data: codes } = await supabase
    .from('executor_codes')
    .select('id')
    .eq('inventory_id', inventoryId);
  const ids = (codes ?? []).map((c: { id: string }) => c.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('executor_access_log')
    .select('*')
    .in('executor_code_id', ids)
    .order('accessed_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ExecutorAccessLogEntry[];
}

// =========================================================================
// Profiles
// =========================================================================

// =========================================================================
// Demo / sample inventory
// =========================================================================

interface DemoItem {
  name: string;
  category: string;
  description: string;
  condition?: string;
  location?: string;
  value_amount: number;
  provenance?: string;
  intended_recipient_name?: string;
  bequest_notes?: string;
  custom_fields: Record<string, unknown>;
}

const DEMO_ITEMS: DemoItem[] = [
  {
    name: 'First-edition Foundation',
    category: 'books',
    description: 'Isaac Asimov, Gnome Press 1951. Hardcover, original dust jacket.',
    condition: 'Very good',
    location: 'Living room — top shelf',
    value_amount: 1800,
    provenance: 'Bought at the Estate auction in Boston, 2002.',
    intended_recipient_name: 'My niece Sara',
    bequest_notes: 'Sara has loved this book since she was 14. Please make sure she gets it.',
    custom_fields: {
      author: 'Isaac Asimov',
      publisher: 'Gnome Press',
      year: 1951,
      edition: '1st',
    },
  },
  {
    name: 'Grandmother’s walnut writing desk',
    category: 'antiques',
    description: 'Late Victorian walnut writing desk with leather inlay top.',
    condition: 'Good — minor scuffs on the legs',
    location: 'Study',
    value_amount: 2400,
    provenance: 'Passed down from grandma Rose; originally from her parents’ house in Chicago.',
    intended_recipient_name: 'My brother David',
    bequest_notes: 'Keep it in the family — David has the space and will care for it.',
    custom_fields: {
      period: 'Late Victorian, c. 1890',
      materials: 'Walnut, leather',
      dimensions: '120cm x 60cm x 75cm',
    },
  },
  {
    name: 'Casablanca DVD (Special Edition)',
    category: 'media',
    description: '2-disc special edition with the original theatrical version.',
    condition: 'Excellent — like new',
    location: 'TV cabinet',
    value_amount: 18,
    intended_recipient_name: 'Anyone in the family',
    custom_fields: {
      director: 'Michael Curtiz',
      format: 'DVD',
      region: '1',
      year: 1942,
    },
  },
  {
    name: 'Hot Wheels Redline Volkswagen Beach Bomb',
    category: 'collectibles',
    description: 'Rare 1969 prototype with rear-loaded surfboards.',
    condition: 'Mint',
    location: 'Display case, garage',
    value_amount: 4200,
    provenance: 'Bought from a private collector in 2014.',
    intended_recipient_name: 'My son Tom',
    bequest_notes: 'Tom understands what this is. Recommend appraisal before any sale.',
    custom_fields: {
      brand: 'Hot Wheels',
      series: 'Redline',
      year: 1969,
      rarity: 'Prototype',
    },
  },
  {
    name: 'Pocket watch (gold-cased)',
    category: 'antiques',
    description: 'Hunter case pocket watch, Waltham movement.',
    condition: 'Working — last serviced 2019',
    location: 'Safe deposit box',
    value_amount: 1500,
    provenance: 'Belonged to my father; given to me on my wedding day.',
    intended_recipient_name: 'My grandson Leo',
    bequest_notes: 'To be given to Leo on his 21st birthday.',
    custom_fields: {
      maker: 'Waltham',
      period: 'c. 1910',
      materials: 'Gold-filled case, white enamel dial',
    },
  },
  {
    name: 'Painting: "Harbor at Dusk"',
    category: 'other',
    description: 'Oil on canvas, signed lower right.',
    condition: 'Restored 2018',
    location: 'Above fireplace',
    value_amount: 3200,
    provenance: 'Commissioned from local artist Maria H. in 1998.',
    intended_recipient_name: 'My daughter Emma',
    bequest_notes: 'Emma sat for the early sketches — this should be hers.',
    custom_fields: {
      artist: 'Maria Hernandez',
      medium: 'Oil on canvas',
      dimensions: '60cm x 90cm',
    },
  },
];

export async function createDemoInventory(): Promise<Inventory> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) throw new Error('Not signed in');
  const inv = await createInventory(
    'Sample inventory',
    'Demo items so you can see how Keepsake works. Delete this any time.',
  );
  for (const d of DEMO_ITEMS) {
    await createItem(inv.id, {
      name: d.name,
      category: d.category,
      description: d.description,
      condition: d.condition ?? null,
      location: d.location ?? null,
      value_amount: d.value_amount,
      value_currency: 'USD',
      provenance: d.provenance ?? null,
      intended_recipient_name: d.intended_recipient_name ?? null,
      bequest_notes: d.bequest_notes ?? null,
      custom_fields: d.custom_fields,
    });
  }
  return inv;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}
