'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

/**
 * A role card in the "One heirloom, three relationships" example.
 *
 * The cards use sample people (Grandpa Joe, Sarah, Emily), so their names
 * can't open a real contributor bio. Clicking a name instead opens a small
 * dialog explaining what would happen with the user's own data.
 */
export default function DemoRoleCard({
  icon,
  kicker,
  name,
  relationship,
  tag,
  body,
  blurb,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ReactNode;
  kicker: string;
  name: string;
  relationship: string;
  tag: string;
  body: string;
  blurb: string;
  ctaHref: string;
  ctaLabel: string;
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
    <div className="h-full bg-cream-soft/50 border border-hairline rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="shrink-0 w-10 h-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C29A4E]">
          {kicker}
        </span>
      </div>

      <div className="text-sm text-ink">({tag})</div>

      <div className="mt-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${name}'s profile`}
          className="group/name inline-flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-2 text-cream hover:bg-forest-deep transition-colors"
        >
          <span className="font-serif text-xl leading-none">{name}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="14"
            height="14"
            className="text-cream transition-transform group-hover/name:translate-x-0.5"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="text-xs text-muted mt-2">{relationship}</div>

      <p className="text-sm text-ink-soft mt-2 leading-relaxed">{body}</p>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${name} — sample profile`}
          >
            <div
              className="absolute inset-0 bg-ink/40"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-md bg-paper rounded-2xl border border-hairline shadow-raised p-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#C29A4E]">
                Sample contributor
              </div>
              <h3 className="font-serif text-2xl text-ink mt-1 leading-tight">
                {name}
              </h3>
              <div className="text-xs text-muted mt-0.5">
                {relationship} · {kicker}
              </div>

              <p className="text-sm text-ink-soft mt-4 leading-relaxed">
                {blurb}
              </p>
              <p className="text-xs text-muted mt-3 leading-relaxed">
                {name} is part of this walkthrough, so there&rsquo;s no profile
                to open yet — add your own {kicker.toLowerCase()}s to start
                building these connections.
              </p>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setOpen(false)}
                  className="px-4 h-10 rounded-lg border border-hairline text-sm text-ink-soft hover:bg-cream-soft transition-colors"
                >
                  Close
                </button>
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
                >
                  {ctaLabel} →
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
