import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  ARCHETYPE_SUBCATEGORIES,
  findArchetype,
} from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';
import AddCollectionsClient from './AddCollectionsClient';

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

  const allSubCats = ARCHETYPE_SUBCATEGORIES[archetype.key] ?? [];
  const unselected = allSubCats.filter((s) => !existing.has(s.key));

  return (
    <AddCollectionsClient
      archetypeKey={archetype.key as OnboardingArchetype}
      archetypeTitle={archetype.title}
      subCategories={unselected}
      next={search?.next ?? null}
    />
  );
}
