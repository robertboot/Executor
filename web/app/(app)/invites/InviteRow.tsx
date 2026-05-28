'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { acceptInvite } from '../inventories/[id]/shares/actions';

export default function InviteRow({
  id,
  inventoryName,
  description,
  role,
}: {
  id: string;
  inventoryName: string;
  description: string | null;
  role: 'viewer' | 'contributor';
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      await acceptInvite(id);
      router.refresh();
    });
  }

  return (
    <div className="bg-paper border border-hairline rounded-xl p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-medium text-ink truncate">{inventoryName}</div>
        <div className="text-xs text-muted">
          As {role}
          {description ? ` · ${description}` : ''}
        </div>
      </div>
      <Button onClick={accept} disabled={pending} size="sm">
        {pending ? 'Accepting…' : 'Accept'}
      </Button>
    </div>
  );
}
