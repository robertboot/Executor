import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getConservator } from '@/lib/api';
import {
  LEVEL_LABEL,
  LEVEL_BADGE,
  conservatorInitials,
} from '@/lib/conservators';
import { formatDate } from '@/lib/format';
import { deleteConservator } from '../actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photo_failed?: string }>;
}

export default async function ConservatorDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const conservator = await getConservator(id);
  if (!conservator) notFound();

  const photoUrl = conservator.primaryPhotoUrl;
  const photoFailed = sp?.photo_failed === '1';

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      <Link
        href="/conservators"
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← Conservators
      </Link>

      {photoFailed && <PhotoFailedBanner bucket="conservator-photos" />}

      <section className="flex flex-col sm:flex-row items-start gap-6">
        <div className="shrink-0 relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gold-soft/60 flex items-center justify-center">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={conservator.name}
              fill
              sizes="(max-width: 640px) 112px, 128px"
              className="object-cover"
            />
          ) : (
            <span className="text-2xl font-serif font-semibold text-gold-deep">
              {conservatorInitials(conservator)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
              {conservator.name}
            </h1>
            <span className="text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded bg-gold-soft text-gold-deep">
              {LEVEL_LABEL[conservator.permission_level]}
            </span>
          </div>
          {conservator.relationship && (
            <div className="text-gold-deep">{conservator.relationship}</div>
          )}
          <div className="text-sm text-ink-soft">
            {LEVEL_BADGE[conservator.permission_level]}
          </div>
          {conservator.email && (
            <a
              href={`mailto:${conservator.email}`}
              className="text-sm text-forest underline block hover:text-forest-deep"
            >
              {conservator.email}
            </a>
          )}
          {conservator.phone && (
            <div className="text-sm text-ink-soft">{conservator.phone}</div>
          )}
          <div className="text-xs text-muted pt-2">
            Added {formatDate(conservator.created_at)}
          </div>
        </div>
        <Link
          href={`/conservators/${conservator.id}/edit`}
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors shrink-0"
        >
          Edit Access
        </Link>
      </section>

      {conservator.notes && (
        <section className="space-y-2">
          <h2 className="font-serif text-xl text-ink">Notes</h2>
          <p className="text-ink-soft leading-relaxed whitespace-pre-line bg-paper border border-hairline rounded-2xl p-5">
            {conservator.notes}
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-ink">Archive activity</h2>
        <div className="bg-paper border border-hairline rounded-2xl p-8 text-center">
          <p className="text-muted text-sm">
            No logged activity yet. When this conservator edits items,
            uploads photos, or updates collections, each change will
            appear here.
          </p>
        </div>
      </section>

      <section className="pt-6 border-t border-hairline">
        <form action={deleteConservator}>
          <input type="hidden" name="id" value={conservator.id} />
          <button
            type="submit"
            className="text-xs text-red-700 hover:text-red-900 underline"
          >
            Remove this conservator
          </button>
        </form>
        <p className="text-[10px] text-muted mt-1">
          Removes their access. Their past activity log remains in your
          archive.
        </p>
      </section>
    </div>
  );
}

function PhotoFailedBanner({ bucket }: { bucket: string }) {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm">
      <span className="shrink-0 mt-0.5" aria-hidden>
        ⚠️
      </span>
      <div>
        <strong className="font-medium">Photo upload failed.</strong>{' '}
        The record was saved but the photo could not be attached. Check
        that the <code>{bucket}</code> storage bucket exists and that
        its INSERT policy allows{' '}
        <code>auth.uid()::text = (storage.foldername(name))[1]</code>,
        then try uploading again from the Edit page.
      </div>
    </div>
  );
}
