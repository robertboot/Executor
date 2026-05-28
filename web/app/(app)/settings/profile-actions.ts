'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function updateDisplayName(displayName: string) {
  const supabase = await createSupabaseServerClient();
  const trimmed = displayName.trim();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: trimmed || null },
  });
  if (error) throw error;
  // Mirror to profiles table if it has a display_name column (Heirloom
  // schema does). Failure here is non-fatal — auth metadata is the
  // canonical source for the greeting.
  const { data: me } = await supabase.auth.getUser();
  if (me.user) {
    await supabase
      .from('profiles')
      .upsert({ id: me.user.id, display_name: trimmed || null });
  }
  revalidatePath('/home');
  revalidatePath('/settings');
}
