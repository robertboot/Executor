import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  ARCHETYPES,
  ARCHETYPE_SUBCATEGORIES,
  CUSTOM_SUBCATEGORY,
  findArchetype,
} from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';
import AddCollectionsClient, { type SubCategoryGroup } from './AddCollectionsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ archetype: string }>;
  searchParams: Promise<{ next?: string }>;
}

export default async function AddCollectionsPage({
  params,
  searchParams,
}: PageProps) {
  const [{ archetype: archetypeParam }, search] = await Promise.all([
    params,
    searchParams,
  ]);
  const archetype = findArchetype(archetypeParam);
  if (!archetype) notFound();

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_collections')
    .eq('id', user.id)
    .maybeSingle();

  const existing = new Set<string>(
    (profile?.selected_collections as string[] | null | undefined) ?? [],
  );

  // Build a group per archetype with whatever sub-cats the user
  // hasn't picked yet. Active archetype's group goes first so the user
  // sees the most-relevant options first.
  const groups: SubCategoryGroup[] = [];
  const archOrder = [
    archetype,
    ...ARCHETYPES.filter((a) => a.key !== archetype.key),
  ];
  for (const a of archOrder) {
    const subs = (ARCHETYPE_SUBCATEGORIES[a.key] ?? []).filter(
      (s) => !existing.has(s.key),
    );
    if (subs.length === 0) continue;
    groups.push({
      archetypeKey: a.key,
      archetypeTitle: a.title,
      isCurrent: a.key === archetype.key,
      subCategories: subs,
    });
  }

  const customAvailable = !existing.has(CUSTOM_SUBCATEGORY.key);

  return (
    <AddCollectionsClient
      archetypeKey={archetype.key as OnboardingArchetype}
      archetypeTitle={archetype.title}
      groups={groups}
      customOption={customAvailable ? CUSTOM_SUBCATEGORY : null}
      next={search?.next ?? null}
    />
  );
}

