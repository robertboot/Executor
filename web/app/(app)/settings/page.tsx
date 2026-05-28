import { getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-xl space-y-5">
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

      <form action="/auth/sign-out" method="POST">
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
