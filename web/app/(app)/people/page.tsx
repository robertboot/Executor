import Link from 'next/link';
import Image from 'next/image';
import { listPeople } from '@/lib/api';
import { displayName, lifeDates, personInitials } from '@/lib/people';

export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const people = await listPeople();

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            People
          </h1>
          <p className="text-muted text-sm mt-1">
            The family and friends behind every heirloom.
          </p>
        </div>
        <Link
          href="/people/new"
          className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add person
        </Link>
      </header>

      {people.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-2xl p-10 text-center">
          <h2 className="font-serif text-2xl text-ink">No people yet</h2>
          <p className="text-muted text-sm mt-2 mb-4">
            Add your first person — a parent, grandparent, sibling, or
            friend — and start connecting items to the people they
            matter to.
          </p>
          <Link
            href="/people/new"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep"
          >
            <PlusIcon className="w-4 h-4" />
            Add your first person
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {people.map((p) => {
            const name = displayName(p);
            const dates = lifeDates(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/people/${p.id}`}
                  className="group block bg-paper border border-hairline rounded-xl overflow-hidden hover:shadow-card transition-shadow"
                >
                  <div className="relative aspect-square bg-cream-soft overflow-hidden">
                    {p.primaryPhotoUrl ? (
                      <Image
                        src={p.primaryPhotoUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl font-serif text-gold-deep bg-gold-soft/60">
                        {personInitials(p)}
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-0.5">
                    <div className="font-serif text-lg text-ink leading-tight truncate">
                      {name}
                    </div>
                    {p.relationship && (
                      <div className="text-xs text-ink-soft truncate">
                        {p.relationship}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 text-xs text-muted pt-1">
                      <span>{dates ?? '—'}</span>
                      <span>
                        {p.itemCount} {p.itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
