'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { deletePerson } from '../actions';

/**
 * "Delete this person" trigger that opens a confirmation dialog before
 * running the (irreversible) deletePerson server action.
 */
export default function DeletePersonButton({
  id,
  name,
  itemCount,
}: {
  id: string;
  name: string;
  itemCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-red-700 hover:text-red-900 underline"
      >
        Delete this person
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Delete ${name}`}
          >
            <div
              className="absolute inset-0 bg-ink/40"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-md bg-paper rounded-2xl border border-hairline shadow-raised p-6">
              <h3 className="font-serif text-xl text-ink">Delete {name}?</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                This permanently removes {name} from your archive
                {itemCount > 0
                  ? ` and unlinks them from ${itemCount} connected ${
                      itemCount === 1 ? 'item' : 'items'
                    }`
                  : ''}
                . Their roles as an Inheritor or Conservator are removed too.
                This can&rsquo;t be undone.
              </p>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setOpen(false)}
                  className="px-4 h-10 rounded-lg border border-hairline text-sm text-ink-soft hover:bg-cream-soft transition-colors"
                >
                  Cancel
                </button>
                <form action={deletePerson}>
                  <input type="hidden" name="id" value={id} />
                  <button
                    type="submit"
                    className="px-4 h-10 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
