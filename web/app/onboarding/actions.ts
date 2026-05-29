'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { CATEGORY_PRESETS } from '@/lib/categories';
import { ARCHETYPES, FOCUS_MODES, findSubCategory, parentCoreKeysFor } from '@/lib/onboarding';
import type { OnboardingArchetype, OnboardingFocus } from '@/lib/types';

const VALID_ARCHETYPES = new Set(ARCHETYPES.map((a) => a.key));
const VALID_FOCUS = new Set(FOCUS_MODES.map((f) => f.key));
const VALID_COLLECTION_KEYS = new Set(CATEGORY_PRESETS.map((c) => c.key));

export interface CompleteOnboardingInput {
  archetype: OnboardingArchetype;
  focus: OnboardingFocus;
  selectedCollections: string[];
}

export async function completeOnboarding(input: CompleteOnboardingInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  if (!VALID_ARCHETYPES.has(input.archetype)) {
    throw new Error(`Invalid archetype: ${input.archetype}`);
  }
  if (!VALID_FOCUS.has(input.focus)) {
    throw new Error(`Invalid focus: ${input.focus}`);
  }

  // selectedCollections can mix sub-category keys (from archetypes with
  // a granular list) and Core 12 keys (from archetypes that fall back to
  // the grid). Keep the granular keys for future use and resolve their
  // parent core keys so the Collections page (which only knows core)
  // still sees everything the user picked.
  const subKeys = input.selectedCollections.filter((k) => findSubCategory(k));
  const coreKeysExplicit = input.selectedCollections.filter((k) =>
    VALID_COLLECTION_KEYS.has(k),
  );
  const coreKeysFromSubs = parentCoreKeysFor(subKeys);
  const cleanedCollections = Array.from(
    new Set([...subKeys, ...coreKeysExplicit, ...coreKeysFromSubs]),
  );

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      archetype: input.archetype,
      focus: input.focus,
      selected_collections: cleanedCollections,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    throw new Error(`Failed to save onboarding: ${error.message}`);
  }

  revalidatePath('/', 'layout');
}

export async function skipOnboarding() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    throw new Error(`Failed to skip onboarding: ${error.message}`);
  }

  revalidatePath('/', 'layout');
}
