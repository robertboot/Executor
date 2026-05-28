'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { InventoryShare, Role } from '@/lib/types';

export async function inviteToInventory(input: {
  inventoryId: string;
  email: string;
  role: Role;
}): Promise<InventoryShare> {
  const supabase = await createSupabaseServerClient();
  const { data: me } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('inventory_shares')
    .insert({
      inventory_id: input.inventoryId,
      invited_email: input.email.trim().toLowerCase(),
      role: input.role,
      invited_by: me.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/inventories/${input.inventoryId}/shares`);
  return data as InventoryShare;
}

export async function updateShareRole(shareId: string, role: Role) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('inventory_shares')
    .update({ role })
    .eq('id', shareId);
  if (error) throw error;
}

export async function revokeShare(shareId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('inventory_shares')
    .delete()
    .eq('id', shareId);
  if (error) throw error;
}

export async function acceptInvite(shareId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('accept_share_invite', {
    share_id: shareId,
  });
  if (error) throw error;
  revalidatePath('/invites');
  revalidatePath('/home');
}
