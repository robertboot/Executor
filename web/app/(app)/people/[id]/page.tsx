import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getPerson,
  getPersonRoles,
  listPersonItems,
  personPhotoPublicUrl,
} from '@/lib/api';
import {
  displayName,
  lifeDates,
  personInitials,
  ROLE_LABEL,
  ROLE_ORDER,
  SIDE_LABEL,
} from '@/lib/people';
import type { ItemPersonRole } from '@/lib/types';
import { glyphForCategory } from '@/lib/categories';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photo_failed?: string }>;
}

export default async function PersonProfilePage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const person = await getPerson(id);
  if (!person) notFound();

  const [items, roles] = await Promise.all([
    listPersonItems(id),
    getPersonRoles(id),
  ]);

  const grouped = new Map<ItemPersonRole, typeof items>();
  for (const it of items) {
    const existing = grouped.get(it.role) ?? [];
    existing.push(it);
    grouped.set(it.role, existing);
  }

  const name = displayName(person);
  const dates = lifeDates(person);
  const photoUrl = person.profile_photo_path
    ? personPhotoPublicUrl(person.profile_photo_path)
    : null;
  const photoFailed = sp?.photo_failed === '1';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {photoFailed && <PhotoFailedBanner bucket="people-photos" />}
      <div>
        <Link
          href="/people"
          className="inline-flex items-center text-sm text-muted hover:text-ink"
        >
          ← All people
        </Link>
      </div>

      {/* Hero */}
      <section className="flex flex-col sm:flex-row items-start gap-6">
        <div className="shrink-0 relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-cream-soft border border-hairline">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 160px, 192px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl font-serif text-gold-deep bg-gold-soft/60">
              {personInitials(person)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
            {name}
          </h1>
          {person.relationship && (
            <div className="text-base text-gold-deep">
              {person.relationship}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <RoleBadge>Originator</RoleBadge>
            {roles.inheritor && <RoleBadge>Inheritor</RoleBadge>}
            {roles.conservator && <RoleBadge>Conservator</RoleBadge>}
            <Link
              href={`/people/${person.id}/edit`}
              className="text-xs text-forest underline hover:text-forest-deep"
            >
              Manage roles
            </Link>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-ink-soft">
            {dates && <span>{dates}</span>}
            {dates && person.side_of_family && (
              <span className="text-muted">·</span>
            )}
            {person.side_of_family && (
              <span>{SIDE_LABEL[person.side_of_family]}</span>
            )}
          </div>
          {person.email && (
            <div className="text-sm">
              <a
                href={`mailto:${person.email}`}
                className="text-forest underline hover:text-forest-deep"
              >
                {person.email}
              </a>
            </div>
          )}
          <div className="text-xs uppercase tracking-wider text-muted pt-2">
            {items.length} connected {items.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </section>

      {/* Biography */}
      {person.biography && (
        <section className="space-y-2">
          <h2 className="font-serif text-xl text-ink">Biography</h2>
          <p className="text-ink-soft leading-relaxed whitespace-pre-line bg-paper border border-hairline rounded-2xl p-5">
            {person.biography}
          </p>
        </section>
      )}

      {/* Connected items grouped by role */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-ink">Connected items</h2>
        {items.length === 0 ? (
          <div className="bg-paper border border-hairline rounded-2xl p-8 text-center">
            <p className="text-muted text-sm">
              No items connected yet. Open any item and use{' '}
              <span className="text-ink">Associated People</span> to link
              them here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {ROLE_ORDER.map((role) => {
              const list = grouped.get(role) ?? [];
              if (list.length === 0) return null;
              return (
                <div key={role} className="space-y-2">
                  <h3 className="text-xs uppercase tracking-widest text-muted">
                    {ROLE_LABEL[role]}
                  </h3>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                    {list.map((it) => (
                      <li key={`${role}-${it.id}`}>
                        <Link
                          href={`/items/${it.id}`}
                          className="group block bg-paper border border-hairline rounded-xl overflow-hidden hover:shadow-card transition-shadow"
                        >
                          <div className="relative aspect-square bg-cream-soft overflow-hidden">
                            {it.primaryPhotoUrl ? (
                              <Image
                                src={it.primaryPhotoUrl}
                                alt={it.name}
                                fill
                                sizes="(max-width: 640px) 50vw, 200px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted/50">
                                {glyphForCategory(it.category)}
                              </div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <div className="text-sm font-medium text-ink truncate">
                              {it.name}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit (foot) */}
      <section className="pt-6 border-t border-hairline">
        <Link
          href={`/people/${person.id}/edit`}
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-paper border border-hairline text-ink text-sm font-medium hover:bg-cream-soft transition-colors"
        >
          Edit
        </Link>
      </section>
    </div>
  );
}

function RoleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gold-soft text-gold-deep text-xs font-medium">
      {children}
    </span>
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
