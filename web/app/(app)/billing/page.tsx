import { getSubscription } from '@/lib/subscription';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Billing — Heirloom' };

export default async function BillingPage() {
  const sub = await getSubscription();

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="font-serif text-3xl text-ink">Billing</h1>

      <Card>
        <div className="text-xs uppercase tracking-wide text-muted mb-1">
          Subscription
        </div>
        <div className="font-medium text-ink capitalize">{sub.status}</div>
        <p className="text-xs text-muted mt-2">
          Subscriptions are managed outside the app. If you need to update
          your plan or payment method, use the billing portal link your
          provider sends — Heirloom only reflects the current status here.
        </p>
      </Card>

      {!sub.isActive && sub.isGated && (
        <Card>
          <p className="text-sm text-red-700">
            Your subscription isn&rsquo;t active. The app remains accessible
            for viewing existing inventory, but new items can&rsquo;t be
            added until billing is up to date.
          </p>
        </Card>
      )}
    </div>
  );
}
