'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { PersonWithStats } from '@/lib/api';
import {
  SIDE_LABEL,
  displayName,
  lifeDates,
  personInitials,
} from '@/lib/people';
import type { SideOfFamily } from '@/lib/types';

type SortKey = 'name' | 'items' | 'side';

const SIDE_BADGE_CLASS: Record<SideOfFamily, string> = {
  paternal: 'bg-[#6F87B0] text-cream',
  maternal: 'bg-[#9F8AA8] text-cream',
  other: 'bg-cream-soft text-ink',
};

export default function PeopleList({
  people,
}: {
  people: PersonWithStats[];
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? people.filter((p) => {
          const haystack = [
            displayName(p),
            p.relationship ?? '',
            p.side_of_family ? SIDE_LABEL[p.side_of_family] : '',
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
      : people;
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'items':
          return b.itemCount - a.itemCount;
        case 'side': {
          const sa = a.side_of_family ?? 'zzz';
          const sb = b.side_of_family ?? 'zzz';
          return sa.localeCompare(sb);
        }
        case 'name':
        default:
          return displayName(a).localeCompare(displayName(b));
      }
    });
    return sorted;
  }, [people, query, sort]);

  return (
    <section id="your-people" className="space-y-4 scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Your Originators
          </h2>
          <p className="text-muted text-sm sm:text-base mt-2 max-w-xl">
            The family, friends, makers, and previous owners behind every
            heirloom.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <label className="relative">
            <span className="sr-only">Search people</span>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people..."
              className="h-10 w-full sm:w-64 pl-9 pr-3 rounded-lg bg-paper border border-hairline text-sm text-ink placeholder:text-muted focus:outline-none focus:border-forest"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Sort people</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 w-full sm:w-44 pl-3 pr-9 rounded-lg bg-paper border border-hairline text-sm text-ink appearance-none focus:outline-none focus:border-forest"
            >
              <option value="name">Sort by Name</option>
              <option value="side">Sort by Side</option>
              <option value="items">Sort by Linked Items</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              <ChevronIcon />
            </span>
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-2xl p-8 text-center text-sm text-muted">
          {query
            ? `No people match “${query}”.`
            : 'No people yet.'}
        </div>
      ) : (
        <ul className="bg-paper border border-hairline rounded-2xl shadow-card divide-y divide-hairline overflow-hidden">
          {visible.map((p) => (
            <li key={p.id}>
              <PersonRow person={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PersonRow({ person }: { person: PersonWithStats }) {
  const name = displayName(person);
  const dates = lifeDates(person);
  return (
    <Link
      href={`/people/${person.id}`}
      className="flex items-center gap-4 p-3 sm:p-4 hover:bg-cream-soft/40 transition-colors"
    >
      <div className="shrink-0 relative w-11 h-11 rounded-full overflow-hidden bg-gold-soft/60 flex items-center justify-center">
        {person.primaryPhotoUrl ? (
          <Image
            src={person.primaryPhotoUrl}
            alt={name}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <span className="text-sm font-serif font-semibold text-gold-deep">
            {personInitials(person)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-serif text-base text-ink leading-tight truncate">
          {name}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted mt-0.5 leading-tight">
          {person.relationship && (
            <span className="text-ink-soft truncate">{person.relationship}</span>
          )}
          {person.side_of_family && (
            <>
              {person.relationship && <span aria-hidden>·</span>}
              <span
                className={`inline-flex items-center text-[9px] uppercase tracking-widest font-medium px-1.5 py-0.5 rounded ${SIDE_BADGE_CLASS[person.side_of_family]}`}
              >
                {SIDE_LABEL[person.side_of_family]}
              </span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>
            {person.itemCount} {person.itemCount === 1 ? 'item' : 'items'}
          </span>
          {dates && (
            <>
              <span aria-hidden>·</span>
              <span>{dates}</span>
            </>
          )}
        </div>
      </div>

      <span className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors">
        Manage
      </span>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

