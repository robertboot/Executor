'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LEVEL_LABEL, conservatorInitials } from '@/lib/conservators';
import { formatRelativeTime } from '@/lib/format';
import type { ConservatorWithPhoto } from '@/lib/api';

type SortKey = 'name' | 'level' | 'activity';

export default function ConservatorsList({
  conservators,
}: {
  conservators: ConservatorWithPhoto[];
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? conservators.filter((c) => {
          const haystack = [
            c.name,
            c.email ?? '',
            c.relationship ?? '',
            LEVEL_LABEL[c.permission_level],
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
      : conservators;
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'level':
          return LEVEL_LABEL[a.permission_level].localeCompare(
            LEVEL_LABEL[b.permission_level],
          );
        case 'activity': {
          const ta = a.last_active_at ? Date.parse(a.last_active_at) : 0;
          const tb = b.last_active_at ? Date.parse(b.last_active_at) : 0;
          return tb - ta;
        }
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [conservators, query, sort]);

  return (
    <section className="space-y-4 scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Your Conservators
          </h2>
          <p className="text-muted text-sm sm:text-base mt-2 max-w-xl">
            Invite trusted family members, historians, or caretakers to
            help preserve your archive.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <label className="relative">
            <span className="sr-only">Search conservators</span>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conservators..."
              className="h-10 w-full sm:w-64 pl-9 pr-3 rounded-lg bg-paper border border-hairline text-sm text-ink placeholder:text-muted focus:outline-none focus:border-forest"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Sort conservators</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 w-full sm:w-44 pl-3 pr-9 rounded-lg bg-paper border border-hairline text-sm text-ink appearance-none focus:outline-none focus:border-forest"
            >
              <option value="name">Sort by Name</option>
              <option value="level">Sort by Role</option>
              <option value="activity">Sort by Activity</option>
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
            ? `No conservators match “${query}”.`
            : 'No conservators yet.'}
        </div>
      ) : (
        <ul className="bg-paper border border-hairline rounded-2xl shadow-card divide-y divide-hairline overflow-hidden">
          {visible.map((c) => (
            <li key={c.id}>
              <ConservatorRow conservator={c} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ConservatorRow({ conservator }: { conservator: ConservatorWithPhoto }) {
  const url = conservator.primaryPhotoUrl;
  return (
    <Link
      href={`/conservators/${conservator.id}`}
      className="flex items-center gap-4 p-3 sm:p-4 hover:bg-cream-soft/40 transition-colors"
    >
      <div className="shrink-0 relative w-11 h-11 rounded-full overflow-hidden bg-gold-soft/60 flex items-center justify-center">
        {url ? (
          <Image
            src={url}
            alt={conservator.name}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <span className="text-sm font-serif font-semibold text-gold-deep">
            {conservatorInitials(conservator)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-serif text-base text-ink leading-tight truncate">
          {conservator.name}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted mt-0.5 leading-tight">
          {conservator.relationship && (
            <span className="text-ink-soft truncate">
              {conservator.relationship}
            </span>
          )}
          {conservator.relationship && <span aria-hidden>·</span>}
          <span className="inline-flex items-center text-[9px] uppercase tracking-widest font-medium px-1.5 py-0.5 rounded bg-gold-soft text-gold-deep">
            {LEVEL_LABEL[conservator.permission_level]}
          </span>
          {conservator.email && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{conservator.email}</span>
            </>
          )}
          {conservator.last_active_at && (
            <>
              <span aria-hidden>·</span>
              <span>
                Active {formatRelativeTime(conservator.last_active_at)}
              </span>
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
