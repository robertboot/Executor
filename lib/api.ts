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

export interface ItemListOptions {
  search?: string;
  category?: string;
}

export async function listItems(
  inventoryId: string,
  opts: ItemListOptions = {},
): Promise<Item[]> {
  let q = supabase
    .from('items')
    .select('*')
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: false });
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

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}
