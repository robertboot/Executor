'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import type { SubCategory } from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';
import { addSubCategories } from '../actions';

interface Props {
  archetypeKey: OnboardingArchetype;
  archetypeTitle: string;
  subCategories: SubCategory[];
  next: string | null;
}

const CARD_OVERLAY_GRADIENT =
  'linear-gradient(to right, rgba(255,253,247,0.88) 0%, rgba(255,253,247,0.75) 35%, rgba(255,253,247,0.3) 55%, rgba(255,253,247,0.03) 80%, rgba(255,253,247,0) 100%)';

export default function AddCollectionsClient({
  archetypeKey,
  archetypeTitle,
  subCategories,
  next,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function save() {
    if (selected.size === 0) {
      setError('Pick at least one collection to add.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await addSubCategories(archetypeKey, Array.from(selected), next ?? undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      <Link
        href={`/collections?archetype=${archetypeKey}`}
        className="inline-flex items-center text-sm text-muted hover:text-ink"
      >
        ← Back to {archetypeTitle}
      </Link>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted">
          {archetypeTitle}
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight mt-1">
          Add more collections
        </h1>
        <p className="text-muted text-sm sm:text-base mt-2">
          Pick the ones you&rsquo;d like to start cataloging.
        </p>
      </div>

      {subCategories.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-xl p-10 text-center">
          <p className="text-ink">
            You&rsquo;ve already added every collection in this archetype.
          </p>
          <Link
            href={`/collections?archetype=${archetypeKey}`}
            className="inline-block mt-4 text-sm text-forest underline"
          >
            Back to collections
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {subCategories.map((s) => {
              const isSelected = selected.has(s.key);
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => toggle(s.key)}
                    className="group relative w-full text-left overflow-hidden bg-paper border border-hairline rounded-2xl hover:border-forest hover:shadow-card transition-all"
                    style={{ minHeight: 124 }}
                    aria-pressed={isSelected}
                  >
                    <div
                      className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 ${
                        isSelected ? 'scale-105' : ''
                      }`}
                      style={{ backgroundImage: `url('${s.bgImage}')` }}
                      aria-hidden="true"
                    />
                    <div
                      className={`absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-60 ${
                        isSelected ? 'opacity-60' : 'opacity-100'
                      }`}
                      style={{ background: CARD_OVERLAY_GRADIENT }}
                      aria-hidden="true"
                    />
                    <div className="relative z-10 flex items-start gap-3 p-4 pr-6 max-w-[48%] sm:max-w-[52%]">
                      <Checkbox checked={isSelected} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-base sm:text-lg text-ink leading-tight">
                          {s.label}
                        </h3>
                        <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-snug">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {error && (
            <div className="text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg py-2 px-3">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Link
              href={`/collections?archetype=${archetypeKey}`}
              className="text-sm text-muted hover:text-ink underline"
            >
              Cancel
            </Link>
            <div className="text-xs text-muted">{selected.size} selected</div>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="inline-flex items-center px-5 h-11 rounded-full bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors disabled:opacity-50"
            >
              {pending ? 'Adding…' : 'Add to my collections →'}
            </button>
          </div>
        </>
      )}

      {/* Render a hidden Image so Next.js bundles the optimizer for the
          card bg images; not strictly required but speeds the first
          paint of any card. */}
      <div className="hidden">
        {subCategories.slice(0, 1).map((s) => (
          <Image
            key={s.key}
            src={s.bgImage}
            alt=""
            width={1}
            height={1}
            priority={false}
          />
        ))}
      </div>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <span className="shrink-0 w-6 h-6 rounded-md bg-forest text-cream flex items-center justify-center mt-0.5">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path d="M3 8.5l3.5 3.5L13 5" />
        </svg>
      </span>
    );
  }
  return (
    <span className="shrink-0 w-6 h-6 rounded-md border-2 border-hairline bg-paper/70 mt-0.5" />
  );
}
