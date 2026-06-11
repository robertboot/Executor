'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PersonPickerEntry } from '@/lib/api';

export default function PersonPicker({
  people,
  initialPersonId,
  initialPhotoUrl,
}: {
  people: PersonPickerEntry[];
  initialPersonId?: string | null;
  initialPhotoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPersonId ?? null,
  );

  // Hide the picker open/close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-person-picker]')) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const selected = useMemo(
    () => people.find((p) => p.id === selectedId) ?? null,
    [people, selectedId],
  );

  // initialPhotoUrl is used when no people picker entry matches (e.g.
  // the linked person was deleted) so the row's existing avatar
  // doesn't blink off.
  const previewUrl = selected?.photoUrl ?? initialPhotoUrl ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) =>
      [p.displayName, p.relationship ?? ''].join(' ').toLowerCase().includes(q),
    );
  }, [people, query]);

  // The hidden input is what the server action reads:
  //   '' or missing     → unset (leave column alone on update)
  //   '<uuid>'          → link to that person
  //   'unlink'          → explicitly clear the link
  const hiddenValue =
    selectedId === null
      ? initialPersonId
        ? 'unlink'
        : ''
      : selectedId;

  return (
    <div className="space-y-2" data-person-picker>
      <input type="hidden" name="person_id" value={hiddenValue} />

      {selected ? (
        <div className="flex items-center gap-3 bg-paper border border-hairline rounded-lg px-3 py-2">
          <Avatar url={previewUrl} name={selected.displayName} />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-ink truncate">
              {selected.displayName}
            </div>
            {selected.relationship && (
              <div className="text-xs text-muted truncate">
                {selected.relationship}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setQuery('');
              setOpen(false);
            }}
            className="text-xs text-muted hover:text-ink underline"
          >
            Unlink
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left bg-paper border border-hairline rounded-lg px-3 h-11 text-sm text-muted hover:border-ink/40 transition-colors"
        >
          + Link to an existing Originator
        </button>
      )}

      {open && (
        <div className="relative">
          <div className="absolute z-20 mt-1 w-full max-w-md bg-paper border border-hairline rounded-xl shadow-raised overflow-hidden">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people..."
              autoFocus
              className="w-full px-3 h-10 text-sm text-ink bg-paper border-b border-hairline focus:outline-none"
            />
            <ul className="max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="p-4 text-center text-xs text-muted">
                  No matching Originators.
                </li>
              ) : (
                filtered.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(p.id);
                        setQuery('');
                        setOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-cream-soft transition-colors text-left"
                    >
                      <Avatar url={p.photoUrl} name={p.displayName} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-ink truncate">
                          {p.displayName}
                        </div>
                        {p.relationship && (
                          <div className="text-xs text-muted truncate">
                            {p.relationship}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted leading-relaxed">
        Linking sources the name and avatar from the Originator. Updates
        there propagate here automatically.
      </p>
    </div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="shrink-0 relative w-9 h-9 rounded-full overflow-hidden bg-gold-soft/60 flex items-center justify-center text-xs font-serif text-gold-deep">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
