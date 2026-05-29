import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getInheritor,
  inheritorPhotoUrl,
  listInheritorAssignments,
} from '@/lib/api';
import {
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  inheritorInitials,
} from '@/lib/inheritors';
import { formatDate, formatMoney } from '@/lib/format';
import { glyphForCategory, labelForCategory } from '@/lib/categories';
import { deleteInheritor } from '../actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InheritorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [inheritor, assignments] = await Promise.all([
    getInheritor(id),
    listInheritorAssignments(id),
  ]);
  if (!inheritor) notFound();

  const photoUrl = inheritor.profile_photo_path
    ? inheritorPhotoUrl(inheritor.profile_photo_path)
    : null;

  const designated = assignments.filter((a) => a.role === 'designated');
  const alternate = assignments.filter((a) => a.role === 'alternate');
  const totalValue = designated.reduce(
    (acc, a) => acc + (a.valueAmount ?? 0),
    0,
  );
  const totalCurrency = designated[0]?.valueCurrency ?? 'USD';

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      <Link
        href="/inheritors"
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← Inheritors
      </Link>

      <section className="flex flex-col sm:flex-row items-start gap-6">
        <div className="shrink-0 relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gold-soft/60 flex items-center justify-center">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={inheritor.display_name}
              fill
              sizes="(max-width: 640px) 112px, 128px"
              className="object-cover"
            />
          ) : (
            <span className="text-2xl font-serif font-semibold text-gold-deep">
              {inheritorInitials(inheritor)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
              {inheritor.display_name}
            </h1>
            <span
              className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded ${STATUS_BADGE_CLASS[inheritor.status]}`}
            >
              {STATUS_LABEL[inheritor.status]}
            </span>
          </div>
          {inheritor.relationship && (
            <div className="text-gold-deep">{inheritor.relationship}</div>
          )}
          {inheritor.email && (
            <a
              href={`mailto:${inheritor.email}`}
              className="text-sm text-forest underline block hover:text-forest-deep"
            >
              {inheritor.email}
            </a>
          )}
          <div className="text-xs text-muted pt-2">
            Added {formatDate(inheritor.created_at)}
          </div>
        </div>
        <Link
          href={`/inheritors/${inheritor.id}/edit`}
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors shrink-0"
        >
          Edit
        </Link>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat value={String(designated.length)} label="Primary Items" />
        <Stat value={String(alternate.length)} label="Alternate Items" />
        <Stat
          value={formatMoney(totalValue, totalCurrency)}
          label="Estimated Value"
        />
      </section>

      {inheritor.notes && (
        <section className="space-y-2">
          <h2 className="font-serif text-xl text-ink">Notes</h2>
          <p className="text-ink-soft leading-relaxed whitespace-pre-line bg-paper border border-hairline rounded-2xl p-5">
            {inheritor.notes}
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-ink">Assigned items</h2>
        {assignments.length === 0 ? (
          <div className="bg-paper border border-hairline rounded-2xl p-8 text-center">
            <p className="text-muted text-sm">
              No items assigned yet. Open an item and set this person as
              the Designated or Alternate Inheritor from the item&rsquo;s
              edit page.
            </p>
          </div>
        ) : (
          <ul className="space-y-2 bg-paper border border-hairline rounded-2xl overflow-hidden">
            {assignments.map((a) => (
              <li key={`${a.role}-${a.itemId}`}>
                <Link
                  href={`/items/${a.itemId}`}
                  className="flex items-center gap-3 p-3 hover:bg-cream-soft transition-colors"
                >
                  <div className="shrink-0 relative w-12 h-12 rounded-lg overflow-hidden bg-cream-soft">
                    {a.primaryPhotoUrl ? (
                      <Image
                        src={a.primaryPhotoUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl text-muted/50">
                        {glyphForCategory(a.itemCategory)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {a.itemName}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {labelForCategory(a.itemCategory)}
                      {a.valueAmount != null && (
                        <>
                          {' · '}
                          {formatMoney(a.valueAmount, a.valueCurrency)}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-gold-deep shrink-0">
                    {a.role === 'designated' ? 'Primary' : 'Alternate'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pt-6 border-t border-hairline">
        <form action={deleteInheritor}>
          <input type="hidden" name="id" value={inheritor.id} />
          <button
            type="submit"
            className="text-xs text-red-700 hover:text-red-900 underline"
          >
            Remove this inheritor
          </button>
        </form>
        <p className="text-[10px] text-muted mt-1">
          Items assigned to them are unassigned. Their notes are
          deleted.
        </p>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-paper border border-hairline rounded-xl p-3 text-center">
      <div className="font-serif text-xl text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted mt-1">
        {label}
      </div>
    </div>
  );
}
