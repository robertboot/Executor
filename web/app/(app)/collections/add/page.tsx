import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { ARCHETYPES } from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

// Top-level "/collections/add" entry. Routes the user into the
// archetype-keyed picker so they always land on a list of available
// curated collections to check off, with the custom option at the
// bottom. The footer "+ Collection" button hits this URL — without it
// the button would dump them straight into the bare custom form.
export default async function AddCollectionsEntryPage({
  searchParams,
}: PageProps) {
  const search = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('archetype')
    .eq('id', user.id)
    .maybeSingle();

  const archetypeKey =
    (profile?.archetype as OnboardingArchetype | null) ??
    ARCHETYPES[0].key;

  const nextParam = search?.next
    ? `?next=${encodeURIComponent(search.next)}`
    : '';
  redirect(`/collections/add/${archetypeKey}${nextParam}`);
}
