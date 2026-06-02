import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/subscription';
import { Card } from '@/components/ui/Card';
import DisplayNameForm from './DisplayNameForm';
import { redoOnboarding } from './profile-actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const sub = await getSubscription();

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-serif text-3xl text-ink">Settings</h1>

      <Card>
        <div className="text-xs uppercase tracking-wide text-muted mb-1">
          Signed in as
        </div>
        <div className="font-medium text-ink">{user?.email}</div>
        <div className="text-xs text-muted mt-1">
          Account ID: <span className="font-mono">{user?.id?.slice(0, 8)}…</span>
        </div>
      </Card>

      <Card>
        <div className="text-xs uppercase tracking-wide text-muted mb-2">
          Display name
        </div>
        <DisplayNameForm
          initial={(user?.user_metadata?.display_name as string) ?? ''}
        />
      </Card>

      <ul className="space-y-2">
        <SettingsLink
          href="/billing"
          label="Billing"
          description={`Subscription: ${sub.status}`}
        />
      </ul>

      <form action={redoOnboarding}>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-ink">Redo setup</div>
              <div className="text-xs text-muted mt-1">
                Walk through the setup wizard again to pick a different collection style.
              </div>
            </div>
            <button
              type="submit"
              className="shrink-0 inline-flex items-center px-4 h-9 rounded-lg border border-forest text-forest text-sm font-medium hover:bg-forest hover:text-cream transition-colors"
            >
              Start over
            </button>
          </div>
        </Card>
      </form>

      <form action="/auth/sign-out" method="POST" className="pt-4">
        <button
          type="submit"
          className="text-sm text-red-700 hover:text-red-900 underline"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function SettingsLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block bg-paper border border-hairline rounded-xl p-4 hover:shadow-card transition-shadow"
      >
        <div className="font-medium text-ink">{label}</div>
        <div className="text-xs text-muted">{description}</div>
      </Link>
    </li>
  );
}
