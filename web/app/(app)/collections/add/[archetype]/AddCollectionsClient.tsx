'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import type { SubCategory } from '@/lib/onboarding';
import type { OnboardingArchetype } from '@/lib/types';
import { addSubCategories } from '../actions';

export interface SubCategoryGroup {
  archetypeKey: OnboardingArchetype;
  archetypeTitle: string;
  isCurrent: boolean;
  subCategories: SubCategory[];
}

interface Props {
  archetypeKey: OnboardingArchetype;
  archetypeTitle: string;
  groups: SubCategoryGroup[];
  customOption: SubCategory | null;
  next: string | null;
}

const CARD_OVERLAY_GRADIENT =
  'linear-gradient(to right, rgba(255,253,247,0.88) 0%, rgba(255,253,247,0.75) 35%, rgba(255,253,247,0.3) 55%, rgba(255,253,247,0.03) 80%, rgba(255,253,247,0) 100%)';

export default function AddCollectionsClient({
  archetypeKey,
  archetypeTitle,
  groups,
  customOption,
  next,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Only the current-archetype section is expanded on first render.
  // The other curated collections collapse closed so the user can
  // scan and pick which to explore.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const g of groups) if (g.isCurrent) initial.add(g.archetypeKey);
    return initial;
  });

  function toggle(key: string) {
    setSelected((prev) => {
      const out = new Set(prev);
      if (out.has(key)) out.delete(key);
      else out.add(key);
      return out;
    });
  }

  function toggleGroup(key: string) {
    setOpenGroups((prev) => {
      const out = new Set(prev);
      if (out.has(key)) out.delete(key);
      else out.add(key);
      return out;
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
        await addSubCategories(
          archetypeKey,
          Array.from(selected),
          next ?? undefined,
        );
      } catch (err) {
        // Server actions signal redirect() by throwing NEXT_REDIRECT;
        // re-throw so Next can complete the navigation instead of us
        // surfacing it as an error.
        if (isNextRedirect(err)) throw err;
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  const nothingToAdd = groups.length === 0 && !customOption;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/collections?archetype=${archetypeKey}`}
          className="inline-flex items-center text-sm text-muted hover:text-ink"
        >
          ← Back to {archetypeTitle}
        </Link>
        <Link
          href="/collections"
          className="inline-flex items-center text-sm text-forest hover:text-forest-deep font-medium"
        >
          My Collections →
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          Add more collections
        </h1>
        <p className="text-muted text-sm sm:text-base mt-2">
          Pick from your current curated collection, browse the others, or
          start a fully custom one of your own.
        </p>
      </div>

      {nothingToAdd ? (
        <div className="bg-paper border border-hairline rounded-xl p-10 text-center">
          <p className="text-ink">
            You&rsquo;ve already added every collection available.
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
          <div className="space-y-4">
            {groups.map((g) => {
              const open = openGroups.has(g.archetypeKey);
              const selectedInGroup = g.subCategories.filter((s) =>
                selected.has(s.key),
              ).length;
              return (
                <section
                  key={g.archetypeKey}
                  className="bg-paper border border-hairline rounded-2xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.archetypeKey)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-cream-soft/50 transition-colors"
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-ink truncate">
                        {g.archetypeTitle}
                      </h2>
                      {g.isCurrent && (
                        <span className="text-[10px] uppercase tracking-widest text-gold-deep shrink-0">
                          Yours
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {selectedInGroup > 0 && (
                        <span className="text-xs font-medium text-forest">
                          {selectedInGroup} selected
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        {g.subCategories.length}
                      </span>
                      <ChevronIcon
                        className={`w-4 h-4 text-muted transition-transform duration-200 ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>
                  {open && (
                    <ul className="space-y-3 p-4 pt-0">
                      {g.subCategories.map((s) => (
                        <li key={s.key}>
                          <SubCatCheckbox
                            sub={s}
                            checked={selected.has(s.key)}
                            onToggle={() => toggle(s.key)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}

            {customOption && (
              <section className="space-y-3 pt-2">
                <h2 className="text-xs uppercase tracking-widest text-muted">
                  Or start your own
                </h2>
                <CustomTile sub={customOption} archetypeKey={archetypeKey} />
              </section>
            )}
          </div>

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
    </div>
  );
}

function isNextRedirect(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const digest = (err as { digest?: unknown }).digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function SubCatCheckbox({
  sub,
  checked,
  onToggle,
}: {
  sub: SubCategory;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group relative w-full text-left overflow-hidden bg-paper border border-hairline rounded-2xl hover:border-forest hover:shadow-card transition-all"
      style={{ minHeight: 124 }}
      aria-pressed={checked}
    >
      <div
        className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 ${
          checked ? 'scale-105' : ''
        }`}
        style={{ backgroundImage: `url('${sub.bgImage}')` }}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-60 ${
          checked ? 'opacity-60' : 'opacity-100'
        }`}
        style={{ background: CARD_OVERLAY_GRADIENT }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex items-start gap-3 p-4 pr-6 max-w-[48%] sm:max-w-[52%]">
        <Checkbox checked={checked} />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base sm:text-lg text-ink leading-tight">
            {sub.label}
          </h3>
          <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-snug">
            {sub.description}
          </p>
        </div>
      </div>
    </button>
  );
}

function CustomTile({
  sub,
  archetypeKey,
}: {
  sub: SubCategory;
  archetypeKey: OnboardingArchetype;
}) {
  const back = `/collections?archetype=${archetypeKey}`;
  return (
    <Link
      href={`/collections/custom/new?next=${encodeURIComponent(back)}`}
      className="group relative w-full text-left flex items-center gap-4 bg-paper border-2 border-dashed border-gold rounded-2xl p-5 hover:border-forest hover:shadow-card transition-all"
    >
      <div className="shrink-0 relative w-16 h-16 rounded-xl overflow-hidden bg-gold-soft/60">
        <Image
          src={sub.bgImage}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-base sm:text-lg text-ink leading-tight">
            {sub.label}
          </h3>
          <span className="text-[10px] uppercase tracking-widest text-gold-deep">
            New
          </span>
        </div>
        <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-snug">
          {sub.description}
        </p>
      </div>
      <span className="shrink-0 text-forest text-lg">→</span>
    </Link>
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
