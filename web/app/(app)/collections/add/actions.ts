'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { CATEGORY_PRESETS } from '@/lib/categories';
import {
  ARCHETYPE_SUBCATEGORIES,
  parentCoreKeysFor,
} from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';

const VALID_CORE_KEYS = new Set(CATEGORY_PRESETS.map((c) => c.key));

// Adds the supplied sub-category keys to the user's selected_collections
// (along with their parent Core 12 keys), preserving any existing
// picks. Redirects back to /collections?archetype=<archetype>.
export async function addSubCategories(
  archetype: OnboardingArchetype,
  subCategoryKeys: string[],
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const validForArchetype = new Set(
    (ARCHETYPE_SUBCATEGORIES[archetype] ?? []).map((s) => s.key),
  );
  const newSubKeys = subCategoryKeys.filter((k) => validForArchetype.has(k));

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_collections')
    .eq('id', user.id)
    .maybeSingle();

  const existing: string[] =
    (profile?.selected_collections as string[] | null | undefined) ?? [];

  const subKeysAll = new Set<string>();
  const coreKeysAll = new Set<string>();
  for (const k of existing) {
    if (VALID_CORE_KEYS.has(k)) coreKeysAll.add(k);
    else subKeysAll.add(k);
  }
  for (const k of newSubKeys) subKeysAll.add(k);
  for (const k of parentCoreKeysFor([...subKeysAll])) coreKeysAll.add(k);

  const merged = [...subKeysAll, ...coreKeysAll];

  const { error } = await supabase
    .from('profiles')
    .update({ selected_collections: merged })
    .eq('id', user.id);

  if (error) {
    throw new Error(`Failed to add collections: ${error.message}`);
  }

  revalidatePath('/collections');
  revalidatePath('/home');
  redirect(`/collections?archetype=${archetype}`);
}
