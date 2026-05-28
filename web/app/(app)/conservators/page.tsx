import { listConservators } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function ConservatorsPage() {
  const conservators = await listConservators();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl text-ink">Conservators</h1>
        <p className="text-muted text-sm mt-1">
          People who can be assigned to look after an item or collection.
        </p>
      </div>

      {conservators.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-xl p-6 text-center">
          <p className="text-sm text-muted">No conservators yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conservators.map((c) => (
            <li
              key={c.id}
              className="bg-paper border border-hairline rounded-xl p-4"
            >
              <div className="font-medium text-ink">{c.name}</div>
              <div className="text-xs text-muted">
                {c.relationship && <span>{c.relationship} · </span>}
                {c.email && <span>{c.email}</span>}
                {c.phone && <span> · {c.phone}</span>}
              </div>
              {c.notes && <p className="text-sm text-ink-soft mt-2">{c.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
