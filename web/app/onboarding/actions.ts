'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { CATEGORY_PRESETS } from '@/lib/categories';
import { ARCHETYPES, FOCUS_MODES } from '@/lib/onboarding';
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

  const cleanedCollections = input.selectedCollections
    .filter((k) => VALID_COLLECTION_KEYS.has(k))
    .filter((k, i, arr) => arr.indexOf(k) === i);

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
