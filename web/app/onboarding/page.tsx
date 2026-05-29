import { ARCHETYPES, FOCUS_MODES } from '@/lib/onboarding';
import { CATEGORY_PRESETS } from '@/lib/categories';
import Wizard from './Wizard';

// Auth + onboarding-completion gating is handled in middleware.ts so this
// page can render without an extra DB roundtrip on every request.
export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
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
