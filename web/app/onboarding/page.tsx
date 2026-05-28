import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { ARCHETYPES, FOCUS_MODES } from '@/lib/onboarding';
import { CATEGORY_PRESETS } from '@/lib/categories';
import Wizard from './Wizard';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect('/home');
  }

  return (
    <Wizard
      archetypes={ARCHETYPES}
      focusModes={FOCUS_MODES}
      allCollections={CATEGORY_PRESETS.filter((c) => !c.custom).map((c) => ({
        key: c.key,
        label: c.label,
        glyph: c.glyph,
        iconUrl: c.iconUrl,
      }))}
    />
  );
}
