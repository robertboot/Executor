'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { CATEGORY_PRESETS } from '@/lib/categories';
import {
  ARCHETYPES,
  ARCHETYPE_SUBCATEGORIES,
  CUSTOM_SUBCATEGORY,
  parentCoreKeysFor,
} from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';

const VALID_CORE_KEYS = new Set(CATEGORY_PRESETS.map((c) => c.key));

// Every selectable sub-cat key across all archetypes, plus the global
// Custom Collection option.
const VALID_SUBCATEGORY_KEYS = (() => {
  const out = new Set<string>([CUSTOM_SUBCATEGORY.key]);
  for (const arch of ARCHETYPES) {
    for (const sub of ARCHETYPE_SUBCATEGORIES[arch.key] ?? []) {
      out.add(sub.key);
    }
  }
  return out;
})();

// Only allow internal redirects, so a "?next=" param can't be used to
// punt users off-site after a save.
function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

// Adds the supplied sub-category keys to the user's selected_collections
// (along with their parent Core 12 keys), preserving any existing
// picks. Redirects to `next` when provided and internal, otherwise
// /collections?archetype=<archetype>.
export async function addSubCategories(
  archetype: OnboardingArchetype,
  subCategoryKeys: string[],
  next?: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Accept any sub-category key from any archetype, plus the Custom
  // Collection key — the picker lets users cross-archetype now.
  const newSubKeys = subCategoryKeys.filter((k) =>
    VALID_SUBCATEGORY_KEYS.has(k),
  );

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
  const target = safeNext(next) ?? `/collections?archetype=${archetype}`;
  redirect(target);
}

// Form-friendly wrapper for adding a single sub-category from an inline
// "+ Add to my collection" button on the Collections page. Re-uses the
// shared addSubCategories logic so the validation and merge behavior
// stay in one place.
export async function addOneSubCategory(formData: FormData) {
  const archetype = String(formData.get('archetype') ?? '').trim() as OnboardingArchetype;
  const subCatKey = String(formData.get('subCatKey') ?? '').trim();
  const next = String(formData.get('next') ?? '').trim() || undefined;
  if (!archetype || !subCatKey) {
    throw new Error('Missing archetype or subCatKey');
  }
  await addSubCategories(archetype, [subCatKey], next);
}

// Removes a single sub-category key from the user's selected_collections.
// Also drops the parent core key if no other selected sub-cat shares it.
// Intended for empty collections — the row card surfaces the button
// only when itemCount is 0.
export async function removeSubCategory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const subCatKey = String(formData.get('subCatKey') ?? '').trim();
  const archetype = String(formData.get('archetype') ?? '').trim();
  if (!subCatKey) throw new Error('Missing subCatKey');

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_collections')
    .eq('id', user.id)
    .maybeSingle();

  const existing: string[] =
    (profile?.selected_collections as string[] | null | undefined) ?? [];

  // Strip the sub-cat. Then strip the parent core key only if no
  // OTHER remaining sub-cat still uses it.
  const remainingSubKeys: string[] = [];
  const remainingCoreKeys: string[] = [];
  for (const k of existing) {
    if (k === subCatKey) continue;
    if (VALID_CORE_KEYS.has(k)) remainingCoreKeys.push(k);
    else remainingSubKeys.push(k);
  }
  const stillReferencedCores = new Set(parentCoreKeysFor(remainingSubKeys));
  const cleanedCores = remainingCoreKeys.filter((k) =>
    stillReferencedCores.has(k),
  );

  const merged = [...remainingSubKeys, ...cleanedCores];

  const { error } = await supabase
    .from('profiles')
    .update({ selected_collections: merged })
    .eq('id', user.id);

  if (error) {
    throw new Error(`Failed to remove collection: ${error.message}`);
  }

  revalidatePath('/collections');
  revalidatePath('/home');
  if (archetype) {
    redirect(`/collections?archetype=${archetype}`);
  }
  redirect('/collections');
}
