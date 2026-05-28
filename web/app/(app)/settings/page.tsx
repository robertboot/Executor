import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/subscription';
import { Card } from '@/components/ui/Card';

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

      <ul className="space-y-2">
        <SettingsLink href="/inventories" label="Inventories" description="Add or share inventories" />
        <SettingsLink href="/invites" label="Pending invites" description="Accept invitations to other people's inventories" />
        <SettingsLink
          href="/billing"
          label="Billing"
          description={`Subscription: ${sub.status}`}
        />
      </ul>

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
