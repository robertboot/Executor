import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItem, listRevisions } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();
  const revisions = await listRevisions(id);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link
          href={`/items/${id}`}
          className="text-xs text-muted hover:text-ink"
        >
          ← {item.name}
        </Link>
        <h1 className="font-serif text-3xl text-ink mt-1">History</h1>
        <p className="text-muted text-sm mt-1">
          Every change to this item, oldest at the bottom. Snapshots include
          every editable field at the time of the change.
        </p>
      </div>

      {revisions.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No changes recorded yet.</p>
        </Card>
      ) : (
        <ol className="space-y-3">
          {revisions.map((rev) => (
            <li key={rev.id}>
              <details className="bg-paper border border-hairline rounded-xl">
                <summary className="cursor-pointer p-4 flex items-baseline justify-between">
                  <div>
                    <div className="font-medium text-ink text-sm">
                      {rev.change_note || 'Edited'}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {formatDateTime(rev.changed_at)}
                    </div>
                  </div>
                  <span className="text-xs text-muted">view snapshot</span>
                </summary>
                <pre className="px-4 pb-4 text-xs text-ink-soft whitespace-pre-wrap overflow-x-auto font-mono">
                  {JSON.stringify(rev.snapshot, null, 2)}
                </pre>
              </details>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
