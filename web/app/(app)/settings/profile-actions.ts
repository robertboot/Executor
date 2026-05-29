'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';

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

// Clears the user's onboarding state so the next request to any gated
// route gets redirected back to /onboarding. The redirect itself is
// driven by middleware reading onboarding_completed_at on the profile.
export async function redoOnboarding() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed_at: null,
      archetype: null,
      focus: null,
      selected_collections: null,
    })
    .eq('id', user.id);

  if (error) throw new Error(`Failed to reset onboarding: ${error.message}`);

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}
