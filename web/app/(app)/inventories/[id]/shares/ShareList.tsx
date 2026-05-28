'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { InventoryShare, Role } from '@/lib/types';
import { revokeShare, updateShareRole } from './actions';

export default function ShareList({ shares }: { shares: InventoryShare[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (shares.length === 0) {
    return (
      <p className="text-sm text-muted">
        No one else has access to this inventory yet.
      </p>
    );
  }

  function changeRole(id: string, role: Role) {
    startTransition(async () => {
      await updateShareRole(id, role);
      router.refresh();
    });
  }

  function revoke(id: string, label: string) {
    if (!confirm(`Revoke access for ${label}?`)) return;
    startTransition(async () => {
      await revokeShare(id);
      router.refresh();
    });
  }

  return (
    <ul className="space-y-2">
      {shares.map((s) => (
        <li
          key={s.id}
          className="bg-paper border border-hairline rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-ink truncate">{s.invited_email}</div>
            <div className="text-xs text-muted">
              {s.status === 'pending' && 'Invite pending'}
              {s.status === 'accepted' && 'Accepted'}
              {s.status === 'revoked' && 'Revoked'}
            </div>
          </div>
          {s.status !== 'revoked' && (
            <>
              <select
                value={s.role}
                onChange={(e) => changeRole(s.id, e.target.value as Role)}
                disabled={pending}
                className="h-9 px-2 rounded-md bg-paper border border-hairline text-xs text-ink focus:outline-none focus:ring-2 focus:ring-forest"
              >
                <option value="viewer">Viewer</option>
                <option value="contributor">Contributor</option>
              </select>
              <button
                type="button"
                onClick={() => revoke(s.id, s.invited_email)}
                disabled={pending}
                className="text-xs text-red-700 hover:underline disabled:opacity-50"
              >
                Revoke
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
