'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Inventory } from '@/lib/types';

export async function createInventory(input: {
  name: string;
  description: string | null;
}): Promise<Inventory> {
  const supabase = await createSupabaseServerClient();
  // The Heirloom Supabase schema exposes a SECURITY DEFINER RPC that sets
  // owner_id from auth.uid() and seeds defaults. The Expo app calls the
  // same one.
  const { data, error } = await supabase.rpc('create_inventory', {
    p_name: input.name,
    p_description: input.description,
  });
  if (error) throw error;
  revalidatePath('/inventories');
  revalidatePath('/home');
  return data as Inventory;
}
