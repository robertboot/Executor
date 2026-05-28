'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Item } from '@/lib/types';

interface SaveInput {
  id: string | null;
  inventory_id: string;
  name: string;
  category: string | null;
  description: string;
  condition: string;
  location: string;
  value_amount: number | null;
  value_currency: string;
  provenance: string;
  notes: string;
  intended_recipient_name: string;
  intended_recipient_contact: string;
  bequest_notes: string;
  tagged_for_sale: boolean;
  custom_fields: Record<string, unknown>;
}

export async function saveItem(input: SaveInput): Promise<Item> {
  const supabase = await createSupabaseServerClient();

  // Empty strings → null for nullable text columns.
  const payload = {
    inventory_id: input.inventory_id,
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim() || null,
    condition: input.condition.trim() || null,
    location: input.location.trim() || null,
    value_amount: input.value_amount,
    value_currency: input.value_currency || 'USD',
    provenance: input.provenance.trim() || null,
    notes: input.notes.trim() || null,
    intended_recipient_name: input.intended_recipient_name.trim() || null,
    intended_recipient_contact: input.intended_recipient_contact.trim() || null,
    bequest_notes: input.bequest_notes.trim() || null,
    tagged_for_sale: input.tagged_for_sale,
    custom_fields: input.custom_fields ?? {},
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('items')
      .update(payload)
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw error;
    revalidatePath(`/items/${input.id}`);
    revalidatePath('/collections');
    revalidatePath('/home');
    return data as Item;
  }

  const { data, error } = await supabase
    .from('items')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  revalidatePath('/collections');
  revalidatePath('/home');
  return data as Item;
}

export async function deleteItem(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/collections');
  revalidatePath('/home');
}
